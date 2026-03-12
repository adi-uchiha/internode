import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Workspace {
  organizationName: string;
  organizationDomain: string;
}

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      if (!res.ok) throw new Error('Failed to fetch workspace');
      return res.json() as Promise<Workspace>;
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspace: Partial<Workspace>) => {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspace),
      });
      if (!res.ok) throw new Error('Failed to update workspace');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}
