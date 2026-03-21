import { QueryClient } from '@tanstack/react-query';
import type { OrganizationDetails } from '@/hooks/useOrganization';

interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  [key: string]: unknown;
}

/**
 * Cache domain for Organization-level optimistic updates.
 * Mirrors the pattern of UserDomain in lib/cache/domains/users.ts.
 */
export const OrganizationDomain = {
  /**
   * Optimistically swaps the org logo URL across all relevant cache entries.
   * Called before the PATCH request so the UI feels instant.
   */
  softSwapLogo: (queryClient: QueryClient, orgId: string, newLogoUrl: string) => {
    // 1. Update the active org details query
    queryClient.setQueryData(
      ['active-organization-details'],
      (old: OrganizationDetails | undefined) => (old ? { ...old, logo: newLogoUrl } : old)
    );
    // 2. Update the list-organizations query (used by OrgSwitcher)
    queryClient.setQueryData(
      ['list-organizations'],
      (old: OrganizationListItem[] | undefined) =>
        old?.map((o) => (o.id === orgId ? { ...o, logo: newLogoUrl } : o)) ?? old
    );
  },

  /**
   * Full org details sync — used by onSettled after the PATCH completes.
   */
  sync: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: ['active-organization-details'],
      refetchType: 'none',
    });
    queryClient.invalidateQueries({ queryKey: ['list-organizations'], refetchType: 'none' });
  },
};
