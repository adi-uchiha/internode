export type OrgRole = 'owner' | 'admin' | 'member';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Determines if a given role meets the minimum threshold.
 * Pure utility — safe to use in Client Components.
 */
export function hasOrgRole(role: OrgRole | null | undefined, minimumRole: OrgRole): boolean {
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}
