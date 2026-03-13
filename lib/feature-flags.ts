export type FeatureStatus = 'available' | 'coming-soon' | 'hidden';

export const featureConfig: Record<string, Record<string, FeatureStatus>> = {
  admin: {
    // Admins have everything available by default
  },
  owner: {
    // Owners have everything available by default
  },
};

export const getFeatureStatus = (role: string, href: string): FeatureStatus => {
  // Org Admin/Owner always has full access
  if (role === 'admin' || role === 'owner') return 'available';

  const roleConfig = featureConfig[role as keyof typeof featureConfig];
  if (!roleConfig) return 'available';

  return roleConfig[href] || 'available';
};

export const AUTH_FLAGS = {
  ENABLE_EMAIL_SIGNUP: true,
} as const;
