'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchHistory, useLogSearch } from '@/hooks/useSearchHistory';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { MemberLayout } from '@/components/layouts/MemberLayout';

interface TaskManagerLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function TaskManagerLayout({
  children,
  title: initialTitle,
}: TaskManagerLayoutProps) {
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();
  const { data: searchHistory = [] } = useSearchHistory();
  const logSearchMutation = useLogSearch();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

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

  const LayoutComponent = isAdmin ? AdminLayout : MemberLayout;

  const content = (
    <>
      {children}
      {/* Command Palette / Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] border border-border bg-card z-[101] shadow-2xl"
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
    </>
  );

  return <LayoutComponent title={title}>{content}</LayoutComponent>;
}
