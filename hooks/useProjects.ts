import { useQuery } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { projects } from '@/db/schema';

export type Project = InferSelectModel<typeof projects>;

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      return res.json();
    },
  });
}
