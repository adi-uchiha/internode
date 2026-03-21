'use client';

/**
 * AuthContext — Single source of truth for authentication + organization state.
 *
 * DESIGN PRINCIPLES:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. `isOrgReady` is the definitive gate. It is `true` only after:
 *    - The session has finished loading, AND
 *    - The organizations list has been fetched, AND
 *    - EITHER: activeOrganizationId is set AND the member record is resolved
 *      OR: the user has no orgs at all (ready to show onboarding)
 *
 * 2. `useActiveMember()` from better-auth is NOT used anywhere. It is an
 *    unconditional reactive hook that hits /api/auth/organization/get-active-member
 *    regardless of whether an org is active, causing 400 spam on login.
 *    Instead, we use `authClient.organization.getActiveMember()` (promise-based)
 *    via TanStack Query with `enabled: !!activeOrgId` — full control, no leaks.
 *
 * 3. The `setActive` auto-selection is debounced with a ref guard so it fires
 *    exactly once, even across StrictMode double-invocations or refresh cycles.
 *
 * 4. All org-dependent hooks (useUserInvitations, notifications, etc.) are
 *    NOT called here. They live in OrgScopedLayout in app/tasks/layout.tsx
 *    which is only mounted when `isOrgReady === true`.
 */

import { createContext, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import type { User, Session } from '@/lib/auth-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'member';

interface AuthContextType {
  // Core session state
  session: Session | null;
  user: User | null;

  // Organization gate — the single source of truth consumers should check
  isOrgReady: boolean;
  hasNoOrg: boolean;
  activeOrgId: string | null;
  orgRole: OrgRole;

  // Combined loading — true while session OR org resolution is in-flight
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  login: (email: string, password: string, redirectTo?: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string, redirectTo?: string) => Promise<boolean>;
  logout: (redirectTo?: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // ── 1. Session ──────────────────────────────────────────────────────────────
  const {
    data: sessionData,
    isPending: isSessionLoading,
    error: sessionError,
  } = authClient.useSession();

  const user = (sessionData?.user as User | null) ?? null;
  const activeOrgId = sessionData?.session?.activeOrganizationId ?? null;

  // ── 2. Organizations List ────────────────────────────────────────────────────
  // Only fetch when the user is confirmed authenticated. This prevents the
  // hook from firing on public pages or during the sign-in transition.
  const { data: orgs, isPending: isOrgsLoading } = authClient.useListOrganizations();

  // Whether the org list fetch has settled (either data OR no-orgs)
  const orgsSettled = !isOrgsLoading;
  const hasNoOrg = orgsSettled && !!user && Array.isArray(orgs) && orgs.length === 0;

  // ── 3. Member Role — guarded, promise-based, NO better-auth reactive hook ──
  // We use TanStack Query with `enabled: !!activeOrgId` so this NEVER fires
  // until we have a confirmed active organization in the session.
  const { data: memberData, isPending: isMemberPending } = useQuery({
    queryKey: ['active-member', activeOrgId],
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveMember();
      if (error) throw new Error(error.message ?? 'Failed to fetch member');
      return data;
    },
    // THE CENTRAL GUARD: only fetch when we have a confirmed active org
    enabled: !!activeOrgId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const orgRole: OrgRole = (memberData?.role as OrgRole) ?? 'member';

  // ── 4. Org Readiness Gate ───────────────────────────────────────────────────
  // The system is "org ready" when:
  // a) Session and orgs have both finished loading
  // b) AND: (activeOrgId is set AND member is also resolved)
  //    OR:  (user has no orgs → show onboarding)
  //    OR:  (user is not authenticated → layout will redirect to /login)
  const isLoading = isSessionLoading || (!!user && isOrgsLoading);

  const isOrgReady =
    !isLoading &&
    // Either: user has org and it is active with member resolved
    ((!!activeOrgId && !isMemberPending) ||
      // Or: user is confirmed org-less (show onboarding)
      hasNoOrg);

  // ── 5. Auto-set Active Org (once, guarded) ──────────────────────────────────
  // If the user has orgs but none is active (e.g., first login after session
  // cookie was cleared or they never had an activeOrganizationId set),
  // automatically set the first org as active. A ref guard ensures this fires
  // exactly once per session; router.refresh() is NOT used — we rely on
  // authClient.getSession() to update the reactive session cache instead.
  const isSettingActiveOrg = useRef(false);

  useEffect(() => {
    // Wait for all data to settle before attempting auto-set
    if (isSessionLoading || isOrgsLoading) return;
    // Must be authenticated
    if (!user) return;
    // No work needed if org already active
    if (activeOrgId) return;
    // No work if user genuinely has no orgs
    if (!Array.isArray(orgs) || orgs.length === 0) return;
    // Ref guard: prevent concurrent or repeated calls
    if (isSettingActiveOrg.current) return;

    isSettingActiveOrg.current = true;

    const firstOrgId = orgs[0].id;
    console.log(`[AuthContext] Auto-setting active organization: ${firstOrgId}`);

    authClient.organization
      .setActive({ organizationId: firstOrgId })
      .then(async () => {
        // Force-refresh the session cache so useSession() re-emits with
        // the new activeOrganizationId — no router.refresh() needed.
        await authClient.getSession({ fetchOptions: { cache: 'no-store' } });
        // Invalidate the member query so it re-fetches with the new org
        queryClient.invalidateQueries({ queryKey: ['active-member'] });
      })
      .catch((err) => {
        console.error('[AuthContext] Failed to auto-set active org:', err);
        // Reset guard on failure so it can retry next render cycle
        isSettingActiveOrg.current = false;
      });
  }, [isSessionLoading, isOrgsLoading, user, activeOrgId, orgs, queryClient]);

  // Reset the ref when user logs out (activeOrgId goes back to null + user is null)
  useEffect(() => {
    if (!user) {
      isSettingActiveOrg.current = false;
    }
  }, [user]);

  // Log session errors for observability (no user-facing side effects here)
  useEffect(() => {
    if (sessionError) {
      console.error('[AuthContext] Session error:', sessionError);
    }
  }, [sessionError]);

  // ── 6. Auth Actions ─────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string): Promise<boolean> => {
      const { data: signInData, error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError || !signInData) {
        return false;
      }

      // Hard navigation ensures that Better Auth client-side reactive hooks
      // (like useListOrganizations) trigger a fresh data fetch rather than
      // being stuck with a cached 401 error from the unauthenticated state.
      window.location.href = redirectTo || '/tasks/dashboard';
      return true;
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name?: string,
      redirectTo?: string
    ): Promise<boolean> => {
      const { data: signUpData, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });

      if (signUpError || !signUpData) {
        console.error('[AuthContext] Signup failed:', signUpError);
        return false;
      }

      // Hard navigation to bootstrap the entire authenticated state properly
      window.location.href = redirectTo || '/tasks/dashboard';
      return true;
    },
    []
  );

  const logout = useCallback(async (redirectTo?: string): Promise<void> => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('[AuthContext] Error during sign out:', err);
    } finally {
      // Reset the auto-set guard so next login works cleanly
      isSettingActiveOrg.current = false;

      // We specifically DO NOT call queryClient.clear() here.
      // Clearing the query client while the UI is still mounted can cause active
      // components to re-render with null/undefined data and crash before the
      // browser has a chance to execute the redirect.
      // Instead, window.location.href forces a hard page reload which inherently
      // destroys all Next.js/React state and the in-memory React Query cache.
      window.location.href = redirectTo || '/login';
    }
  }, []);

  // ── 7. Context Value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        session: sessionData as Session | null,
        user,
        isOrgReady,
        hasNoOrg,
        activeOrgId,
        orgRole,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
