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
   * Hydrates a Project reference from the ['projects'] cache.
   */
  project: (
    queryClient: QueryClient,
    projectId: string | null
  ): { id: string; name: string } | undefined => {
    if (!projectId) return undefined;
    const projects = queryClient.getQueryData<Project[]>(['projects']);
    const project = projects?.find((p) => p.id === projectId);
    return project ? { id: project.id, name: project.name } : undefined;
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
