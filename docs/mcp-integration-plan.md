# Internode: MCP Server & M2M Auth Implementation Plan

## 1. Architectural Overview

As Internode scales into a comprehensive Jira alternative, it requires rigorous Machine-to-Machine (M2M) capabilities. Agents (like Cursor or Antigravity) and external pipelines (like GitHub Actions) need to interact with the Next.js server autonomously.

To facilitate this, we will integrate the **Model Context Protocol (MCP)** using HTTP Server-Sent Events (SSE). To securely authenticate these automated streams without relying on Better Auth browser cookies, we will build a custom **API Key Infrastructure** tightly integrated with your existing multi-tenant Drizzle architecture (`users` -> `members` -> `organizations`).

---

## 2. Database Schema (`db/schema/auth.ts`)

We bypass Better Auth's simple API key plugin in favor of a relational, first-class Drizzle schema. This allows strict cascading rules and granular RBAC.

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const apiKeys = pgTable('api_keys', {
  // We store the SHA-256 hash of the token, NEVER the raw token.
  id: text('id').primaryKey(),

  name: text('name').notNull(), // e.g., "GitHub Actions Auto-Triage"
  hint: text('hint').notNull(), // e.g., "in_....a1b2" (First 3 + Last 4)

  // Hard scope the key to an organization.
  // If the org is deleted, the key is cascaded.
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // The creator of the key or the Bot User
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## 3. Cryptographic Token Generation

When a user creates a new token in the UI, the Next.js Server Action will handle generation.

1. **Generation**: Use `crypto.randomBytes(32)` to generate 256 bits of entropy.
2. **Prefixing**: Encode as hex or base64url and prepend a standard prefix (e.g., `in_...` for Internode).
3. **Hashing**: Use `crypto.createHash('sha256')` to hash the string. Store the Hash in Drizzle.
4. **Display**: Return the unhashed `in_...` string to the client **exactly once**.

---

## 4. Middleware & Context Injection (`lib/api-handler.ts`)

We must adapt `withErrorHandler` to intercept the `Authorization` header _before_ falling back to the Better Auth browser session. (Note: This is critical for standard Next.js REST API usage by agents).

```typescript
// Proposed snippet inside withErrorHandler:
import { createHash } from 'crypto';

let userId: string | null = null;
let orgId: string | null = null;
let userRole: import('./org-utils').OrgRole | null = null;

const authHeader = req.headers.get('authorization');

if (authHeader && authHeader.startsWith('Bearer ')) {
  // 1. Validate API Key
  const rawToken = authHeader.replace('Bearer ', '');
  const hashedToken = createHash('sha256').update(rawToken).digest('hex');

  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, hashedToken),
  });

  if (!apiKey) throw new ApiError('Invalid API Key', 401);

  userId = apiKey.userId;
  orgId = apiKey.organizationId;

  // 2. We STILL query the `members` table to ensure the user (or bot)
  // actually has access to the org and hasn't had their role revoked.
  const memberData = await db.query.members.findFirst({
    where: and(eq(members.userId, userId), eq(members.organizationId, orgId)),
  });

  if (!memberData) throw new ApiError('Key owner is not a member of this org', 403);
  userRole = memberData.role;
} else {
  // 3. Fallback to Standard Better Auth Browser Session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ApiError('Unauthorized', 401);

  // ... proceed with existing member lookups ...
}

// 4. Role validation proceeds seamlessly regardless of Auth method.
```

---

## 5. MCP Server Node & Transport Interfaces (Standalone Monorepo Approach)

> **⚠️ Edge/Vercel Caveat**: SSE connections are long-running streams (stateful). Standard Vercel Serverless instances (Lambdas) are stateless. If deployed strictly on Vercel without an external Redis broker, `POST` requests from the agent might map to a different Vercel container than the active `GET` stream.

**Solution**: The MCP server must be extracted into a standalone NodeJS/Express file (`mcp/server.ts`) that runs indefinitely. Because this file lives inside the Next.js monorepo, it has zero-friction access to your existing Drizzle schemas and API Key logic.

### Standalone Server Entry (`mcp/server.ts`)

This persistent Node.js/Bun script maintains stateful SSE connections continuously.

```typescript
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createHash, randomUUID } from 'crypto';
import { db } from '../db';
import { apiKeys, members } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const app = express();
app.use(express.json());

// This map lives forever in the Render/Railway persistent memory
const globalTransports = new Map<string, SSEServerTransport>();

// Express Middleware to handle M2M Auth exactly like Next.js withErrorHandler
async function mcpAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer Token' });
  }
  const hashedToken = createHash('sha256').update(authHeader.replace('Bearer ', '')).digest('hex');
  const apiKey = await db.query.apiKeys.findFirst({ where: eq(apiKeys.id, hashedToken) });

  if (!apiKey) return res.status(401).json({ error: 'Invalid API Key' });

  req.ctx = { userId: apiKey.userId, orgId: apiKey.organizationId };
  next();
}

// A. The GET Endpoint: Initializes Connection
app.get('/api/mcp/sse', mcpAuthMiddleware, async (req, res) => {
  const sessionId = randomUUID();
  const transport = new SSEServerTransport('/api/mcp/message?sessionId=' + sessionId, res);
  globalTransports.set(sessionId, transport);

  const server = new McpServer({ name: 'internode-mcp', version: '1.0.0' });
  registerTicketsTools(server, req.ctx.orgId, req.ctx.userId); // Binds org context

  await server.connect(transport);
});

// B. The POST Endpoint: Handles Agent Tool execution
app.post('/api/mcp/message', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = globalTransports.get(sessionId);

  if (!transport) return res.status(404).send('Session Transport lost or timed out');
  await transport.handlePostMessage(req.body);
});

app.listen(process.env.PORT || 8080, () => {
  console.log('Internode Persistent MCP Server running...');
});
```

---

## 6. Defining the AI Tools (McpServer Binding)

The power of Internode MCP comes from exposing specific `tickets` routes inside Drizzle directly to standard LLM parameters.

```typescript
import { z } from 'zod';
import { tickets } from '@/db/schema';

function registerTicketsTools(server: McpServer, orgId: string, authorUserId: string) {
  // Tool: create_ticket
  server.tool(
    'create_ticket',
    {
      title: z.string().describe('The descriptive title of the ticket'),
      description: z.string().optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
    },
    async ({ title, description, priority }) => {
      const newTicket = await db
        .insert(tickets)
        .values({
          id: generateInternalId(), // your standard nanoid/uuid implementation
          ticketId: await getNextTicketSequence(orgId),
          organizationId: orgId, // Forced explicitly by the validated API KEY!
          title,
          description,
          priority,
          createdById: authorUserId,
          status: 'todo',
        })
        .returning();

      return {
        content: [{ type: 'text', text: `Ticket created with ID: ${newTicket[0].ticketId}` }],
      };
    }
  );

  // You would register `update_ticket`, `delete_ticket`, and `list_tickets` identically.
}
```

---

## 7. Future Proofing: Service Accounts / Bots

When an organization inevitably points GitHub Actions webhook to your API, or runs a complex multi-agent system, they do not want the tickets to look like an arbitrary human created them.

**This Custom API Schema natively solves this:**

1. You will add a flag to your users table: `isBot: boolean`.
2. A Company Admin goes to settings -> "Integrations" -> "Create Bot".
3. The system securely provisions a hidden row in `users` (`name: "Triage Bot"`), and a row in `members` pointing that bot to the current `organizationId`.
4. The system generates an API Key where `userId = botUserId`.
5. When the MCP endpoint intercepts the key, `tickets.createdById` defaults to the Bot.

The Drizzle layer, the Context Injection middleware, and the MCP Tool implementations will continue to work perfectly **without any refactoring**, because a Bot is structurally identical to a human actor within your database constraints.

---

## 8. Deployment Architecture (Monorepo Dual-Deploy)

Both the Next.js frontend and the standalone MCP Server live exclusively inside the Internode repository. This ensures zero code duplication.

1. **Vercel (Frontend & Standard REST):**
   - Connect the repo to Vercel.
   - Run `npm run build`. Vercel automatically ignores `mcp/server.ts`.
   - Result: Blazing fast serverless Next.js.

2. **Render or Railway (Stateful MCP Server):**
   - Connect the EXACT SAME repo to Render/Railway.
   - Override the build/start command to strictly run:
     `bun run mcp/server.ts`
   - Result: A stateful, 24/7 Node server holding your `globalTransports` correctly in memory, bypassing Vercel's Serverless constraints entirely.
