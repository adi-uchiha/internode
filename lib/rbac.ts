import { OrgRole } from './org-utils';

/**
 * Unified RBAC (Role Based Access Control) library for Internode.
 * Centralizes permission logic to be used across Client and Server.
 */

export const PERMISSIONS = {
  // Ticket Operations
  CAN_DELETE_TICKET: ['admin', 'owner'],
  CAN_ARCHIVE_TICKET: ['admin', 'owner'],
  CAN_DUPLICATE_TICKET: ['admin', 'owner', 'member'],
  CAN_CREATE_TICKET: ['admin', 'owner', 'member'],
  CAN_EDIT_OTHERS_TICKET: ['admin', 'owner'],

  // Project Operations
  CAN_CREATE_PROJECT: ['admin', 'owner'],
  CAN_DELETE_PROJECT: ['owner'],
  CAN_EDIT_PROJECT: ['admin', 'owner'],

  // Member & Org Operations
  CAN_INVITE_MEMBER: ['admin', 'owner'],
  CAN_REMOVE_MEMBER: ['admin', 'owner'],
  CAN_MANAGE_ROLES: ['owner'],
  CAN_UPDATE_ORG_SETTINGS: ['admin', 'owner'],

  // Feature Access
  CAN_VIEW_ANALYTICS: ['admin', 'owner'],
  CAN_VIEW_FEEDBACK_HUB: ['admin', 'owner'],

  // Billing Operations
  CAN_MANAGE_BILLING: ['owner'],
  CAN_VIEW_BILLING: ['admin', 'owner'],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Checks if a user with a given role has a specific permission.
 */
export function hasPermission(
  role: OrgRole | null | undefined,
  permission: PermissionKey
): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

/**
 * Role hierarchy helpers (for relative checks)
 */
const ROLE_RANK: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function isAtLeast(role: OrgRole | null | undefined, minRole: OrgRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export function isHigherThan(role: OrgRole | null | undefined, targetRole: OrgRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] > ROLE_RANK[targetRole];
}
