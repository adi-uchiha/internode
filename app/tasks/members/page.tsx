'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOrgMembers,
  useOrgInvitations,
  useInviteMember,
  useCancelInvitation,
  useUpdateMemberRole,
  useRemoveMember,
  type OrgMember,
  type OrgRole,
} from '@/hooks/useInvites';
import { useTickets } from '@/hooks/useTickets';
import { startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { hasOrgRole } from '@/lib/org-utils';

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<OrgRole, { label: string; className: string; icon: string }> = {
  owner: {
    label: 'Owner',
    className: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
    icon: 'solar:crown-star-linear',
  },
  admin: {
    label: 'Admin',
    className: 'bg-primary/10 text-primary border border-primary/20',
    icon: 'solar:shield-star-linear',
  },
  member: {
    label: 'Member',
    className: 'bg-muted text-muted-foreground border border-border',
    icon: 'solar:user-linear',
  },
};

function RoleBadge({ role }: { role: OrgRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[10px] uppercase px-2 py-0.5',
        cfg.className
      )}
    >
      <Icon icon={cfg.icon} className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Member Action Menu ───────────────────────────────────────────────────────

interface MemberActionsProps {
  member: OrgMember;
  currentOrgRole: OrgRole | null;
  currentUserId: string;
}

function MemberActions({ member, currentOrgRole, currentUserId }: MemberActionsProps) {
  const { mutateAsync: updateRole, isPending: updatingRole } = useUpdateMemberRole();
  const { mutateAsync: removeMember, isPending: removing } = useRemoveMember();
  const [open, setOpen] = useState(false);

  const isCurrentUser = member.userId === currentUserId;
  const canManage = hasOrgRole(currentOrgRole, 'admin') && !isCurrentUser;
  const canPromote = canManage && member.role === 'member' && hasOrgRole(currentOrgRole, 'admin');
  const canDemote = canManage && member.role === 'admin' && hasOrgRole(currentOrgRole, 'owner');
  const canRemove = canManage && member.role !== 'owner' && hasOrgRole(currentOrgRole, 'admin');

  if (!canManage) return null;

  const handlePromote = async () => {
    setOpen(false);
    try {
      await updateRole({ memberId: member.id, role: 'admin' });
      toast.success(`${member.user.name || member.user.email} promoted to Admin`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to promote member');
    }
  };

  const handleDemote = async () => {
    setOpen(false);
    try {
      await updateRole({ memberId: member.id, role: 'member' });
      toast.success(`${member.user.name || member.user.email} demoted to Member`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to demote member');
    }
  };

  const handleRemove = async () => {
    setOpen(false);
    if (
      !confirm(
        `Remove ${member.user.name || member.user.email} from the organization? This cannot be undone.`
      )
    )
      return;
    try {
      await removeMember(member.id);
      toast.success(`${member.user.name || member.user.email} removed from organization`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to remove member');
    }
  };

  const anyPending = updatingRole || removing;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={anyPending}
        className="p-1.5 hover:bg-muted/50 transition-colors rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {anyPending ? (
          <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
        ) : (
          <Icon icon="solar:menu-dots-bold" className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1 w-48 bg-card border border-border z-50 shadow-xl overflow-hidden"
            >
              {canPromote && (
                <button
                  onClick={handlePromote}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon icon="solar:shield-up-linear" className="w-4 h-4 text-primary" />
                  Promote to Admin
                </button>
              )}
              {canDemote && (
                <button
                  onClick={handleDemote}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon icon="solar:shield-down-linear" className="w-4 h-4 text-amber-400" />
                  Demote to Member
                </button>
              )}
              {canRemove && (
                <button
                  onClick={handleRemove}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-destructive/10 hover:text-destructive transition-colors text-left text-muted-foreground"
                >
                  <Icon icon="solar:user-minus-linear" className="w-4 h-4" />
                  Remove from Org
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void;
}

function InviteModal({ onClose }: InviteModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');
  const { mutateAsync: inviteMember, isPending: isInviting } = useInviteMember();
  const { mutateAsync: cancelInvitation, isPending: canceling } = useCancelInvitation();
  const { data: invitations, isLoading: invitesLoading } = useOrgInvitations();

  const pendingInvites = useMemo(
    () => invitations?.filter((i) => i.status === 'pending') ?? [],
    [invitations]
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      await inviteMember({ email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to send invitation');
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(`Revoke invitation to ${email}?`)) return;
    try {
      await cancelInvitation(id);
      toast.success('Invitation revoked');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to revoke invitation');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-70"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border z-71 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="h-0.5 w-full bg-primary" />

        <div className="p-8 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-xl tracking-tight">
                Invite Team Member
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                Invitation expires in 7 days
              </p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted transition-colors rounded-sm">
              <Icon icon="solar:close-circle-linear" className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-5">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="dev@company.com"
                className="w-full bg-muted/30 border-border"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-3">
                Assigned Role
              </label>
              <div className="flex gap-3">
                {(['admin', 'member'] as const).map((r) => (
                  <label
                    key={r}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 border cursor-pointer hover:border-primary/50 transition-colors group',
                      inviteRole === r
                        ? 'bg-primary/10 border-primary'
                        : 'border-border bg-muted/20'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={inviteRole === r}
                      onChange={() => setInviteRole(r)}
                      className="accent-primary w-4 h-4"
                    />
                    <span
                      className={cn(
                        'text-sm font-medium capitalize',
                        inviteRole === r ? 'text-primary' : ''
                      )}
                    >
                      {r}
                    </span>
                    <Icon
                      icon={ROLE_CONFIG[r].icon}
                      className={cn(
                        'w-3.5 h-3.5',
                        inviteRole === r ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full py-6 text-sm"
              disabled={isInviting || !inviteEmail.trim()}
            >
              {isInviting ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                  <span className="ml-2">Sending...</span>
                </>
              ) : (
                <>
                  <Icon icon="solar:letter-opened-linear" className="w-4 h-4" />
                  <span className="ml-2">Send Invitation</span>
                </>
              )}
            </Button>
          </form>

          {/* Pending Invites */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
              <span>Pending Invitations</span>
              {pendingInvites.length > 0 && (
                <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 text-[9px]">
                  {pendingInvites.length} pending
                </span>
              )}
            </div>

            <div className="space-y-2">
              {invitesLoading ? (
                <div className="p-4 text-center font-mono text-[10px] text-muted-foreground animate-pulse">
                  LOADING_INVITE_QUEUE...
                </div>
              ) : pendingInvites.length === 0 ? (
                <div className="p-4 text-center font-mono text-[10px] text-muted-foreground opacity-50 italic">
                  NO_PENDING_INVITATIONS
                </div>
              ) : (
                pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-muted/10 border border-border/50"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-xs truncate">{invite.email}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {invite.role} ·{' '}
                        <span className="text-amber-400/70">
                          Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleRevoke(invite.id, invite.email)}
                      disabled={canceling}
                      className="ml-3 shrink-0 font-mono text-[10px] uppercase text-muted-foreground hover:text-destructive transition-colors px-2 py-1 hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [showInvite, setShowInvite] = useState(false);
  const { user: currentUser, session, orgRole: currentOrgRole } = useAuth();

  // Current user's org-level role from the active org
  const activeOrgId = session?.session.activeOrganizationId;

  const { data: orgMembers, isLoading: membersLoading } = useOrgMembers();
  const { data: tickets } = useTickets();

  const canInvite = hasOrgRole(currentOrgRole, 'admin');

  // Enrich members with computed metrics
  const enrichedMembers = useMemo(() => {
    if (!orgMembers) return [];
    const now = new Date();
    const startWeek = startOfWeek(now, { weekStartsOn: 1 });

    return orgMembers.map((member) => {
      const activeTickets =
        tickets?.filter((t) => t.assigneeId === member.userId && t.status !== 'done').length ?? 0;

      const hoursThisWeek =
        tickets
          ?.flatMap((t) => t.timeLogs || [])
          .filter((l) => l.userId === member.userId && new Date(l.date) >= startWeek)
          .reduce((sum, l) => sum + (l.hours || 0), 0) ?? 0;

      const efficiency = Math.min(100, Math.round((hoursThisWeek / 40) * 100));

      return { ...member, activeTickets, hoursThisWeek, efficiency };
    });
  }, [orgMembers, tickets]);

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-sm text-muted-foreground">
        <Icon icon="solar:refresh-linear" className="w-5 h-5 animate-spin mr-2" />
        LOADING_TEAM_ROSTER...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-6 border border-border">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-mono text-primary">{enrichedMembers.length}</span> active members
            {activeOrgId && (
              <span className="ml-2 font-mono text-[10px] text-muted-foreground/50 uppercase">
                · Org: {activeOrgId.slice(0, 8)}...
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Current user's role badge */}
          {currentOrgRole && (
            <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              Your role:
              <RoleBadge role={currentOrgRole} />
            </div>
          )}

          {canInvite && (
            <Button variant="hero" onClick={() => setShowInvite(true)} className="w-full md:w-auto">
              <Icon icon="solar:user-plus-linear" className="w-4 h-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedMembers.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="border border-border bg-card p-6 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
          >
            {/* Owner/admin glow accent */}
            {member.role === 'owner' && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-400/0 via-amber-400 to-amber-400/0" />
            )}
            {member.role === 'admin' && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40" />
            )}

            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-13 h-13 rounded-full border border-border group-hover:border-primary/50 transition-colors overflow-hidden bg-muted flex items-center justify-center">
                    {member.user.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user.name || ''}
                        width={52}
                        height={52}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <Icon icon="solar:user-linear" className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  {/* Online dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base leading-tight">
                    {member.user.name || 'Anonymous User'}
                    {member.userId === currentUser?.id && (
                      <span className="ml-2 font-mono text-[9px] text-muted-foreground opacity-60">
                        (you)
                      </span>
                    )}
                  </h3>
                  <p className="font-mono text-[10px] text-muted-foreground break-all">
                    {member.user.email}
                  </p>
                </div>
              </div>

              <MemberActions
                member={member}
                currentOrgRole={currentOrgRole}
                currentUserId={currentUser?.id ?? ''}
              />
            </div>

            <div className="mb-4">
              <RoleBadge role={member.role as OrgRole} />
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Active Tickets
                </span>
                <span className="text-sm font-medium">{member.activeTickets}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Hours (week)
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {member.hoursThisWeek.toFixed(1)}h
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

              {/* Efficiency bar */}
              <div className="w-full h-0.5 bg-muted mt-1">
                <div
                  className={cn(
                    'h-full transition-all',
                    member.efficiency >= 85
                      ? 'bg-primary'
                      : member.efficiency >= 60
                        ? 'bg-amber-400'
                        : 'bg-destructive'
                  )}
                  style={{ width: `${member.efficiency}%` }}
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 mt-4">
              <div className="font-mono text-[9px] text-muted-foreground opacity-40 uppercase tracking-widest">
                Member since {new Date(member.createdAt).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {enrichedMembers.length === 0 && !membersLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 text-center border border-dashed border-border bg-card/30">
          <Icon
            icon="solar:users-group-two-rounded-linear"
            className="w-12 h-12 text-muted-foreground/30"
          />
          <div>
            <p className="font-display font-semibold text-lg text-muted-foreground">
              No members yet
            </p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">
              Invite your team to get started
            </p>
          </div>
          {canInvite && (
            <Button variant="hero" onClick={() => setShowInvite(true)} className="mt-2">
              <Icon icon="solar:user-plus-linear" className="w-4 h-4" />
              Invite First Member
            </Button>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  );
}
