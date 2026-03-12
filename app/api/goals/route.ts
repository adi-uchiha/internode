import { NextResponse } from 'next/server';
import { db } from '@/db';
import { weeklyGoals, goalItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

// Get or auto-create the current week's goal list for the session user
export const GET = withErrorHandler(async (req, { session }) => {
  // Get current week start (Monday)
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(today.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  let goal = await db.query.weeklyGoals.findFirst({
    where: and(eq(weeklyGoals.userId, session!.user.id), eq(weeklyGoals.weekStart, weekStart)),
    with: {
      items: true,
    },
  });

  // Auto-create if none exists for this week
  if (!goal) {
    const newGoalId = nanoid();
    await db.insert(weeklyGoals).values({
      id: newGoalId,
      userId: session!.user.id,
      weekStart,
    });

    goal = {
      id: newGoalId,
      userId: session!.user.id,
      weekStart,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    } as unknown as typeof goal;
  }

  return NextResponse.json(goal);
});

// Add a new goal item to a specific weekly goal
export const POST = withErrorHandler(async (request) => {
  const { weeklyGoalId, text } = await request.json();

  if (!weeklyGoalId || !text) {
    throw new BadRequestError('Missing required fields');
  }

  const [newItem] = await db
    .insert(goalItems)
    .values({
      id: nanoid(),
      weeklyGoalId,
      text,
      completed: false,
    })
    .returning();

  return NextResponse.json(newItem, { status: 201 });
});
