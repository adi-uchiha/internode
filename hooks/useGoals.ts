import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { weeklyGoals, goalItems } from '@/db/schema';
import { nanoid } from 'nanoid';

export type GoalItem = InferSelectModel<typeof goalItems>;
export type WeeklyGoalWithItems = InferSelectModel<typeof weeklyGoals> & {
  items: GoalItem[];
};

export function useGoals() {
  return useQuery<WeeklyGoalWithItems>({
    queryKey: ['goals', 'current'],
    queryFn: async () => {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ weeklyGoalId, text }: { weeklyGoalId: string; text: string }) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyGoalId, text }),
      });
      if (!res.ok) throw new Error('Failed to add goal item');
      return res.json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['goals', 'current'] });
      const previousGoal = queryClient.getQueryData(['goals', 'current']);

      queryClient.setQueryData(['goals', 'current'], (old: WeeklyGoalWithItems | undefined) => {
        if (!old) return old;
        return {
          ...old,
          items: [
            ...old.items,
            {
              id: 'temp-' + nanoid(),
              weeklyGoalId: newItem.weeklyGoalId,
              text: newItem.text,
              completed: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as unknown as GoalItem,
          ],
        };
      });

      return { previousGoal };
    },
    onError: (err, newItem, context) => {
      queryClient.setQueryData(['goals', 'current'], context?.previousGoal);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'current'] });
    },
  });
}

export function useUpdateGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completed,
      text,
    }: {
      id: string;
      completed?: boolean;
      text?: string;
    }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, text }),
      });
      if (!res.ok) throw new Error('Failed to update goal item');
      return res.json();
    },
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: ['goals', 'current'] });
      const previousGoal = queryClient.getQueryData(['goals', 'current']);

      queryClient.setQueryData(['goals', 'current'], (old: WeeklyGoalWithItems | undefined) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: GoalItem) =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          ),
        };
      });

      return { previousGoal };
    },
    onError: (err, updatedItem, context) => {
      queryClient.setQueryData(['goals', 'current'], context?.previousGoal);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'current'] });
    },
  });
}

export function useDeleteGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete goal item');
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', 'current'] });
      const previousGoal = queryClient.getQueryData(['goals', 'current']);

      queryClient.setQueryData(['goals', 'current'], (old: WeeklyGoalWithItems | undefined) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item: GoalItem) => item.id !== id),
        };
      });

      return { previousGoal };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['goals', 'current'], context?.previousGoal);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'current'] });
    },
  });
}
