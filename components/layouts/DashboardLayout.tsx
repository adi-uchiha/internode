import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

export const DashboardLayout = ({ children, navItems, title }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const { data: notifications = [] } = useNotifications();
  const { mutateAsync: markAsRead } = useMarkNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (unreadCount > 0) {
      await markAsRead();
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed left-0 top-0 h-screen border-r border-border bg-card z-50 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center px-4 justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary flex items-center justify-center shrink-0">
              <div className="w-3 h-3 bg-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-display font-semibold text-lg tracking-tight"
                >
                  INTERNODE
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'
                  )}
                >
                  <Icon
                    icon={item.icon}
                    className={cn('w-5 h-5 shrink-0 transition-colors', isActive && 'text-primary')}
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
                  {item.badge && item.badge > 0 && (
                    <span
                      className={cn(
                        'absolute right-2 bg-primary text-primary-foreground font-mono text-xs px-1.5 py-0.5',
                        collapsed && 'right-1 top-1'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || ''}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon icon="solar:user-linear" className="w-5 h-5 text-muted-foreground" />
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
                  <div className="font-display font-semibold text-sm truncate">{user?.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
                    [{user?.role}]
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="hero"
            size="sm"
            onClick={handleLogout}
            className={cn('w-full justify-start mt-2', collapsed && 'justify-center px-0')}
          >
            <Icon icon="solar:logout-2-linear" className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tasks/kanban')}
          className={cn(
            'absolute -right-3 top-12 w-6 h-6 bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors z-10',
            collapsed && 'w-full justify-center px-0'
          )}
        >
          <Icon icon="solar:kanban-board-linear" className="w-3 h-3 text-muted-foreground" />
        </Button>
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
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 260 }}
      >
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              [{title}]
            </div>
            <h1 className="font-display font-semibold text-lg">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                System Online
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-muted/50 transition-colors"
              >
                <Icon icon="solar:bell-linear" className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] border border-border bg-card overflow-hidden z-50 rounded-sm shadow-xl"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                      <span className="font-display font-semibold text-sm tracking-tight">
                        NOTIFICATIONS ({unreadCount})
                      </span>
                      <button
                        onClick={handleMarkAllRead}
                        className="font-mono text-[10px] uppercase text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
                        disabled={unreadCount === 0}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[400px]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center border-b border-border text-xs font-mono text-muted-foreground">
                          You have no new notifications.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              'p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors relative',
                              !n.read && 'bg-primary/5'
                            )}
                          >
                            {!n.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                            )}
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={cn('w-2 h-2 rounded-full shadow-sm', {
                                  'bg-primary': n.type === 'assigned',
                                  'bg-destructive': n.type === 'overdue',
                                  'bg-blue-400': n.type === 'status',
                                  'bg-amber-400': n.type === 'time-logged',
                                  'bg-purple-400': n.type === 'comment',
                                })}
                              />
                              <span className="text-sm font-medium tracking-tight text-foreground/90">
                                {n.title}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-muted-foreground ml-4 leading-relaxed">
                              {n.subtitle}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground/60 ml-4 mt-2">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center bg-muted/10 border-t border-border">
                      <button className="font-mono text-[11px] uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                        View all
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 relative z-10">{children}</div>
      </main>

      {/* Click-away overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
};
