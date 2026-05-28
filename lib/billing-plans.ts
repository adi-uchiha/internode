import { db } from '@/db';
import { organizations, members, projects } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { ApiError } from './api-error';

// ── Plan Limits ────────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: { maxMembers: 5, maxProjects: 3, maxOrgs: 1 },
  pro: { maxMembers: 20, maxProjects: 999999, maxOrgs: 3 },
  enterprise: { maxMembers: 999999, maxProjects: 999999, maxOrgs: 999999 },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

// ── Lemon Squeezy Variant ID → Plan mapping ────────────────────────────────────
export const LEMON_VARIANT_TO_PLAN: Record<string, PlanId> = {
  [process.env.LEMON_VARIANT_PRO_MONTHLY ?? 'UNSET_PRO']: 'pro',
  [process.env.LEMON_VARIANT_ENTERPRISE_MONTHLY ?? 'UNSET_ENT']: 'enterprise',
};

// ── Limit Checker ──────────────────────────────────────────────────────────────
export async function assertPlanLimit(
  orgId: string,
  limitType: 'members' | 'projects'
): Promise<void> {
  // Fetch org plan
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { subscriptionPlan: true },
  });

  const plan = (org?.subscriptionPlan ?? 'free') as PlanId;
  const limits = PLAN_LIMITS[plan];

  if (limitType === 'members') {
    const [result] = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId));
    const current = result?.count ?? 0;
    if (current >= limits.maxMembers) {
      throw new ApiError(
        `Your ${plan} plan allows a maximum of ${limits.maxMembers} active members. ` +
          `Upgrade your plan to invite more interns.`,
        403,
        'plan_limit_exceeded'
      );
    }
  }

  if (limitType === 'projects') {
    const [result] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.organizationId, orgId));
    const current = result?.count ?? 0;
    if (current >= limits.maxProjects) {
      throw new ApiError(
        `Your ${plan} plan allows a maximum of ${limits.maxProjects} active projects. ` +
          `Upgrade to Pro or Enterprise for unlimited projects.`,
        403,
        'plan_limit_exceeded'
      );
    }
  }
}

// ── Usage Stats (for UI) ───────────────────────────────────────────────────────
export async function getOrgUsage(orgId: string, plan: PlanId) {
  const [memberCount] = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.organizationId, orgId));
  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.organizationId, orgId));

  const limits = PLAN_LIMITS[plan];
  return {
    members: { used: memberCount?.count ?? 0, max: limits.maxMembers },
    projects: { used: projectCount?.count ?? 0, max: limits.maxProjects },
    orgs: { max: limits.maxOrgs },
  };
}
