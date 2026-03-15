import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';
import { apiClient } from '@/lib/api-client';
import { CacheManager } from '@/lib/cache/manager';

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
    queryFn: () => apiClient.get('/api/users'),
    staleTime: 10 * 60 * 1000, // Users list is quite stable
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<User>) => apiClient.patch<User>('/api/users/profile', profile),
    onMutate: async (updatedProfile) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      // Section 9.4: Binary & Asset Cache management (Soft Swap)
      if (updatedProfile.id && updatedProfile.image) {
        CacheManager.users.softSwapImage(queryClient, updatedProfile.id, updatedProfile.image);
      }

      // 2. Generic profile sync
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((u) =>
          u.id === updatedProfile.id || u.email === updatedProfile.email
            ? { ...u, ...updatedProfile }
            : u
        );
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
