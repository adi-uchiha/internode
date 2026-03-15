/**
 * Static Impact Map for Internode Cache Synergy.
 *
 * Defines the declarative dependency graph between domains.
 * This ensures that a mutation in one domain triggers the correct
 * ripple effects in the dependent domains.
 */
export const IMPACT_MAP = {
  organizations: ['branding', 'projects', 'members'],
  users: ['members', 'leaderboard', 'notifications', 'activities'],
  tickets: [
    'analytics',
    'leaderboard',
    'activities',
    'projects',
    'members',
    'searchHistory',
    'timeLogs',
  ],
  projects: ['analytics', 'tickets', 'members', 'searchHistory'],
  timeLogs: ['tickets', 'analytics', 'leaderboard', 'activities', 'users', 'projects'],
  comments: ['activities', 'notifications', 'tickets'],
  leaves: ['notifications', 'analytics'],
  goals: ['analytics'],
  notifications: ['users'],
  activities: [],
  breakthroughs: ['notifications', 'leaderboard', 'activities', 'users'],
  labels: ['tickets'],
  members: ['activities', 'notifications', 'leaderboard', 'projects', 'searchHistory', 'users'],
  projectMembers: ['projects', 'analytics', 'members'],
  invitations: ['notifications', 'members'],
  searchHistory: [],
  leaderboard: [],
  analytics: [],
} as const;

export type Domain = keyof typeof IMPACT_MAP;
