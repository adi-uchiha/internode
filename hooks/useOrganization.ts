import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { CacheManager } from '@/lib/cache/manager';

export interface OrganizationDetails {
  id: string;
  organizationName: string;
  organizationSlug: string;
  organizationDomain: string;
  brandingColor?: string;
  logo?: string | null;
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
        logo: data.logo ?? null,
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
      queryClient.invalidateQueries({
        queryKey: ['active-organization-details'],
        refetchType: 'none',
      });
      queryClient.invalidateQueries({ queryKey: ['list-organizations'], refetchType: 'none' });
    },
  });
}

/**
 * Mutation to upload and persist a new org logo.
 * Uses optimistic update via CacheManager so the sidebar and settings page
 * reflect the new logo immediately, with fallback on error.
 */
export function useUpdateOrganizationLogo() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useAuth();

  return useMutation({
    mutationFn: (logoUrl: string) => apiClient.patch('/api/organization', { logo: logoUrl }),

    onMutate: async (logoUrl) => {
      await queryClient.cancelQueries({ queryKey: ['active-organization-details'] });
      const previous = queryClient.getQueryData(['active-organization-details']);
      if (activeOrgId) {
        CacheManager.organizations.softSwapLogo(queryClient, activeOrgId, logoUrl);
      }
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['active-organization-details'], context.previous);
      }
    },

    onSettled: () => CacheManager.organizations.sync(queryClient),
  });
}
