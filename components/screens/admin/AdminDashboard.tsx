'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useUsers } from '@/hooks/useUsers';
import { useLeaves, useUpdateLeave } from '@/hooks/useLeaves';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: leaves = [], isLoading: leavesLoading } = useLeaves();
  const { mutate: updateLeave } = useUpdateLeave();

  const members = users.filter((u) => u.role === 'member');
  const greenCount = members.filter((i) => i.logStatus === 'green').length;
  const yellowCount = members.filter((i) => i.logStatus === 'yellow').length;
  const redCount = members.filter((i) => i.logStatus === 'red').length;

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  return (
    <AdminLayout title="HUD Dashboard">
      <div className="space-y-8">
        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Productive',
              count: greenCount,
              color: 'bg-green-500',
              icon: 'solar:check-circle-linear',
            },
            {
              label: 'Has Blocker',
              count: yellowCount,
              color: 'bg-yellow-500',
              icon: 'solar:danger-triangle-linear',
            },
            {
              label: 'Missing Log',
              count: redCount,
              color: 'bg-red-500',
              icon: 'solar:close-circle-linear',
            },
          ].map((status, i) => (
            <motion.div
              key={status.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 ${status.color}`} />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  [{status.label}]
                </span>
              </div>
              <div className="font-display text-4xl font-bold">{status.count}</div>
            </motion.div>
          ))}
        </div>

        {/* Intern Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6"
        >
          <h2 className="font-display font-semibold text-lg mb-6">Team Status</h2>

          {usersLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm py-4 animate-pulse">
              <Icon icon="solar:spinner-linear" className="animate-spin" /> Loading team status...
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border font-mono text-sm text-muted-foreground">
              No members currently onboarding to Internode.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {members.map((intern) => (
                <div
                  key={intern.id}
                  className="border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-3 h-3 rounded-full ${intern.logStatus === 'green' ? 'bg-green-500' : intern.logStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}
                    />
                    {intern.lastLogTime && (
                      <span className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                        {formatDistanceToNow(new Date(intern.lastLogTime), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div className="relative w-10 h-10 border border-border mb-2 overflow-hidden shrink-0">
                    {intern.image ? (
                      <Image
                        src={intern.image}
                        alt={intern.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Icon icon="solar:user-linear" className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-sm truncate font-semibold mb-1">{intern.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase opacity-80">
                    {intern.department || 'Engineering'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Leave Requests */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg">Pending PTO Requests</h2>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              [ACTION_REQUIRED]
            </div>
          </div>

          <div className="space-y-3">
            {leavesLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                Loading requests...
              </div>
            ) : pendingLeaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border text-sm">
                No pending leave requests!
              </div>
            ) : (
              pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 border border-border bg-background"
                >
                  <div className="flex gap-4 items-center">
                    <div className="relative w-10 h-10 overflow-hidden border border-border shrink-0">
                      {leave.user?.image ? (
                        <Image
                          src={leave.user.image}
                          alt={leave.user.name || 'Intern'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Icon
                            icon="solar:user-linear"
                            className="w-5 h-5 text-muted-foreground"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-sm font-semibold">{leave.user?.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {new Date(leave.date).toLocaleDateString()} • {leave.type.toUpperCase()}
                      </div>
                      {leave.reason && (
                        <div className="font-mono text-xs mt-1 text-foreground/80">
                          "{leave.reason}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateLeave({ id: leave.id, status: 'approved' })}
                      className="px-3 py-1.5 border border-border hover:border-primary hover:bg-primary/10 text-xs font-mono transition-colors"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => updateLeave({ id: leave.id, status: 'rejected' })}
                      className="px-3 py-1.5 border border-border hover:border-destructive hover:bg-destructive/10 text-xs font-mono transition-colors"
                    >
                      DENY
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
