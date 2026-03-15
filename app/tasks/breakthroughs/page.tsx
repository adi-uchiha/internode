'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useBreakthroughs, useDeleteBreakthrough } from '@/hooks/useBreakthroughs';
import { Button } from '@/components/ui/button';
import { BreakthroughModal } from '@/components/modals/BreakthroughModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Image from 'next/image';
import { format } from 'date-fns';

export default function BreakthroughsPage() {
  const { data: breakthroughs, isLoading } = useBreakthroughs();
  const { mutateAsync: deleteBreakthrough } = useDeleteBreakthrough();
  const { user, orgRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this achievement from history?')) return;
    try {
      await deleteBreakthrough(id);
      toast.success('Achievement redacted');
    } catch {
      toast.error('Failed to redact achievement');
    }
  };

  const isManager = orgRole === 'admin' || orgRole === 'owner';

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-4xl tracking-tighter">WALL_OF_FAME</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">
            Archive of system-wide technical breakthroughs
          </p>
        </div>
        <Button
          variant="hero"
          className="font-mono text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary/20 h-12"
          onClick={() => setIsModalOpen(true)}
        >
          <Icon icon="solar:star-fall-2-linear" className="w-5 h-5 mr-2" />
          Log Breakthrough
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 relative">
        <div className="absolute left-0 lg:left-1/2 top-0 bottom-0 w-px bg-border/40 -translate-x-1/2 hidden lg:block" />

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 border border-border bg-card/50 animate-pulse" />
          ))
        ) : breakthroughs?.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border bg-muted/5 rounded-xl">
            <Icon
              icon="solar:history-linear"
              className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-10"
            />
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              No achievements recorded in current epoch
            </p>
          </div>
        ) : (
          breakthroughs?.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col lg:flex-row gap-8 items-start relative ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
            >
              {/* Timeline Dot */}
              <div className="absolute left-[-13px] lg:left-1/2 top-8 w-[26px] h-[26px] bg-background border-4 border-primary rounded-full -translate-x-1/2 z-10 hidden lg:block shadow-[0_0_15px_rgba(0,255,136,0.5)]" />

              {/* Identity Section */}
              <div
                className={`w-full lg:w-[45%] flex flex-col ${i % 2 === 0 ? 'lg:items-end text-right' : 'lg:items-start text-left'}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  {i % 2 !== 0 && (
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden bg-muted p-0.5">
                      {b.user?.image ? (
                        <Image
                          src={b.user.image}
                          alt=""
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <Icon
                          icon="solar:user-linear"
                          className="w-full h-full text-muted-foreground p-2"
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="font-display font-bold text-xl">
                      {b.user?.name || 'Unknown Entity'}
                    </div>
                    <div className="font-mono text-[10px] text-primary uppercase tracking-widest">
                      {format(new Date(b.date), 'MMMM dd, yyyy')}
                    </div>
                  </div>
                  {i % 2 === 0 && (
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden bg-muted p-0.5">
                      {b.user?.image ? (
                        <Image
                          src={b.user.image}
                          alt=""
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <Icon
                          icon="solar:user-linear"
                          className="w-full h-full text-muted-foreground p-2"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Card */}
              <div className="w-full lg:w-[45%] border border-border bg-card p-6 relative group hover:border-primary/40 transition-all shadow-xl">
                <div className="absolute top-4 right-4 flex gap-2">
                  {(b.userId === user?.id || isManager) && (
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-primary/10 rounded-sm">
                    <Icon icon="solar:star-fall-2-bold" className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl tracking-tight uppercase">
                    {b.title}
                  </h3>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-mono opacity-80">
                  {b.description}
                </p>

                {b.skillTags && b.skillTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {b.skillTags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[9px] bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-sm uppercase tracking-tighter"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                  <div className="flex items-center gap-4">
                    {b.prLink && (
                      <a
                        href={b.prLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Icon icon="solar:link-linear" className="w-3 h-3" />
                        EXTERNAL_REF
                      </a>
                    )}
                  </div>
                  {b.adminComment && (
                    <div className="flex items-center gap-2 text-primary font-mono text-[10px] bg-primary/5 px-3 py-1.5 rounded-sm border border-primary/10 italic">
                      <Icon icon="solar:medal-star-linear" className="w-3 h-3" />"{b.adminComment}"
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BreakthroughModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
