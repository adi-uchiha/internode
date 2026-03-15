'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLeaves, useUpdateLeave, useDeleteLeave } from '@/hooks/useLeaves';
import { Button } from '@/components/ui/button';
import { LeaveRequestModal } from '@/components/modals/LeaveRequestModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RequireRole } from '@/components/auth/RequireRole';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

export default function LeavesPage() {
  const { data: leaves, isLoading } = useLeaves();
  const { mutateAsync: updateLeave } = useUpdateLeave();
  const { mutateAsync: deleteLeave } = useDeleteLeave();
  const { user, orgRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateLeave({ id, status });
      toast.success(`Request ${status === 'approved' ? 'authorized' : 'denied'}`);
    } catch {
      toast.error('Sync failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this sabbatical request?')) return;
    try {
      await deleteLeave(id);
      toast.success('Request redacted');
    } catch {
      toast.error('Failed to redact request');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'rejected':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-amber-400/20 text-amber-400 border-amber-400/30';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-4xl tracking-tighter">LEAVE_REGISTRY</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">
            Sabbatical tracking and HR coordination hub
          </p>
        </div>
        <Button
          variant="hero"
          className="font-mono text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary/20 h-12"
          onClick={() => setIsModalOpen(true)}
        >
          <Icon icon="solar:calendar-minimalistic-linear" className="w-5 h-5 mr-2" />
          Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <UnifiedLoader message="LOADING_LEAVE_REGISTRY..." />
          </div>
        ) : leaves?.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border bg-muted/5 rounded-xl">
            <Icon
              icon="solar:calendar-add-linear"
              className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-10"
            />
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              No active leave vectors in registry
            </p>
          </div>
        ) : (
          leaves?.map((leaf, i) => (
            <motion.div
              key={leaf.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group border border-border bg-card p-5 flex items-center gap-6 relative overflow-hidden hover:border-primary/30 transition-all"
            >
              <div
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1 bg-amber-400',
                  leaf.status === 'approved' && 'bg-primary',
                  leaf.status === 'rejected' && 'bg-destructive'
                )}
              />

              <div className="w-12 h-12 rounded-sm border border-border overflow-hidden bg-muted shrink-0 p-0.5">
                {leaf.user?.image ? (
                  <Image
                    src={leaf.user.image}
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-display font-bold text-lg">
                    {leaf.user?.name || 'Anonymous User'}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[9px] uppercase px-2 py-0.5 border rounded-full',
                      getStatusStyle(leaf.status)
                    )}
                  >
                    {leaf.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground uppercase">
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:tag-linear" className="w-3 h-3" />
                    {leaf.type.replace('-', '_')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:calendar-linear" className="w-3 h-3" />
                    {format(new Date(leaf.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              <div className="flex-1 hidden md:block">
                <p className="text-xs text-muted-foreground italic truncate max-w-[300px]">
                  "{leaf.reason || 'No justification provided'}"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <RequireRole role="admin">
                  {leaf.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 border-primary/30 text-primary hover:bg-primary/10 font-mono text-[10px] uppercase"
                        onClick={() => handleStatusUpdate(leaf.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 border-destructive/30 text-destructive hover:bg-destructive/10 font-mono text-[10px] uppercase"
                        onClick={() => handleStatusUpdate(leaf.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </RequireRole>
                {(leaf.userId === user?.id || isAdmin) && (
                  <button
                    onClick={() => handleDelete(leaf.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <LeaveRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
