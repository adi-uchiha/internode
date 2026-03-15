'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import { useSearchHistory, useLogSearch } from '@/hooks/useSearchHistory';
import { useUserInvitations } from '@/hooks/useInvites';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';

interface TaskManagerLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function TaskManagerLayout({
  children,
  title: initialTitle,
}: TaskManagerLayoutProps) {
  const [showSearch, setShowSearch] = useState(false);
  const { user, session, orgRole, isLoading: authLoading } = useAuth();

  // ─── Organization State ──────────────────────────────────────────────────────
  const { data: orgs, isPending: orgsLoading } = authClient.useListOrganizations();

  const pathname = usePathname();
  const router = useRouter();

  // Combined resolution state: System is "fully loaded" ONLY if auth is done,
  // and we have a definitive resolution from the orgs list.
  const isFullyLoaded = !authLoading && !orgsLoading;
  const activeOrgId = session?.session.activeOrganizationId;

  // A user truly has "no org" ONLY if the list has been fetched and is confirmed empty.
  // We check Array.isArray and .length strictly to avoid false positives during cache wipes.
  const hasNoOrg = isFullyLoaded && !!user && Array.isArray(orgs) && orgs.length === 0;

  const isRedirectingToOnboarding = hasNoOrg && pathname !== '/tasks/onboarding';

  // ─── Auto-select Active Organization ───────────────────────────────────────
  // If the user is logged in, has organizations, but NO organization is currently
  // marked as "active" in the session, we automatically select the first one.
  useEffect(() => {
    if (!isFullyLoaded || !user) return;

    // If we have orgs but none is active, set the first one as active
    if (!activeOrgId && Array.isArray(orgs) && orgs.length > 0) {
      const firstOrgId = orgs[0].id;
      console.log(`[layout] Auto-setting active organization: ${firstOrgId}`);
      void authClient.organization.setActive({ organizationId: firstOrgId }).then(() => {
        // Refresh ensures the session update is reflected everywhere
        router.refresh();
      });
    }
  }, [isFullyLoaded, user, activeOrgId, orgs, router]);

  // Disable org-dependent hooks when user has no org (or no active org yet)
  const { data: searchHistory = [] } = useSearchHistory({ enabled: !!activeOrgId });
  const logSearchMutation = useLogSearch();

  // ─── Onboarding Interceptor ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isFullyLoaded) return;
    if (!user || pathname === '/tasks/onboarding') return;

    // Only redirect if they actually have ZERO organizations
    if (hasNoOrg) {
      router.replace('/tasks/onboarding');
    }
  }, [user, hasNoOrg, isFullyLoaded, pathname, router]);

  // Determine current page title based on pathname if not provided
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

  // ⌘K shortcut
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSearch(false);
  }, [pathname]);

  const { data: userInvites = [] } = useUserInvitations();
  const pendingInvCount = userInvites.length;

  const navItems = [
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
      roles: ['owner', 'admin'],
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
      roles: ['owner', 'admin'],
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
      roles: ['owner', 'admin'],
    },
    {
      label: 'Settings',
      href: '/tasks/settings',
      icon: 'ph:gear-duotone',
      roles: ['owner', 'admin'],
    },
  ].filter((item) => !item.roles || item.roles.includes(orgRole));

  // ─── Guard: Still Loading ───────────────────────────────────────────────────
  // Block ALL rendering while auth/org status is resolving to prevent any
  // child component from mounting hooks that fire org-dependent API calls.
  if (!isFullyLoaded) {
    return <FullScreenLoader message="WAKING_SYSTEM..." />;
  }

  // ─── Guard: Redirecting to Onboarding ───────────────────────────────────────
  if (isRedirectingToOnboarding) {
    return <FullScreenLoader message="PREPARING_WORKSPACE..." />;
  }

  // ─── Guard: On Onboarding Page (no org yet) ─────────────────────────────────
  // The onboarding page is under /tasks/, so it inherits this layout.
  // When the user has no org, skip DashboardLayout entirely to prevent its
  // internal hooks (useNotifications, etc.) from firing org-dependent API calls.
  if (hasNoOrg) {
    return <>{children}</>;
  }

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
                  placeholder="&gt; Search tickets, members..."
                  className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <span className="font-mono text-[10px] text-muted-foreground">⌘K to close</span>
              </div>
              <div className="p-4">
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
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-4 mb-3">
                  QUICK ACTIONS
                </div>
                {[
                  {
                    icon: 'solar:add-circle-linear',
                    title: 'Create new ticket',
                    roles: ['owner', 'admin'],
                  },
                  {
                    icon: 'solar:clock-circle-linear',
                    title: 'Log time',
                    roles: ['owner', 'admin', 'member'],
                  },
                  {
                    icon: 'solar:graph-up-linear',
                    title: 'View analytics',
                    roles: ['owner', 'admin'],
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
