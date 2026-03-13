'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import { useSearchHistory, useLogSearch } from '@/hooks/useSearchHistory';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

interface TaskManagerLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function TaskManagerLayout({
  children,
  title: initialTitle,
}: TaskManagerLayoutProps) {
  const [showSearch, setShowSearch] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { data: orgs, isPending: orgsLoading } = authClient.useListOrganizations();
  const pathname = usePathname();
  const router = useRouter();
  const { data: activeMember } = authClient.useActiveMember();
  const orgRole = activeMember?.role || 'member';

  // ─── Organization State ──────────────────────────────────────────────────────
  // Detect whether the user has zero orgs. This flag is used to:
  // 1. Disable data-fetching hooks that require an org (search history, etc.)
  // 2. Skip rendering DashboardLayout (which mounts useNotifications, etc.)
  // 3. Redirect non-onboarding paths to /tasks/onboarding
  const hasNoOrg =
    !authLoading && !orgsLoading && !!user && Array.isArray(orgs) && orgs.length === 0;

  const isRedirectingToOnboarding = hasNoOrg && pathname !== '/tasks/onboarding';

  // Disable org-dependent hooks when user has no org
  const { data: searchHistory = [] } = useSearchHistory({ enabled: !hasNoOrg });
  const logSearchMutation = useLogSearch();

  // ─── Onboarding Interceptor ─────────────────────────────────────────────────
  // Trap authenticated users who have no org memberships (orphaned users) and
  // force them through the organization-creation onboarding flow.
  useEffect(() => {
    if (authLoading || orgsLoading) return;
    if (!user || pathname === '/tasks/onboarding') return;

    if (Array.isArray(orgs) && orgs.length === 0) {
      router.replace('/tasks/onboarding');
    }
  }, [user, orgs, authLoading, orgsLoading, pathname, router]);

  // Determine current page title based on pathname if not provided
  const title = useMemo(() => {
    if (pathname.includes('/tasks/dashboard')) return 'Dashboard';
    if (pathname.includes('/tasks/kanban')) return 'Kanban Board';
    if (pathname.includes('/tasks/my-tickets')) return 'My Tickets';
    if (pathname.includes('/tasks/time-logs')) return 'Time Logs';
    if (pathname.includes('/tasks/members')) return 'Members';
    if (pathname.includes('/tasks/analytics')) return 'Analytics';
    if (pathname.includes('/tasks/settings')) return 'Settings';
    if (pathname.includes('/tasks/ticket')) return 'Ticket Detail';
    if (pathname.includes('/tasks/onboarding')) return 'Onboarding';
    if (pathname.includes('/tasks/profile')) return 'Profile';
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

  const navItems = [
    { label: 'Dashboard', href: '/tasks/dashboard', icon: 'ph:chart-pie-duotone' },
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
      label: 'Analytics',
      href: '/tasks/analytics',
      icon: 'ph:presentation-chart-duotone',
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
  if (authLoading || orgsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center">
        <Icon
          icon="solar:round-transfer-diagonal-linear"
          className="w-8 h-8 text-primary animate-spin mb-4"
        />
        <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          WAKING_SYSTEM...
        </div>
      </div>
    );
  }

  // ─── Guard: Redirecting to Onboarding ───────────────────────────────────────
  if (isRedirectingToOnboarding) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center">
        <Icon
          icon="solar:rocket-2-bold-duotone"
          className="w-16 h-16 text-primary mb-6 animate-pulse"
        />
        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
          Preparing Organization
        </h2>
        <p className="text-muted-foreground font-mono text-sm mb-8">
          Redirecting you to setup your workspace...
        </p>
        <div className="flex items-center justify-center gap-2 text-muted-foreground font-mono text-xs">
          <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
          REDIRECTING_TO_SETUP...
        </div>
      </div>
    );
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
