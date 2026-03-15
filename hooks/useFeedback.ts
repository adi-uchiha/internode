import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface FeedbackLog {
  id: string;
  user?: { name: string };
  date: string;
  hours: number;
  isBreakthrough: boolean;
  note: string;
}

export interface FeedbackBreakthrough {
  id: string;
  user?: { name: string };
  date: string;
  title: string;
  description: string;
  skillTags?: string[];
}

export interface FeedbackData {
  logs: FeedbackLog[];
  breakthroughs: FeedbackBreakthrough[];
}

export function useFeedback() {
  return useQuery<FeedbackData>({
    queryKey: ['feedback'],
    queryFn: () => apiClient.get('/api/feedback'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      type,
      comment,
    }: {
      id: string;
      type: 'log' | 'breakthrough';
      comment: string;
    }) => apiClient.post(`/api/feedback/${id}`, { type, comment }),
    onMutate: async ({ id, type }) => {
      await queryClient.cancelQueries({ queryKey: ['feedback'] });

      const previousData = queryClient.getQueryData<FeedbackData>(['feedback']);

      if (previousData) {
        queryClient.setQueryData<FeedbackData>(['feedback'], {
          logs: type === 'log' ? previousData.logs.filter((l) => l.id !== id) : previousData.logs,
          breakthroughs:
            type === 'breakthrough'
              ? previousData.breakthroughs.filter((b) => b.id !== id)
              : previousData.breakthroughs,
        });
      }

      return { previousData };
    },
    onError: (err, variables, context: unknown) => {
      if (context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(
          ['feedback'],
          (context as { previousData: FeedbackData }).previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
