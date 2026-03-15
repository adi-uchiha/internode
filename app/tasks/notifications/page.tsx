'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutateAsync: markAsRead } = useMarkNotificationsRead();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => filter === 'all' || !n.read);

  const handleMarkAllRead = async () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount > 0) {
      await markAsRead(undefined);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-4xl tracking-tighter">SIGNAL_HUB</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">
            Centralized system intelligence and event stream
          </p>
        </div>
        <Button
          variant="outline"
          className="font-mono text-[10px] uppercase tracking-widest px-6 h-10 border-border"
          onClick={handleMarkAllRead}
          disabled={!notifications.some((n) => !n.read)}
        >
          Clear All Sigils
        </Button>
      </div>

      <div className="flex gap-4 border-b border-border pb-px">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={cn(
              'pb-4 px-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all relative',
              filter === f ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f}
            {filter === f && (
              <motion.div
                layoutId="activeFilter"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(0,255,136,0.5)]"
              />
            )}
            {f === 'unread' && notifications.some((n) => !n.read) && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <UnifiedLoader message="SYNCING_SIGNAL_HUB..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border bg-muted/5 opacity-40">
            <Icon
              icon="solar:bell-off-linear"
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
            />
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Neutral frequency. No signals detected.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'group border p-5 flex gap-5 relative transition-all',
                  n.read
                    ? 'bg-card border-border opacity-70'
                    : 'bg-primary/3 border-primary/30 shadow-[0_0_15px_rgba(0,255,136,0.05)]'
                )}
              >
                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                <div
                  className={cn(
                    'w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border',
                    {
                      'bg-primary/10 border-primary/20 text-primary': n.type === 'assigned',
                      'bg-destructive/10 border-destructive/20 text-destructive':
                        n.type === 'overdue',
                      'bg-blue-400/10 border-blue-400/20 text-blue-400': n.type === 'status',
                      'bg-amber-400/10 border-amber-400/20 text-amber-400':
                        n.type === 'time-logged',
                      'bg-purple-400/10 border-purple-400/20 text-purple-400': n.type === 'comment',
                    }
                  )}
                >
                  <Icon
                    icon={
                      n.type === 'assigned'
                        ? 'solar:user-plus-linear'
                        : n.type === 'overdue'
                          ? 'solar:alarm-linear'
                          : n.type === 'status'
                            ? 'solar:round-transfer-diagonal-linear'
                            : n.type === 'time-logged'
                              ? 'solar:clock-circle-linear'
                              : 'solar:chat-round-line-linear'
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3 className="font-display font-bold text-lg truncate uppercase tracking-tight">
                      {n.title}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 uppercase opacity-60">
                      {format(new Date(n.createdAt), 'MMM dd | HH:mm')}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                    {n.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
