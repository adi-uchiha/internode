'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  name: string;
  image: string | null;
  ticketsDone: number;
  hoursLogged: string;
  efficiency: number;
}

interface LeaderboardProps {
  data?: LeaderboardEntry[];
  isLoading?: boolean;
}

export function Leaderboard({ data = [], isLoading = false }: LeaderboardProps) {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="border border-border bg-card p-6 h-[400px] flex items-center justify-center">
        <UnifiedLoader message="CALCULATING_RANKS..." size="sm" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-border bg-card p-6"
    >
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
        [LEADERBOARD]
      </div>
      <h3 className="font-display font-semibold text-lg mb-4">Top Contributors</h3>
      <div className="space-y-2">
        {data.map((entry, i) => {
          const isYou = entry.id === user?.id;
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <motion.div
              layout
              key={entry.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-center gap-4 p-3 border group hover:border-primary/40 transition-colors',
                isYou ? 'bg-primary/5 border-primary/30' : 'border-border bg-muted/5'
              )}
            >
              <span
                className={cn(
                  'font-mono text-sm w-10 shrink-0',
                  i < 3 ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                #{i + 1} {medals[i] || ''}
              </span>
              <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {entry.image ? (
                  <Image
                    src={entry.image}
                    alt=""
                    width={32}
                    height={32}
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Icon icon="solar:user-linear" className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm flex-1 truncate font-medium">
                {isYou ? <span className="text-primary">You</span> : entry.name}
              </span>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">
                    Tickets
                  </div>
                  <div className="font-display font-bold text-xs">{entry.ticketsDone}</div>
                </div>
                <div className="text-right w-12">
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">Hours</div>
                  <div className="font-display font-bold text-xs">{entry.hoursLogged}h</div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {data.length === 0 && (
          <div className="py-20 text-center border border-dashed border-border bg-muted/5">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              No data recorded
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
