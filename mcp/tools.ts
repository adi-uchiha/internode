import { z } from 'zod';
import { db } from '../db';
import { tickets, organizations, users } from '../db/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EmailService } from '../lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '../lib/env';

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

export function registerTicketsTools(server: McpServer, orgId: string, userId: string) {
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
    async ({ limit, offset }) => {
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
    async ({ ticketId }) => {
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
    async ({ title, description, priority, status, assigneeId }) => {
      try {
        const [updatedOrg] = await db
          .update(organizations)
          .set({ ticketCounter: sql`${organizations.ticketCounter} + 1` })
          .where(eq(organizations.id, orgId))
          .returning({ ticketCounter: organizations.ticketCounter, name: organizations.name });

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
            createdById: userId,
          })
          .returning();

        // Trigger side effect if assigned
        if (assigneeId) {
          const assignee = await db.query.users.findFirst({
            where: eq(users.id, assigneeId),
            columns: { email: true, name: true },
          });
          const assigner = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { email: true, name: true },
          });

          if (assignee && assigner) {
            void EmailService.ticketAssigned({
              organizationId: orgId,
              assigneeId,
              assigneeEmail: assignee.email,
              payload: {
                to: assignee.email,
                organizationName: updatedOrg.name,
                assigneeName: assignee.name,
                assignerName: assigner.name || assigner.email,
                ticketShortId: newTicket.ticketId,
                ticketTitle: newTicket.title,
                ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${newTicket.ticketId}`,
              },
            });
          }
        }

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
    async ({ ticketId, title, description, status, priority, assigneeId }) => {
      try {
        const existingTicket = await db.query.tickets.findFirst({
          where: and(eq(tickets.organizationId, orgId), eq(tickets.ticketId, ticketId)),
        });

        if (!existingTicket) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Ticket ${ticketId} not found in this organization.` }],
          };
        }

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

        if (updated) {
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
            columns: { name: true },
          });
          const organizationName = org?.name ?? 'Your Organization';
          const triggerUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { email: true, name: true },
          });
          const triggerUserName = triggerUser?.name || triggerUser?.email || 'MCP Agent';

          // Assignee change notification
          if (assigneeId !== undefined && assigneeId !== existingTicket.assigneeId && assigneeId) {
            const assignee = await db.query.users.findFirst({
              where: eq(users.id, assigneeId),
              columns: { email: true, name: true },
            });
            if (assignee) {
              void EmailService.ticketAssigned({
                organizationId: orgId,
                assigneeId,
                assigneeEmail: assignee.email,
                payload: {
                  to: assignee.email,
                  organizationName,
                  assigneeName: assignee.name,
                  assignerName: triggerUserName,
                  ticketShortId: updated.ticketId,
                  ticketTitle: updated.title,
                  ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${updated.ticketId}`,
                },
              });
            }
          }

          // Status change notification
          if (status !== undefined && status !== existingTicket.status) {
            const recipientIds = [
              existingTicket.createdById,
              existingTicket.assigneeId,
              assigneeId ?? null,
            ].filter((uid): uid is string => !!uid && uid !== userId);
            const uniqueIds = [...new Set(recipientIds)];

            if (uniqueIds.length > 0) {
              const recipientRows = await db
                .select({ id: users.id, email: users.email, name: users.name })
                .from(users)
                .where(inArray(users.id, uniqueIds));

              void EmailService.ticketStatusChanged({
                organizationId: orgId,
                ticketId: updated.id,
                excludeUserId: userId,
                recipients: recipientRows.map((r) => ({
                  userId: r.id,
                  email: r.email,
                  name: r.name,
                })),
                payload: {
                  to: [],
                  organizationName,
                  recipientName: '',
                  ticketShortId: updated.ticketId,
                  ticketTitle: updated.title,
                  oldStatus: existingTicket.status,
                  newStatus: status,
                  changedByName: triggerUserName,
                  ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${updated.ticketId}`,
                },
              });
            }
          }
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
    async ({ ticketId }) => {
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
