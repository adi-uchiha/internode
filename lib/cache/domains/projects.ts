import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type Project } from '@/hooks/useProjects';

/**
 * Domain logic for Project cache synchronization.
 */
export const ProjectDomain = {
  optimisticCreate: (queryClient: QueryClient, rawProject: Partial<Project>) => {
    CacheCore.prependToLists(queryClient, ['projects'], {
      id: rawProject.id || `temp-${Date.now()}`,
      ...rawProject,
    } as Project);
  },

  optimisticDelete: (queryClient: QueryClient, id: string) => {
    CacheCore.removeFromLists(queryClient, ['projects'], id);
  },

  sync: (queryClient: QueryClient, data: Project) => {
    CacheCore.updateInLists(queryClient, ['projects'], data);
  },
};
