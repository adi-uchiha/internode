'use client';

/**
 * Task Manager Layout
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE: The "OrgScopedLayout" pattern.
 *
 * All org-dependent hooks (invitations, search history, notifications) are
 * isolated inside the <OrgScopedLayout> component, which is only mounted by
 * React when `isOrgReady === true`.
 *
 * This is the ONLY correct way to conditionally fire hooks at the
 * architectural level — not via `enabled` flags scattered everywhere, but
 * via conditional rendering of the component that owns those hooks.
 *
 * The org resolution state machine now lives entirely in AuthContext.
 * This layout is purely a structural/UI concern.
 */

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchHistory, useLogSearch } from '@/hooks/useSearchHistory';
import { useUserInvitations } from '@/hooks/useInvites';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';
import { useSearch } from '@/hooks/useSearch';
import type { OrgRole } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  roles?: OrgRole[];
}

interface TaskManagerLayoutProps {
  children: ReactNode;
  title?: string;
}

// ─── OrgScopedLayout ──────────────────────────────────────────────────────────
//
// This component is the ORG-GATEWAY. It is only ever rendered after
// `isOrgReady === true` is confirmed by the parent layout.
//
// By isolating org-dependent hooks here, we guarantee at the React
// component tree level that they NEVER mount prematurely. Even if
// AuthContext re-renders during session refresh, as long as the parent
// doesn't render <OrgScopedLayout>, none of these hooks fire.

interface OrgScopedLayoutProps {
  children: ReactNode;
  title: string;
  orgRole: OrgRole;
  pathname: string;
}

function OrgScopedLayout({ children, title, orgRole, pathname }: OrgScopedLayoutProps) {
  const router = useRouter();

  // ── Search state ────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, isSearching } = useSearch(searchQuery, showSearch);

  // ── Org-scoped hooks — safe to call, org is confirmed ready ────────────────
  const { data: searchHistory = [] } = useSearchHistory({ enabled: true });
  const logSearchMutation = useLogSearch();
  const { data: userInvites = [] } = useUserInvitations();
  const pendingInvCount = userInvites.length;

  // ── Keyboard shortcut: ⌘K ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close search on navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSearch(false);
      setSearchQuery('');
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/tasks/dashboard', icon: 'ph:chart-pie-duotone' },
    { label: 'Projects', href: '/tasks/projects', icon: 'ph:folder-duotone' },
    { label: 'Board', href: '/tasks/kanban', icon: 'ph:kanban-duotone' },
    { label: 'My Tickets', href: '/tasks/my-tickets', icon: 'ph:ticket-duotone' },
    { label: 'Quick Log', href: '/tasks/quick-log', icon: 'ph:plus-circle-duotone' },
    { label: 'Time Logs', href: '/tasks/time-logs', icon: 'ph:clock-duotone' },
    {
      label: 'Members',
      href: '/tasks/members',
      icon: 'ph:users-three-duotone',
      roles: ['owner', 'admin'] as OrgRole[],
    },
    {
      label: 'Invites',
      href: '/tasks/invites',
      icon: 'ph:envelope-simple-duotone',
      badge: pendingInvCount,
    },
    {
      label: 'Analytics',
      href: '/tasks/analytics',
      icon: 'ph:presentation-chart-duotone',
      roles: ['owner', 'admin'] as OrgRole[],
    },
    {
      label: 'Breakthroughs',
      href: '/tasks/breakthroughs',
      icon: 'ph:star-duotone',
    },
    {
      label: 'Leaves',
      href: '/tasks/leaves',
      icon: 'ph:calendar-duotone',
    },
    {
      label: 'Admin Review',
      href: '/tasks/admin-review',
      icon: 'ph:shield-check-duotone',
      roles: ['owner', 'admin'] as OrgRole[],
    },
    {
      label: 'Settings',
      href: '/tasks/settings',
      icon: 'ph:gear-duotone',
      roles: ['owner', 'admin'] as OrgRole[],
    },
  ].filter((item) => !item.roles || item.roles.includes(orgRole));

  return (
    <DashboardLayout navItems={navItems} title={title}>
      {children}

      {/* Command Palette / Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] border border-border bg-card z-101 shadow-2xl"
            >
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Icon icon="solar:magnifer-linear" className="w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="&gt; Search tickets, projects..."
                  className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <span className="font-mono text-[10px] text-muted-foreground">⌘K to close</span>
              </div>
              <div className="p-4">
                <div className="max-h-[300px] overflow-y-auto">
                  {searchQuery ? (
                    <>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                        {isSearching ? 'SEARCHING...' : 'SEARCH RESULTS'}
                      </div>
                      {searchResults.tickets.length === 0 &&
                      searchResults.projects.length === 0 &&
                      !isSearching ? (
                        <div className="p-4 text-center text-muted-foreground font-mono text-[10px] italic">
                          No results matching &quot;{searchQuery}&quot;
                        </div>
                      ) : (
                        <>
                          {searchResults.tickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="flex items-center gap-3 p-2 hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => {
                                setShowSearch(false);
                                router.push(`/tasks/ticket/${ticket.id}`);
                              }}
                            >
                              <Icon
                                icon="solar:document-text-linear"
                                className="w-4 h-4 text-primary"
                              />
                              <span className="text-sm flex-1">{ticket.title}</span>
                              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                                {ticket.ticketId}
                              </span>
                            </div>
                          ))}
                          {searchResults.projects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center gap-3 p-2 hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => {
                                setShowSearch(false);
                                router.push(`/tasks/projects?id=${project.id}`);
                              }}
                            >
                              <Icon icon="solar:folder-linear" className="w-4 h-4 text-amber-400" />
                              <span className="text-sm flex-1">{project.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                                Project
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                        RECENT
                      </div>
                      {searchHistory.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground font-mono text-[10px] italic">
                          No recent items.
                        </div>
                      ) : (
                        searchHistory.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2 hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => {
                              setShowSearch(false);
                              logSearchMutation.mutate(item);
                              router.push(`/tasks/${item.entityType}/${item.entityId}`);
                            }}
                          >
                            <Icon
                              icon={
                                item.entityType === 'ticket'
                                  ? 'solar:document-text-linear'
                                  : item.entityType === 'member'
                                    ? 'solar:user-linear'
                                    : 'solar:folder-linear'
                              }
                              className="w-4 h-4 text-muted-foreground"
                            />
                            <span className="text-sm flex-1">{item.title}</span>
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">
                              {item.subtitle || item.entityType}
                            </span>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-4 mb-3">
                  QUICK ACTIONS
                </div>
                {[
                  {
                    icon: 'solar:add-circle-linear',
                    title: 'Create new ticket',
                    roles: ['owner', 'admin'] as OrgRole[],
                  },
                  {
                    icon: 'solar:clock-circle-linear',
                    title: 'Log time',
                    roles: ['owner', 'admin', 'member'] as OrgRole[],
                  },
                  {
                    icon: 'solar:graph-up-linear',
                    title: 'View analytics',
                    roles: ['owner', 'admin'] as OrgRole[],
                  },
                ]
                  .filter((a) => !a.roles || a.roles.includes(orgRole))
                  .map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setShowSearch(false)}
                    >
                      <Icon icon={item.icon} className="w-4 h-4 text-primary" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function TaskManagerLayout({
  children,
  title: initialTitle,
}: TaskManagerLayoutProps) {
  const { user, isOrgReady, hasNoOrg, orgRole, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // ── Derive page title from pathname ─────────────────────────────────────────
  const title = useMemo(() => {
    if (pathname.includes('/tasks/dashboard')) return 'Dashboard';
    if (pathname.includes('/tasks/projects')) return 'Projects';
    if (pathname.includes('/tasks/kanban')) return 'Kanban Board';
    if (pathname.includes('/tasks/my-tickets')) return 'My Tickets';
    if (pathname.includes('/tasks/members')) return 'Members';
    if (pathname.includes('/tasks/analytics')) return 'Analytics';
    if (pathname.includes('/tasks/settings')) return 'Settings';
    if (pathname.includes('/tasks/ticket')) return 'Ticket Detail';
    if (pathname.includes('/tasks/onboarding')) return 'Onboarding';
    if (pathname.includes('/tasks/profile')) return 'Profile';
    if (pathname.includes('/tasks/breakthroughs')) return 'Wall of Fame';
    if (pathname.includes('/tasks/leaves')) return 'Leave Registry';
    if (pathname.includes('/tasks/admin-review')) return 'Admin Review';
    if (pathname.includes('/tasks/notifications')) return 'Signal Hub';
    return initialTitle || 'Task Manager';
  }, [pathname, initialTitle]);

  // ── Redirect logic — only runs when system is fully resolved ────────────────
  // We intentionally do NOT redirect while loading to avoid flash-redirects.
  useEffect(() => {
    if (isLoading) return;

    // 1. Unauthenticated → /login
    if (!user) {
      router.replace('/login');
      return;
    }

    // 2. Org-less user → onboarding
    if (hasNoOrg && pathname !== '/tasks/onboarding') {
      router.replace('/tasks/onboarding');
      return;
    }

    // 3. Org-ready user landed on onboarding page → dashboard
    if (!hasNoOrg && isOrgReady && pathname === '/tasks/onboarding') {
      router.replace('/tasks/dashboard');
      return;
    }
  }, [isLoading, user, hasNoOrg, isOrgReady, pathname, router]);

  // ── Guard: Still resolving auth/org state ───────────────────────────────────
  // Block ALL rendering while state is in-flight. This is the wall that
  // prevents every single child hook from firing prematurely.
  if (isLoading) {
    return <UnifiedLoader variant="fullscreen" message="WAKING_SYSTEM..." />;
  }

  // ── Guard: Org is not yet ready (auto-set in progress) ───────────────────
  // This covers the window between "session loaded, orgs loaded, but
  // activeOrgId not yet set" — i.e. setActive is running in AuthContext.
  if (!isOrgReady && !hasNoOrg && !!user) {
    return <UnifiedLoader variant="fullscreen" message="INITIALIZING_ORGANIZATION..." />;
  }

  // ── Guard: Onboarding (no org) ───────────────────────────────────────────
  // Render children directly (the onboarding page) without DashboardLayout,
  // which prevents DashboardLayout's internal hooks from firing.
  if (hasNoOrg) {
    return <>{children}</>;
  }

  // ── Guard: Not yet redirected from onboarding page ────────────────────────
  if (pathname === '/tasks/onboarding' && !hasNoOrg) {
    return <UnifiedLoader variant="fullscreen" message="PREPARING_ORGANIZATION..." />;
  }

  // ── Full org-scoped layout ───────────────────────────────────────────────
  // At this point: user is authenticated, org is active, member is resolved.
  // OrgScopedLayout mounts here — and ONLY here — making it impossible for
  // org-dependent hooks to fire before this point in the component tree.
  return (
    <OrgScopedLayout title={title} orgRole={orgRole} pathname={pathname}>
      {children}
    </OrgScopedLayout>
  );
}
