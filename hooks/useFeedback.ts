import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    queryFn: async () => {
      const res = await fetch('/api/feedback');
      if (!res.ok) throw new Error('Failed to fetch feedback');
      return res.json();
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      type,
      comment,
    }: {
      id: string;
      type: 'log' | 'breakthrough';
      comment: string;
    }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, comment }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
