import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { weeklyGoals, goalItems } from '@/db/schema';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';

export type GoalItem = InferSelectModel<typeof goalItems>;
export type WeeklyGoalWithItems = InferSelectModel<typeof weeklyGoals> & {
  items: GoalItem[];
};

export function useGoals() {
  return useQuery<WeeklyGoalWithItems>({
    queryKey: ['goals', 'current'],
    queryFn: () => apiClient.get('/api/goals'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weeklyGoalId, text }: { weeklyGoalId: string; text: string }) =>
      apiClient.post<GoalItem>('/api/goals', { weeklyGoalId, text }),
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
      queryClient.invalidateQueries({ queryKey: ['goals', 'current'], refetchType: 'none' });
    },
  });
}

export function useUpdateGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed, text }: { id: string; completed?: boolean; text?: string }) =>
      apiClient.patch<GoalItem>(`/api/goals/${id}`, { completed, text }),
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
      queryClient.invalidateQueries({ queryKey: ['goals', 'current'], refetchType: 'none' });
    },
  });
}

export function useDeleteGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/goals/${id}`),
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
      queryClient.invalidateQueries({ queryKey: ['goals', 'current'], refetchType: 'none' });
    },
  });
}
