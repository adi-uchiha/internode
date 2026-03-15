import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, projects } from '@/db/schema';
import { ilike, or, eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { ApiError } from '@/lib/api-error';

export const GET = withErrorHandler(async (req, { orgId }) => {
  if (!orgId) {
    throw new ApiError('Organization ID is required', 400, 'org_id_required');
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return NextResponse.json({ tickets: [], projects: [] });
  }

  const [matchedTickets, matchedProjects] = await Promise.all([
    db
      .select({
        id: tickets.id,
        ticketId: tickets.ticketId,
        title: tickets.title,
        status: tickets.status,
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.organizationId, orgId),
          or(ilike(tickets.title, `%${query}%`), ilike(tickets.ticketId, `%${query}%`))
        )
      )
      .limit(10),
    db
      .select({
        id: projects.id,
        name: projects.name,
      })
      .from(projects)
      .where(and(eq(projects.organizationId, orgId), ilike(projects.name, `%${query}%`)))
      .limit(5),
  ]);

  return NextResponse.json({
    tickets: matchedTickets,
    projects: matchedProjects,
  });
});
