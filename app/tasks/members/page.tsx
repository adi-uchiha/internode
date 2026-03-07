'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { tmMembers } from '@/data/taskManagerData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function MembersPage() {
  const [showInvite, setShowInvite] = useState(false);

  const pendingInvites = [
    { email: 'neha@company.com', role: 'member', status: 'Pending' },
    { email: 'vikram@company.com', role: 'member', status: 'Expired' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-6 border border-border">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tmMembers.length} active members in InternHub
          </p>
        </div>
        <Button variant="hero" onClick={() => setShowInvite(true)} className="w-full md:w-auto">
          <Icon icon="solar:user-plus-linear" className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tmMembers.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-border bg-card p-6 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-14 h-14 rounded-full border border-border group-hover:border-primary/50 transition-colors"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-card" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">{member.name}</h3>
                <p className="font-mono text-[11px] text-muted-foreground break-all">
                  {member.email}
                </p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Role
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px] uppercase px-2 py-0.5 rounded-sm',
                    member.role === 'admin'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {member.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tickets
                </span>
                <span className="text-sm font-medium">{member.ticketsActive} active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Hours (this week)
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {member.hoursThisWeek}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Efficiency
                </span>
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    member.efficiency >= 85
                      ? 'text-primary'
                      : member.efficiency >= 60
                        ? 'text-amber-400'
                        : 'text-destructive'
                  )}
                >
                  {member.efficiency}%
                </span>
              </div>
            </div>

            <div className="border-t border-border/50 pt-5 mt-5 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 font-mono text-xs border-border/50"
              >
                View Profile
              </Button>
              {member.role !== 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 font-mono text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-70"
              onClick={() => setShowInvite(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border z-71 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-xl tracking-tight">
                  Invite New Member
                </h3>
                <button
                  onClick={() => setShowInvite(false)}
                  className="p-1 hover:bg-muted transition-colors rounded-sm"
                >
                  <Icon
                    icon="solar:close-circle-linear"
                    className="w-5 h-5 text-muted-foreground"
                  />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                    Email Address
                  </label>
                  <Input
                    placeholder="user@company.com"
                    className="w-full bg-muted/30 border-border"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-3">
                    Assigned Role
                  </label>
                  <div className="flex gap-4">
                    {['Admin', 'Member'].map((r) => (
                      <label
                        key={r}
                        className="flex-1 flex items-center justify-center gap-2 p-3 border border-border bg-muted/20 cursor-pointer hover:border-primary/50 transition-colors group"
                      >
                        <input
                          type="radio"
                          name="role"
                          defaultChecked={r === 'Member'}
                          className="accent-primary w-4 h-4"
                        />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {r}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  variant="hero"
                  className="w-full py-6 text-sm"
                  onClick={() => setShowInvite(false)}
                >
                  Send Invitation
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                  Pending Invites
                </div>
                <div className="space-y-2">
                  {pendingInvites.map((invite, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/10 border border-border/50"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{invite.email}</span>
                        <span className="text-[10px] text-muted-foreground">{invite.role}</span>
                      </div>
                      <span
                        className={cn(
                          'font-mono text-[10px] uppercase px-2 py-0.5 rounded-sm',
                          invite.status === 'Pending'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {invite.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
