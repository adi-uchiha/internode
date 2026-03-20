import { z } from 'zod';
import { db } from '../db';
import { tickets, organizations } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Utility to catch internal errors so that the LLM agent handles them gracefully
 * rather than hard crashing the MCP transport pipe.
 */
async function withSafeDb<T>(
  operation: () => Promise<T>
): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
  try {
    const data = await operation();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[MCP Tool Exception]:`, error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Database/Execution error occurred: ${msg}` }],
    };
  }
}

export function registerTicketsTools(server: McpServer) {
  // 1. LIST TICKETS
  server.registerTool(
    'list_tickets',
    {
      description: 'List tickets for the active organization with pagination.',
      inputSchema: {
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(50)
          .describe('Maximum number of tickets to return (max 100).'),
        offset: z.number().min(0).default(0).describe('Number of tickets to skip for pagination.'),
      },
    },
    async ({ limit, offset }, extra) => {
      const { orgId } = extra.authInfo as unknown as { orgId: string; userId: string };
      return withSafeDb(async () => {
        return await db.query.tickets.findMany({
          where: eq(tickets.organizationId, orgId),
          orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
          limit,
          offset,
        });
      });
    }
  );

  // 2. GET TICKET
  server.registerTool(
    'get_ticket',
    {
      description:
        'Get detailed information about a single ticket including assignment and time logs.',
      inputSchema: {
        ticketId: z.string().describe('The short ticket identifier (e.g. TASK12)'),
      },
    },
    async ({ ticketId }, extra) => {
      const { orgId } = extra.authInfo as unknown as { orgId: string; userId: string };
      try {
        const ticket = await db.query.tickets.findFirst({
          where: and(eq(tickets.organizationId, orgId), eq(tickets.ticketId, ticketId)),
          with: {
            assignee: true,
            createdBy: true,
            timeLogs: true,
          },
        });

        if (!ticket) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Ticket ${ticketId} not found.` }],
          };
        }

        return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
      } catch (error) {
        console.error(`[MCP Get Ticket]:`, error);
        return { isError: true, content: [{ type: 'text', text: 'Database retrieval error.' }] };
      }
    }
  );

  // 3. CREATE TICKET
  server.registerTool(
    'create_ticket',
    {
      description: 'Create a new Jira-style ticket/task.',
      inputSchema: {
        title: z.string().describe('The descriptive title of the ticket'),
        description: z.string().optional().describe('Detailed markdown description'),
        priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
        status: z.enum(['todo', 'in-progress', 'in-review', 'done', 'unplanned']).default('todo'),
        assigneeId: z.string().optional().describe('User ID of the assignee, if known'),
      },
    },
    async ({ title, description, priority, status, assigneeId }, extra) => {
      const { orgId, userId: authorUserId } = extra.authInfo as unknown as {
        orgId: string;
        userId: string;
      };
      try {
        const [updatedOrg] = await db
          .update(organizations)
          .set({ ticketCounter: sql`${organizations.ticketCounter} + 1` })
          .where(eq(organizations.id, orgId))
          .returning({ ticketCounter: organizations.ticketCounter });

        if (!updatedOrg) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Organization not found or access denied.' }],
          };
        }

        const sequentialTicketId = `TASK${updatedOrg.ticketCounter}`;
        const newTicketId = nanoid();

        const [newTicket] = await db
          .insert(tickets)
          .values({
            id: newTicketId,
            organizationId: orgId,
            ticketId: sequentialTicketId,
            title,
            description: description || '',
            priority,
            status,
            assigneeId,
            createdById: authorUserId,
          })
          .returning();

        return {
          content: [{ type: 'text', text: `Ticket successfully created: ${newTicket.ticketId}` }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[MCP Create Ticket Error]:`, error);
        return { isError: true, content: [{ type: 'text', text: `Creation failed: ${msg}` }] };
      }
    }
  );

  // 4. UPDATE TICKET
  server.registerTool(
    'update_ticket',
    {
      description: 'Update an existing ticket by its short ID (e.g. TASK12).',
      inputSchema: {
        ticketId: z.string().describe('The short ticket identifier (e.g. TASK12)'),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in-progress', 'in-review', 'done', 'unplanned']).optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        assigneeId: z.string().optional(),
      },
    },
    async ({ ticketId, title, description, status, priority, assigneeId }, extra) => {
      const { orgId } = extra.authInfo as unknown as { orgId: string; userId: string };
      try {
        const updateData: Partial<typeof tickets.$inferInsert> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

        if (Object.keys(updateData).length === 0) {
          return { content: [{ type: 'text', text: 'No valid fields provided to update.' }] };
        }

        const [updated] = await db
          .update(tickets)
          .set(updateData)
          .where(and(eq(tickets.organizationId, orgId), eq(tickets.ticketId, ticketId)))
          .returning();

        if (!updated) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Ticket ${ticketId} not found in this organization.` }],
          };
        }

        return {
          content: [{ type: 'text', text: `Ticket ${updated.ticketId} updated successfully.` }],
        };
      } catch (error) {
        console.error(`[MCP Update Ticket Error]:`, error);
        return {
          isError: true,
          content: [
            { type: 'text', text: 'Failed to update ticket due to a database/validation error.' },
          ],
        };
      }
    }
  );

  // 5. DELETE TICKET
  server.registerTool(
    'delete_ticket',
    {
      description: 'Delete a ticket permanently.',
      inputSchema: {
        ticketId: z.string().describe('The short ticket identifier (e.g. TASK12)'),
      },
    },
    async ({ ticketId }, extra) => {
      const { orgId } = extra.authInfo as unknown as { orgId: string; userId: string };
      try {
        const [deleted] = await db
          .delete(tickets)
          .where(and(eq(tickets.organizationId, orgId), eq(tickets.ticketId, ticketId)))
          .returning();

        if (!deleted) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Ticket ${ticketId} not found in this organization.` }],
          };
        }

        return { content: [{ type: 'text', text: `Ticket ${ticketId} deleted.` }] };
      } catch (error) {
        console.error(`[MCP Delete Ticket Error]:`, error);
        return { isError: true, content: [{ type: 'text', text: 'Failed to delete ticket.' }] };
      }
    }
  );
}
