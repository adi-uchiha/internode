'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tmNotifications } from '@/data/taskManagerData';

interface NavItemDef {
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const adminNavItems: { section: string; items: NavItemDef[] }[] = [
  {
    section: 'TASK MANAGER',
    items: [
      { label: 'Dashboard', href: '/tasks/dashboard', icon: 'solar:chart-2-linear' },
      { label: 'Kanban Board', href: '/tasks/kanban', icon: 'solar:widget-4-linear' },
      { label: 'My Tickets', href: '/tasks/my-tickets', icon: 'solar:folder-open-linear' },
      { label: 'Time Logs', href: '/tasks/time-logs', icon: 'solar:clock-circle-linear' },
    ],
  },
  {
    section: 'TEAM',
    items: [
      {
        label: 'Members',
        href: '/tasks/members',
        icon: 'solar:users-group-rounded-linear',
        adminOnly: true,
      },
      {
        label: 'Analytics',
        href: '/tasks/analytics',
        icon: 'solar:graph-up-linear',
        adminOnly: true,
      },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      {
        label: 'Settings',
        href: '/tasks/settings',
        icon: 'solar:settings-linear',
        adminOnly: true,
      },
    ],
  },
];

interface TaskManagerLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function TaskManagerLayout({
  children,
  title: initialTitle,
}: TaskManagerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  // Determine current page title based on pathname if not provided
  const title = useMemo(() => {
    for (const section of adminNavItems) {
      const item = section.items.find((i) => i.href === pathname);
      if (item) return item.label;
    }
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
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Close search/notifications on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing overlays on route change
    setShowSearch(false);

    setShowNotifications(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed left-0 top-0 h-screen border-r border-border bg-card z-50 flex flex-col"
      >
        {/* Logo area - matches top bar height */}
        <div className="h-12 border-b border-border flex items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 border-2 border-primary flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 bg-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-display font-semibold text-base tracking-tight"
                >
                  INTERNODE
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto no-scrollbar">
          {adminNavItems.map((section) => {
            const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.section} className="mb-4">
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                    >
                      {section.section}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 transition-all duration-200 relative group',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
                          />
                        )}
                        <Icon
                          icon={item.icon}
                          className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-primary')}
                        />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="font-display text-sm truncate tracking-tight font-medium"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Back to main app link */}
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href={isAdmin ? '/admin' : '/member'}
              className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-display text-sm tracking-tight font-medium"
                  >
                    Back to Internode
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </nav>

        {/* User card */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-border overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Icon icon="solar:user-linear" className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="font-display font-semibold text-sm truncate">
                    {user?.name || 'Aditya Sharma'}
                  </div>
                  <span
                    className={cn(
                      'font-mono text-[9px] uppercase px-1.5 py-0.5 tracking-widest opacity-60',
                      isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isAdmin ? 'ADMIN' : 'MEMBER'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors z-10"
        >
          <Icon
            icon={collapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'}
            className="w-3 h-3 text-muted-foreground"
          />
        </button>
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300 min-h-screen"
        style={{ marginLeft: collapsed ? 64 : 240 }}
      >
        {/* Top Bar (48px) */}
        <header className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:bg-muted/50 transition-colors"
            >
              <Icon icon="solar:hamburger-menu-linear" className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="font-display font-semibold text-base tracking-tight">{title}</h1>
          </div>

          {/* Center - Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-2 px-4 py-1.5 border border-border bg-card/50 text-muted-foreground hover:border-primary/30 transition-colors min-w-[300px]"
          >
            <Icon icon="solar:magnifer-linear" className="w-4 h-4" />
            <span className="font-mono text-xs flex-1 text-left">
              &gt; search tickets, members...
            </span>
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5">⌘K</span>
          </button>

          {/* Right */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="hero" size="sm" onClick={() => router.push('/tasks/kanban')}>
                <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
                {!collapsed && <span className="hidden sm:inline">New Ticket</span>}
              </Button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-muted/50 transition-colors"
              >
                <Icon icon="solar:bell-linear" className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] border border-border bg-card overflow-hidden z-50 shadow-2xl"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <span className="font-display font-semibold text-sm">NOTIFICATIONS</span>
                      <button className="font-mono text-xs text-primary hover:underline">
                        Mark all
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[400px]">
                      {tmNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors',
                            !n.read && 'border-l-[3px] border-l-primary bg-muted/20'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={cn('w-2 h-2 rounded-full', {
                                'bg-primary': n.type === 'assigned',
                                'bg-destructive': n.type === 'overdue',
                                'bg-blue-400': n.type === 'status',
                                'bg-amber-400': n.type === 'time-logged',
                                'bg-purple-400': n.type === 'comment',
                              })}
                            />
                            <span className="text-sm font-medium">{n.title}</span>
                          </div>
                          <div className="font-mono text-xs text-muted-foreground ml-4">
                            {n.subtitle}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground ml-4 mt-1">
                            {n.time}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-border">
                      <button className="font-mono text-xs text-primary hover:underline">
                        View all notifications →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <div className="w-8 h-8 border border-border rounded-full overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Icon icon="solar:user-linear" className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>

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
                {[
                  {
                    icon: 'solar:document-text-linear',
                    title: 'Fix auth redirect loop',
                    sub: 'TICKET-42',
                  },
                  {
                    icon: 'solar:document-text-linear',
                    title: 'Update API docs',
                    sub: 'TICKET-41',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setShowSearch(false)}
                  >
                    <Icon icon={item.icon} className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{item.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{item.sub}</span>
                  </div>
                ))}
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-4 mb-3">
                  QUICK ACTIONS
                </div>
                {[
                  { icon: 'solar:add-circle-linear', title: 'Create new ticket', admin: true },
                  { icon: 'solar:clock-circle-linear', title: 'Log time', admin: false },
                  { icon: 'solar:graph-up-linear', title: 'View analytics', admin: true },
                ]
                  .filter((a) => !a.admin || isAdmin)
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

      {/* Click-away for notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
