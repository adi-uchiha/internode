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
// Strict JSON parsing with a payload limit
app.use(express.json({ limit: '5mb' }));

/**
 * PRODUCTION-GRADE SESSION MANAGEMENT
 */
const activeSessions = new Map<string, StreamableHTTPServerTransport>();
const MAX_CONCURRENT_SESSIONS = 1000;

// Factory to create and connect a fresh, scoped MCP instance
const createMcpInstance = (orgId: string) => {
  const server = new McpServer({ name: 'internode-mcp', version: '1.0.0' });
  registerTicketsTools(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      activeSessions.set(sessionId, transport);
      console.log(`[MCP] Session Established: ${sessionId} (Org: ${orgId})`);
    },
    onsessionclosed: (sessionId) => {
      activeSessions.delete(sessionId);
      console.log(`[MCP] Session Destroyed: ${sessionId}`);
    },
  });

  // Attach server logic to this transport's lifecycle
  server.connect(transport).catch((err) => console.error('[MCP] Connection failed:', err));

  return transport;
};

// Middleware to authorize machine-to-machine agent requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mcpAuthMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const token = authHeader.split(' ')[1];
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const apiKey = await db.query.apiKeys.findFirst({ where: eq(apiKeys.id, hashedToken) });

    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    // Set auth context for tools
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).auth = { userId: apiKey.userId, orgId: apiKey.organizationId };

    // Track usage
    db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id)).execute();

    next();
  } catch (error) {
    console.error('[MCP Auth Error]:', error);
    res.status(500).json({ error: 'Authentication internal failure' });
  }
}

app.get('/health', (req, res) => res.status(200).send('OK'));

/**
 * UNIFIED MCP HANDLER
 */
app.all('/api/mcp/sse', mcpAuthMiddleware, async (req: Request, res: Response) => {
  const sessionId = (req.headers['mcp-session-id'] as string) || (req.query.sessionId as string);
  let transport = sessionId ? activeSessions.get(sessionId) : undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = (req as any).auth;

    if (!transport) {
      if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
        return res.status(503).json({ error: 'Server Capacity Reached' });
      }

      console.log(`[MCP ${req.method}] New session bootstrap for auth user ${auth?.userId}`);
      transport = createMcpInstance(auth?.orgId);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP Transport Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal transport failure' });
    }
  }
});

const PORT = process.env.PORT || 8080;
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Internode MCP Persistent Server active on port ${PORT}...`);
});

process.on('SIGTERM', () => {
  console.log('[MCP] Shutting down.');
  httpServer.close(() => process.exit(0));
});
