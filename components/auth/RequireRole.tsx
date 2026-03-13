'use client';

import { authClient } from '@/lib/auth-client';

type OrgRole = 'owner' | 'admin' | 'member';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

interface RequireRoleProps {
  /**
   * The minimum org-level role required to see the children.
   * Roles are hierarchical: owner > admin > member.
   * - `'admin'` allows both 'owner' and 'admin'.
   * - `'owner'` allows only 'owner'.
   * - `'member'` allows everyone.
   */
  role: OrgRole;
  /** Content to render when the user has the required role. */
  children: React.ReactNode;
  /** Optional fallback content to render when the user does NOT have the required role. Defaults to null. */
  fallback?: React.ReactNode;
}

/**
 * RBAC wrapper that conditionally renders `children` based on the current
 * user's role in the **active organization**. Falls back to `null` (or
 * `props.fallback`) if the user's org-level role is insufficient.
 *
 * Global system admins (`user.role === 'admin'`) always bypass role checks.
 */
export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  // While loading, render nothing to avoid flash of protected content
  if (!session) return null;

  // Global system admins pass all org-level checks
  const user = session.user as { role?: string } | null;
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  // No active organization context – hide sensitive actions
  if (!activeOrg) return <>{fallback}</>;

  // Find the current user's membership record within the active org
  const membership = activeOrg.members?.find((m) => m.userId === session.user.id);
  const userRole = (membership?.role ?? 'member') as OrgRole;

  const requiredLevel = ROLE_HIERARCHY[role] ?? 1;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 1;

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
