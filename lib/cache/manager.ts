import { TicketDomain } from './domains/tickets';
import { AnalyticsDomain } from './domains/analytics';
import { ProjectDomain } from './domains/projects';
import { UserDomain } from './domains/users';
import { ActivityDomain } from './domains/activities';
import { NotificationDomain } from './domains/notifications';
import { SearchDomain } from './domains/search';
import { InviteDomain } from './domains/invites';
import { BreakthroughDomain } from './domains/breakthroughs';
import { OrganizationDomain } from './domains/organizations';
import { dispatchSynergy } from './sync-registry';

/**
 * The CacheManager is the single entry point for all optimistic cache updates.
 * It provides a structured, domain-driven API to keep the application state in sync.
 */
export const CacheManager = {
  tickets: TicketDomain,
  analytics: AnalyticsDomain,
  projects: ProjectDomain,
  users: UserDomain,
  activities: ActivityDomain,
  notifications: NotificationDomain,
  search: SearchDomain,
  invites: InviteDomain,
  breakthroughs: BreakthroughDomain,
  organizations: OrganizationDomain,
  dispatch: dispatchSynergy,

  /**
   * Add more domains as the application grows:
   * labels: LabelDomain,
   * etc.
   */
};
