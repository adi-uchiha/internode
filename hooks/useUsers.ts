import { useQuery } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';

// Selecting the schema structure natively from DB mappings
export type User = InferSelectModel<typeof users>;

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      return res.json();
    },
  });
}
