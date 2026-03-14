import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';

// Selecting the schema structure natively from DB mappings
export type User = InferSelectModel<typeof users> & {
  department?: string | null;
  status?: string | null;
  logStatus?: string | null;
  lastLogTime?: string | Date | null;
  skillTags?: string[] | null;
  role: 'owner' | 'admin' | 'member';
};

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // Users list is quite stable
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<User>) => {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onMutate: async (updatedProfile) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      // Update in all lists
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((u) => (u.email === updatedProfile.email ? { ...u, ...updatedProfile } : u));
      });

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['users'], context?.previousUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'none' }); // User profiles appear in tickets
    },
  });
}
