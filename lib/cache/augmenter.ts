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
   */
  user: (queryClient: QueryClient, userId: string | null): User | undefined => {
    if (!userId) return undefined;
    const users = queryClient.getQueryData<User[]>(['users']);
    return users?.find((u) => u.id === userId);
  },

  /**
   * Hydrates multiple Project references from the ['projects'] cache.
   */
  projects: (queryClient: QueryClient, projectIds: string[]): { id: string; name: string }[] => {
    if (!projectIds || projectIds.length === 0) return [];
    const allProjects = queryClient.getQueryData<Project[]>(['projects']);
    if (!allProjects) return [];
    return projectIds
      .map((pid) => {
        const project = allProjects.find((p) => p.id === pid);
        return project ? { id: project.id, name: project.name } : null;
      })
      .filter((p): p is { id: string; name: string } => p !== null);
  },

  /**
   * Helper to get the current authenticated user's ID from better-auth session if needed.
   * Note: In most hooks, the session is already available.
   */
  currentUser: (): User | undefined => {
    // This is a placeholder. Better-auth state is usually handled by useSession.
    // However, if we need it for cache sync, we can look up the user in the 'users' cache
    // if we have the session ID.
    return undefined;
  },
};
