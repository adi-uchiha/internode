import { NextResponse } from 'next/server';
import { db } from '@/db';
import { weeklyGoals, goalItems } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Get or auto-create the current week's goal list for the session user
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current week start (Monday)
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(today.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  try {
    let goal = await db.query.weeklyGoals.findFirst({
      where: and(eq(weeklyGoals.userId, session.user.id), eq(weeklyGoals.weekStart, weekStart)),
      with: {
        items: true,
      },
    });

    // Auto-create if none exists for this week
    if (!goal) {
      const newGoalId = nanoid();
      await db.insert(weeklyGoals).values({
        id: newGoalId,
        userId: session.user.id,
        weekStart,
      });

      goal = {
        id: newGoalId,
        userId: session.user.id,
        weekStart,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching weekly goals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Add a new goal item to a specific weekly goal
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { weeklyGoalId, text } = await request.json();

    if (!weeklyGoalId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
  } catch (error) {
    console.error('Error creating goal item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
