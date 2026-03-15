import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { projects } from '@/db/schema';
import { CacheManager } from '@/lib/cache/manager';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';

export type Project = InferSelectModel<typeof projects>;

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/api/projects'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Project>) => apiClient.post<Project>('/api/projects', data),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData(['projects']);

      CacheManager.projects.optimisticCreate(queryClient, {
        ...newProject,
        id: 'temp-' + nanoid(),
        createdAt: new Date().toISOString(),
      } as unknown as Project);

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects'], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'none' });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/projects/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData(['projects']);

      CacheManager.projects.optimisticDelete(queryClient, id);

      return { previousProjects };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['projects'], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'none' });
    },
  });
}
