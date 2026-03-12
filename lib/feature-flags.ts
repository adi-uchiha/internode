export type FeatureStatus = 'available' | 'coming-soon' | 'hidden';

export const featureConfig: Record<string, Record<string, FeatureStatus>> = {
  member: {
    '/tasks/dashboard': 'available',
    '/tasks/kanban': 'available',
    '/tasks/my-tickets': 'available',
    '/member': 'available',
    '/tasks/time-logs': 'coming-soon',
    '/member/activity': 'coming-soon',
    '/member/goals': 'coming-soon',
    '/member/skills': 'coming-soon',
    '/member/monthly': 'coming-soon',
    '/member/breakthroughs': 'coming-soon',
    '/member/leave': 'coming-soon',
  },
  admin: {
    // Admins have everything available by default or we can explicitly list them
  },
};

export const getFeatureStatus = (role: string, href: string): FeatureStatus => {
  // Admin always has full access
  if (role === 'admin') return 'available';

  const roleConfig = featureConfig[role as keyof typeof featureConfig];
  if (!roleConfig) return 'available';

  return roleConfig[href] || 'available';
};

export const AUTH_FLAGS = {
  ENABLE_EMAIL_SIGNUP: true,
} as const;
