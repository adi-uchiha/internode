import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

export interface OrganizationDetails {
  id: string;
  organizationName: string;
  organizationSlug: string;
  organizationDomain: string;
}

/**
 * Hook to fetch current organization details.
 * Wraps better-auth client state with query caching.
 */
export function useOrganization() {
  return useQuery({
    queryKey: ['active-organization-details'],
    queryFn: async () => {
      const { data, error } = await authClient.organization.getFullOrganization();
      if (error) throw new Error(error.message ?? 'Failed to fetch organization');

      return {
        id: data.id,
        organizationName: data.name,
        organizationSlug: data.slug || '',
        organizationDomain: (data.metadata as Record<string, string> | undefined)?.domain || '',
      } as OrganizationDetails;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to update organization details.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<{ name: string; slug: string }>) => {
      const { error } = await authClient.organization.update({
        data: updates,
      });
      if (error) throw new Error(error.message ?? 'Failed to update organization');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-organization-details'] });
      queryClient.invalidateQueries({ queryKey: ['list-organizations'] });
    },
  });
}
