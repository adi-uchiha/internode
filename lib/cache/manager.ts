import { TicketDomain } from './domains/tickets';
import { AnalyticsDomain } from './domains/analytics';
import { ProjectDomain } from './domains/projects';

/**
 * The CacheManager is the single entry point for all optimistic cache updates.
 * It provides a structured, domain-driven API to keep the application state in sync.
 */
export const CacheManager = {
  tickets: TicketDomain,
  analytics: AnalyticsDomain,
  projects: ProjectDomain,

  /**
   * Add more domains as the application grows:
   * projects: ProjectDomain,
   * labels: LabelDomain,
   * etc.
   */
};
