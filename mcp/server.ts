import express, { Response, NextFunction } from 'express';
import { Request } from 'express-serve-static-core';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createHash, randomUUID } from 'crypto';
import { db } from '../db';
import { apiKeys } from '../db/schema';
import { eq } from 'drizzle-orm';
import { registerTicketsTools } from './tools';

const app = express();

// Hardened CORS to ensure the bridge can read the session headers
app.use(
  cors({
    exposedHeaders: ['mcp-session-id', 'mcp-protocol-version', 'Authorization'],
  })
);

app.use(express.json({ limit: '5mb' }));

const activeSessions = new Map<string, StreamableHTTPServerTransport>();
const MAX_CONCURRENT_SESSIONS = 1000;

const createMcpInstance = (orgId: string, userId: string) => {
  const server = new McpServer({ name: 'internode-mcp', version: '1.0.0' });
  registerTicketsTools(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      activeSessions.set(sessionId, transport);
      console.log(
        `[MCP Registry] Registered Session: ${sessionId} (Org: ${orgId}, User: ${userId})`
      );
    },
    onsessionclosed: (sessionId) => {
      activeSessions.delete(sessionId);
      console.log(`[MCP Registry] Dropped Session: ${sessionId}`);
    },
  });

  server.connect(transport).catch((err) => console.error('[MCP] Connection failed:', err));
  return transport;
};

// Robust Auth Middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mcpAuthMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.toLowerCase().startsWith('bearer ')
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const apiKey = await db.query.apiKeys.findFirst({ where: eq(apiKeys.id, hashedToken) });

    if (!apiKey) {
      return res.status(401).json({ error: 'Auth failed' });
    }

    req.mcpProxyIdentity = { userId: apiKey.userId, orgId: apiKey.organizationId };
    req.auth = req.mcpProxyIdentity;

    db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id)).execute();
    next();
  } catch (error) {
    console.error('[MCP Auth Fatal]:', error);
    res.status(500).json({ error: 'Internal Auth Error' });
  }
}

app.get('/health', (req, res) => {
  const origin = req.get('origin') || req.ip || 'unknown';
  console.log(`[Health Check] ${new Date().toISOString()} - Origin: ${origin}`);
  res.status(200).send('OK');
});

app.all('/api/mcp/sse', mcpAuthMiddleware, async (req: Request, res: Response) => {
  const incomingSessionId =
    (req.headers['mcp-session-id'] as string) || (req.query.sessionId as string);

  let transport = incomingSessionId ? activeSessions.get(incomingSessionId) : undefined;

  if (transport) {
    console.log(`[MCP] Using active session: ${incomingSessionId}`);
  } else {
    if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
      return res.status(503).json({ error: 'Capacity reached' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const identity = (req as any).mcpProxyIdentity;
    console.log(`[MCP] Bootstrapping new session for Org: ${identity.orgId}`);
    transport = createMcpInstance(identity.orgId, identity.userId);
  }

  try {
    // Explicitly delegate to SDK with header/body support
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP Pipe Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Error' });
    }
  }
});

const PORT = process.env.PORT || 8080;
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Internode MCP (Validated Mode) on port ${PORT}...`);
});

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
