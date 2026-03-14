import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';

export interface PendingInvitation {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
}

/**
 * Domain logic for Invitation cache synchronization.
 */
export const InviteDomain = {
  /**
   * Optimistically accepts an invitation by removing it from the pending lists.
   */
  optimisticAccept: (queryClient: QueryClient, invitationId: string) => {
    CacheCore.removeFromLists(queryClient, ['user-invitations'], invitationId);
    CacheCore.removeFromLists(queryClient, ['org-invitations'], invitationId);
  },

  /**
   * Synchronizes server response for invitations into the cache.
   */
  sync: (queryClient: QueryClient, type: 'user' | 'org', data: PendingInvitation[]) => {
    const key = type === 'user' ? 'user-invitations' : 'org-invitations';
    queryClient.setQueryData([key], data);
  },
};
