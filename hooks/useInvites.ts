/**
 * Organization management hooks — wraps better-auth client methods with
 * TanStack Query for reactive, cached state.
 *
 * Covers:
 * - Org members (list, remove, update role)
 * - Org invitations (list pending, invite, cancel)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { CacheCore } from '@/lib/cache/core';
import { nanoid } from 'nanoid';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgMember {
  id: string; // member record ID
  userId: string;
  organizationId: string;
  role: OrgRole;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
}

export interface OrgInvitation {
  id: string;
  email: string;
  role: OrgRole;
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  expiresAt: Date | string;
  organizationId: string;
  createdAt: Date | string;
  inviterId: string;
}

// ─── Members ─────────────────────────────────────────────────────────────────

/** List all active members in the current organization */
export function useOrgMembers() {
  return useQuery({
    queryKey: ['org-members'],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers();
      if (error) throw new Error(error.message ?? 'Failed to fetch members');
      return (data?.members ?? []) as unknown as OrgMember[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Update the org-level role of a member */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: OrgRole }) => {
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role,
      });
      if (error) throw new Error(error.message ?? 'Failed to update role');
    },
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['org-members'] });
      const previousMembers = queryClient.getQueryData(['org-members']);

      queryClient.setQueryData(['org-members'], (old: OrgMember[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((m) => (m.id === memberId ? { ...m, role } : m));
      });

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['org-members'], context?.previousMembers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members'], refetchType: 'none' });
    },
  });
}

/** Remove a member from the organization */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });
      if (error) throw new Error(error.message ?? 'Failed to remove member');
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: ['org-members'] });
      const previousMembers = queryClient.getQueryData(['org-members']);

      queryClient.setQueryData(['org-members'], (old: OrgMember[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.filter((m) => m.id !== memberId);
      });

      return { previousMembers };
    },
    onError: (err, memberId, context) => {
      queryClient.setQueryData(['org-members'], context?.previousMembers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members'], refetchType: 'none' });
    },
  });
}

// ─── Invitations ─────────────────────────────────────────────────────────────

/** List all pending invitations for the current organization (admin view) */
export function useOrgInvitations() {
  return useQuery({
    queryKey: ['org-invitations'],
    queryFn: async () => {
      const res = await fetch('/api/invites');
      if (!res.ok) throw new Error('Failed to fetch invitations');
      return res.json() as Promise<OrgInvitation[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Send an invitation to join the current organization */
export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: OrgRole | string }) => {
      const { error } = await authClient.organization.inviteMember({
        email,
        role: role as OrgRole,
      });
      if (error) throw new Error(error.message ?? 'Failed to send invitation');
    },
    onMutate: async (newInvite) => {
      await queryClient.cancelQueries({ queryKey: ['org-invitations'] });
      const previousInvites = queryClient.getQueryData(['org-invitations']);

      CacheCore.prependToLists(queryClient, ['org-invitations'], {
        ...newInvite,
        id: 'temp-' + nanoid(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return { previousInvites };
    },
    onError: (err, newInvite, context) => {
      queryClient.setQueryData(['org-invitations'], context?.previousInvites);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations'], refetchType: 'none' });
    },
  });
}

/** Cancel/revoke a pending invitation */
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (error) throw new Error(error.message ?? 'Failed to cancel invitation');
    },
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: ['org-invitations'] });
      const previousInvites = queryClient.getQueryData(['org-invitations']);

      CacheCore.removeFromLists(queryClient, ['org-invitations'], invitationId);

      return { previousInvites };
    },
    onError: (err, invitationId, context) => {
      queryClient.setQueryData(['org-invitations'], context?.previousInvites);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations'], refetchType: 'none' });
    },
  });
}

// ─── Legacy re-exports (keeps old import sites compiling) ────────────────────

/** @deprecated Use `useOrgInvitations` instead */
export const useInvites = useOrgInvitations;

/** @deprecated Use `useInviteMember` instead */
export const useCreateInvite = useInviteMember;
