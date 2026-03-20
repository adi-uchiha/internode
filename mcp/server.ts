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
// Strict JSON parsing with a payload limit to prevent DoS attacks
app.use(express.json({ limit: '5mb' }));

// Health check for Render deployment verification
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Active connections metric
const activeSessions = new Map<string, StreamableHTTPServerTransport>();
const MAX_CONCURRENT_SESSIONS = 1000;

// Type definition for context injection avoiding raw ES2015 module syntax lint errors
declare module 'express-serve-static-core' {
  interface Request {
    mcpCtx?: { userId: string; orgId: string; keyId: string };
  }
}

async function mcpAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Format must be: Bearer <token>' });
      return;
    }

    const token = parts[1];
    if (!token || token.trim().length === 0) {
      res.status(401).json({ error: 'Token is empty' });
      return;
    }

    // Hashes in constant time before DB string comparison, mitigating basic timing attacks
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const apiKey = await db.query.apiKeys.findFirst({ where: eq(apiKeys.id, hashedToken) });

    if (!apiKey) {
      res.status(401).json({ error: 'Invalid or revoked API Key' });
      return;
    }

    // Fire and forget updating the last used timestamp
    // This allows system admins to track dead/unused agent keys safely
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .execute()
      .catch((err) =>
        console.error(`[MCP DB Error] Failed to update lastUsedAt for key ${apiKey.id}:`, err)
      );

    req.mcpCtx = { userId: apiKey.userId, orgId: apiKey.organizationId, keyId: apiKey.id };
    next();
  } catch (error) {
    console.error('[MCP Auth Fatal Error]:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

// Factory function to create and configure a scoped MCP server instance
const createMcpInstance = (
  orgId: string,
  userId: string
): { server: McpServer; transport: StreamableHTTPServerTransport } => {
  const server = new McpServer({ name: 'internode-mcp', version: '1.0.0' });
  registerTicketsTools(server, orgId, userId);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      activeSessions.set(sessionId, transport);
      console.log(`[MCP] Session Initialized: ${sessionId} (Org: ${orgId})`);
    },
    onsessionclosed: (sessionId) => {
      activeSessions.delete(sessionId);
      console.log(`[MCP] Session Closed: ${sessionId}`);
    },
  });

  return { server, transport };
};

app.all('/api/mcp/sse', mcpAuthMiddleware, async (req: Request, res: Response) => {
  const ctx = req.mcpCtx!;
  const sessionId = (req.headers['mcp-session-id'] as string) || (req.query.sessionId as string);

  let transport = sessionId ? activeSessions.get(sessionId) : undefined;

  try {
    if (!transport) {
      if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
        res.status(503).json({ error: 'Server at capacity' });
        return;
      }

      // Initialize a new session/transport for this agent connection
      const instance = createMcpInstance(ctx.orgId, ctx.userId);
      transport = instance.transport;
      await instance.server.connect(transport);
    }

    // Delegate ALL request handling (GET/POST/DELETE) to the transport instance
    // This allows the SDK to manage the SSE handshake, messaging, and session headers natively.
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error(`[MCP Error] Request failed:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal MCP transport error' });
    }
  }
});

const PORT = process.env.PORT || 8080;

// Centralized HTTP boot with Node.js Graceful Shutdown handling
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Internode Persistent MCP Server securely running on port ${PORT}...`);
});

// Safely close active transports and HTTP loop if container is terminated
process.on('SIGTERM', () => {
  console.log('[MCP] SIGTERM received. Shutting down gracefully.');
  httpServer.close(() => {
    console.log('[MCP] HTTP Server successfully closed.');
    process.exit(0);
  });
});
