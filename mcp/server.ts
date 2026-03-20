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

// StreamableHTTPServerTransport acts as a unified sink handling both GET initialization
// and POST tool calls inside handleRequest(req, res) by utilizing query?sessionId implicit generation.
app.all('/api/mcp/sse', mcpAuthMiddleware, async (req: Request, res: Response) => {
  if (req.method === 'GET') {
    if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
      res.status(503).json({ error: 'Server at capacity, too many active connections' });
      return;
    }

    const sessionId = randomUUID();

    try {
      const ctx = req.mcpCtx!;
      console.log(`[MCP] Establishing SSE Session [${sessionId}] for Org: ${ctx.orgId}`);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });
      activeSessions.set(sessionId, transport);

      const server = new McpServer({ name: 'internode-mcp', version: '1.0.0' });

      // Wire up all capabilities specifically scoped to this user/org execution context
      registerTicketsTools(server, ctx.orgId, ctx.userId);

      await server.connect(transport);

      // Guaranteed cleanup to aggressively prevent memory leaks on dropped connections
      transport.onclose = () => {
        activeSessions.delete(sessionId);
        console.log(`[MCP] Cleaned up Session [${sessionId}]`);
      };

      await transport.handleRequest(req, res);
    } catch (error) {
      console.error(`[MCP SSE Setup Error] Session [${sessionId}]:`, error);
      activeSessions.delete(sessionId);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish robust SSE connection' });
      }
    }
  } else if (req.method === 'POST') {
    try {
      const sessionId = req.query.sessionId;
      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({ error: 'Missing or invalid sessionId parameter' });
        return;
      }

      const transport = activeSessions.get(sessionId);
      if (!transport) {
        res
          .status(404)
          .send(
            'Session Transport lost, expired, or actively disconnected. Please reconnect to /api/mcp/sse'
          );
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP Message Dispatch Error]:', error);
      res.status(500).json({ error: 'Failed to process incoming agent message' });
    }
  } else {
    res.status(405).send('Method Not Allowed');
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
