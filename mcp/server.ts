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
app.use(cors());
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
      console.log(`[MCP] Session Link Established: ${sessionId} (Org: ${orgId}, User: ${userId})`);
    },
    onsessionclosed: (sessionId) => {
      activeSessions.delete(sessionId);
      console.log(`[MCP] Session Destroyed: ${sessionId}`);
    },
  });

  server.connect(transport).catch((err) => console.error('[MCP] Fatal connection error:', err));
  return transport;
};

// Robust Auth Middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mcpAuthMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    // Case-insensitive header check
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.toLowerCase().startsWith('bearer ')
    ) {
      return res.status(401).json({ error: 'Missing or malformed Bearer token' });
    }

    const token = authHeader.split(' ')[1];
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const apiKey = await db.query.apiKeys.findFirst({ where: eq(apiKeys.id, hashedToken) });

    if (!apiKey) {
      console.warn(`[MCP Auth] Invalid token attempted: ${token.substring(0, 8)}...`);
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    // Attach our own safe namespace for identity
    req.mcpProxyIdentity = { userId: apiKey.userId, orgId: apiKey.organizationId };

    // Explicitly set req.auth because the SDK's Node wrapper specifically looks for it
    req.auth = req.mcpProxyIdentity;

    db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id)).execute();
    next();
  } catch (error) {
    console.error('[MCP Auth Internal Error]:', error);
    res.status(500).json({ error: 'Internal Auth Error' });
  }
}

app.get('/health', (req, res) => res.status(200).send('OK'));

app.all('/api/mcp/sse', mcpAuthMiddleware, async (req: Request, res: Response) => {
  // Debug log headers to verify sessionId arrival
  const incomingSessionId =
    (req.headers['mcp-session-id'] as string) || (req.query.sessionId as string);

  console.log(`[MCP ${req.method}] SessionID: ${incomingSessionId || 'NONE (New Bootstrap)'}`);

  let transport = incomingSessionId ? activeSessions.get(incomingSessionId) : undefined;

  try {
    if (!transport) {
      if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
        return res.status(503).json({ error: 'Capacity reached' });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const identity = (req as any).mcpProxyIdentity;
      transport = createMcpInstance(identity.orgId, identity.userId);
    }

    /**
     * PASSING req.body is the fix for "Invalid JSON"
     * PASSING req.auth ensures tool handlers see the User/Org identity
     */
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP Transport Fatal]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Transport Pipe Failure' });
    }
  }
});

const PORT = process.env.PORT || 8080;
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Internode MCP (Diagnostics Mode) listening on port ${PORT}...`);
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
