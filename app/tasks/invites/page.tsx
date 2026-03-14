'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PendingInvitation {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
}

export default function InvitesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [invites, setInvites] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await authClient.organization.listUserInvitations();
      const invitesData = (result.data ?? []) as unknown as PendingInvitation[];
      const valid = invitesData.filter(
        (inv) => inv.status === 'pending' && new Date(inv.expiresAt) > new Date()
      );
      setInvites(valid);
    } catch {
      console.error('Failed to fetch user invitations');
      toast.error('Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleAcceptInvite = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      const { error } = await authClient.organization.acceptInvitation({ invitationId });
      if (error) {
        toast.error(error.message ?? 'Failed to accept invitation');
        return;
      }
      toast.success('Welcome! You have joined the organization.');
      await queryClient.invalidateQueries();
      fetchInvites();
      router.refresh();
    } catch {
      toast.error('Failed to accept invitation');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-sm bg-primary/10">
          <Icon icon="solar:letter-opened-linear" className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Organization Invites</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest opacity-60">
            Internal Communication Requests
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
          <Icon icon="solar:refresh-linear" className="w-8 h-8 text-primary animate-spin mb-4" />
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            SCANNING_PENDING_REQUESTS...
          </div>
        </div>
      ) : invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
          <Icon icon="solar:ghost-linear" className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            NO_PENDING_INVITATIONS_FOUND
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {invites.map((invite, i) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex items-center justify-between p-6 border border-border bg-card hover:bg-muted/10 transition-all border-l-2 border-l-primary/30"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 border border-border flex items-center justify-center shrink-0 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <Icon icon="solar:buildings-2-linear" className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display font-bold text-lg truncate">
                        {invite.organizationName || 'Unknown Organization'}
                      </h2>
                      <span className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 uppercase tracking-tighter">
                        {invite.role}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="hero"
                    size="default"
                    className="h-10 px-8"
                    disabled={acceptingId === invite.id}
                    onClick={() => handleAcceptInvite(invite.id)}
                  >
                    {acceptingId === invite.id ? (
                      <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Accept Invite
                        <Icon icon="solar:check-circle-linear" className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
