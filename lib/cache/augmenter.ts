import { QueryClient } from '@tanstack/react-query';
import { type User } from '@/hooks/useUsers';
import { type Project } from '@/hooks/useProjects';

/**
 * The Augmenter layer hydrates raw database models with rich relational data
 * found in the local cache. This ensures optimistic updates maintain UI full fidelity.
 */
export const CacheAugmenter = {
  /**
   * Hydrates a User reference from the ['users'] cache.
   * Silently triggers a prefetch if the user is missing.
   */
  user: (queryClient: QueryClient, userId: string | null): User | undefined => {
    if (!userId) return undefined;
    const users = queryClient.getQueryData<User[]>(['users']);
    const found = users?.find((u) => u.id === userId);

    if (!found) {
      // Trigger prefetch for the missing user
      queryClient.prefetchQuery({
        queryKey: ['users', userId],
        staleTime: 5 * 60 * 1000,
      });

      const isSystem = userId.toLowerCase() === 'system';
      const fallback: User = {
        id: userId,
        name: isSystem ? 'System' : 'Unknown User',
        email: isSystem ? 'system@internode.local' : '',
        role: 'member',
        image: null,
        username: userId,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        joinDate: new Date(),
        notificationSettings: null,
        // Optional but helpful extensions
        department: null,
        status: null,
        logStatus: null,
        lastLogTime: null,
        skillTags: [],
      };
      return fallback;
    }
    return found;
  },

  /**
   * Hydrates multiple Project references from the ['projects'] cache.
   */
  projects: (queryClient: QueryClient, projectIds: string[]): { id: string; name: string }[] => {
    if (!projectIds || projectIds.length === 0) return [];
    const allProjects = queryClient.getQueryData<Project[]>(['projects']);

    return projectIds.map((pid) => {
      const project = allProjects?.find((p) => p.id === pid);
      if (project) return { id: project.id, name: project.name };

      // Prefetch single project if missing
      queryClient.prefetchQuery({
        queryKey: ['projects', pid],
        staleTime: 5 * 60 * 1000,
      });

      return { id: pid, name: '...' };
    });
  },

  /**
   * Resolve an entity from the global Entity Registry (Section 2.1).
   */
  resolve: <T extends { id: string }>(
    queryClient: QueryClient,
    key: string[],
    id: string
  ): T | undefined => {
    const data = queryClient.getQueryData<T[]>(key);
    const found = data?.find((item: { id: string }) => item.id === id);

    if (!found) {
      queryClient.prefetchQuery({
        queryKey: [...key, id],
        staleTime: 5 * 60 * 1000,
      });
      return undefined;
    }
    return found;
  },
};
