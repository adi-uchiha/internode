import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Invite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedById: string;
  createdAt: string;
  expiresAt: string;
}

export function useInvites() {
  return useQuery<Invite[]>({
    queryKey: ['invites'],
    queryFn: async () => {
      const res = await fetch('/api/invites');
      if (!res.ok) throw new Error('Failed to fetch invites');
      return res.json();
    },
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invite: { email: string; role: string }) => {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invite),
      });
      if (!res.ok) throw new Error('Failed to create invite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}
