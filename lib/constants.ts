/**
 * Centralized constants for Internode.
 */

export const ANALYTICS = {
  // The factor used to calculate productivity/efficiency.
  // Formula: ((ticketsDone * PRODUCTIVITY_FACTOR) / hoursLogged) * 100
  PRODUCTIVITY_FACTOR: 4,

  // Weekly hours target for goals
  WEEKLY_HOURS_GOAL: 100,

  // Default values
  DEFAULT_TICKET_STATUS: 'todo' as const,
  DEFAULT_TICKET_PRIORITY: 'medium' as const,
};

export const BILLING = {
  PLANS: ['free', 'pro', 'enterprise'] as const,
  GRACE_PERIOD_DAYS: 3, // After cancelation, org retains access for 3 days
  CACHE_KEY: ['active-organization-billing'] as const,
} as const;

export const CACHE_KEYS = {
  TICKETS: ['tickets'] as const,
  PROJECTS: ['projects'] as const,
  USERS: ['users'] as const,
  ANALYTICS: ['analytics'] as const,
  MEMBERS: ['members'] as const,
  ORGANIZATION: ['active-organization-details'] as const,
};
