---
trigger: always_on
---

# Internode MCP Deployment Architecture

This document outlines the **Split-Deployment Infrastructure** for Internode, separating the stateless Next.js frontend from the stateful MCP (Model Context Protocol) server.

## 🏗️ Architecture Overview

The system is split into two distinct execution environments to handle standard web traffic on Vercel while maintaining persistent, long-lived SSE (Server-Sent Event) connections for AI agents on Render/Railway.

### 🌐 1. Frontend & Main API (Vercel)

- **Repo Root**: `/`
- **Platform**: Vercel (Next.js 16.1 App Router)
- **Deployment**: Automatic via GitHub branch integration.
- **Role**: Handles all user-facing UI, authentication via Better Auth, and standard CRUD APIs.
- **Build Command**: `next build`
- **Output Directory**: `.next`

### 🤖 2. MCP Server (Render / Railway)

- **Repo Path**: `/mcp/server.ts`
- **Platform**: Render (Web Service).
- **Role**: Maintains persistent agent connections via SSE. It bypasses Vercel’s serverless function timeout and statelessness.
- **Environment**: Node.js (Bun Runtime)
- **Port Strategy**: Listens on `process.env.PORT` (automatically assigned by Render as `10000`).

---

## 🚀 Render/Railway Configuration Summary

| Field             | Value               | Rationale                                                                         |
| :---------------- | :------------------ | :-------------------------------------------------------------------------------- |
| **Language**      | `Node`              | The MCP server is a Node.js Express application.                                  |
| **Build Command** | `bun install`       | Only dependencies are needed; we run `.ts` directly.                              |
| **Start Command** | `bun mcp/server.ts` | Uses Bun to execute the TypeScript server entrypoint.                             |
| **Instance Type** | `Starter / Pro`     | Requires persistence; "Free" tiers on Render will sleep and drop SSE connections. |

---

## 🔐 Environment Variables Matrix

Both services MUST share the same **System of Record** (Database and Auth Secrets).

| Variable                | Needed on Vercel? | Needed on Render? | Source                                          |
| :---------------------- | :---------------- | :---------------- | :---------------------------------------------- |
| `DATABASE_URL`          | ✅ Yes            | ✅ Yes            | Neon/Postgres connection string.                |
| `BETTER_AUTH_SECRET`    | ✅ Yes            | ✅ Yes            | Shared encryption key for session parsing.      |
| `NEXT_PUBLIC_MCP_URL`   | ✅ Yes            | ❌ No             | The URL of your Render service (for UI config). |
| `AUTH_GITHUB_ID/SECRET` | ✅ Yes            | ❌ No             | Only for frontend OAuth.                        |

---

## 🛠️ Operational Notes

1.  **Drizzle Migrations**: migrations should only be run via the Vercel build pipeline or locally (`bun db:push`). The Render instance should be purely consumer-only to avoid migration deadlocks.
2.  **SSE Timeouts**: Ensure Render or any proxy (Cloudflare) has disabled "Response Buffering" or "Proxy Read Timeouts" for the `/api/mcp/sse` endpoint to prevent agents from being disconnected.
3.  **Graceful Shutdown**: The MCP server implements `process.on('SIGTERM')` to cleanly close active agent sessions before a new deployment replaces the instance.
