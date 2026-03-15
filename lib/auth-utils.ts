import { authClient } from './auth-client';
import { QueryClient } from '@tanstack/react-query';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Orchestrates a safe, atomic organization switch.
 * Ensures the session is refreshed, the entire TanStack Query cache is cleared,
 * and the router is refreshed to prevent cross-tenant data leakage.
 */
export async function safeSwitchOrganization(
  orgId: string,
  queryClient: QueryClient,
  router: AppRouterInstance,
  options?: {
    redirectTo?: string;
    refreshOnly?: boolean;
  }
) {
  try {
    console.log(`[auth-utils] Initiating safe switch to organization: ${orgId}`);

    // 1. Set the active organization in the persistent session store
    const { error } = await authClient.organization.setActive({ organizationId: orgId });
    if (error) throw error;

    // 2. Refresh the client-side session store (better-auth nanostore)
    // This ensures useSession() returns the new activeOrgId immediately.
    await authClient.getSession();

    // 3. Clear the entire TanStack Query cache.
    // This is CRITICAL. It ensures that any organization-scoped data (tickets, users, logs)
    // is completely evicted before the UI starts rendering the new organization.
    queryClient.clear();

    // 4. Force a router refresh.
    // This server-side revalidation ensures that layouts and server components
    // are notified of the session change.
    router.refresh();

    // 5. Optionally navigate
    if (options?.redirectTo) {
      router.push(options.redirectTo);
    }
  } catch (err) {
    console.error('[auth-utils] Failed to safely switch organization:', err);
    throw err;
  }
}
