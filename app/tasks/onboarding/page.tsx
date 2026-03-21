'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserInvitations, useAcceptInvitation } from '@/hooks/useInvites';
import { toast } from '@/lib/toast';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { safeSwitchOrganization } from '@/lib/auth-utils';

// ─── Step identifiers ─────────────────────────────────────────────────────────

type OnboardingStep =
  | 'welcome' // Welcome + check for pending invites
  | 'have-invites' // Show pending invitations to accept
  | 'create-org' // Create a new organization
  | 'success'; // Done — redirecting

// ─── Slug helper ─────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

// ─── Progress bar values ──────────────────────────────────────────────────────

const STEP_PROGRESS: Record<OnboardingStep, number> = {
  welcome: 20,
  'have-invites': 60,
  'create-org': 60,
  success: 100,
};

// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const { data: pendingInvites = [], isLoading: invitesLoading } = useUserInvitations();
  const { mutateAsync: acceptInvitation } = useAcceptInvitation();

  // org creation form
  const [orgName, setOrgName] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [manualSlug, setManualSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Computed slug
  const orgSlug = useMemo(() => {
    if (slugManuallyEdited) return manualSlug;
    return generateSlug(orgName);
  }, [orgName, manualSlug, slugManuallyEdited]);

  // invite acceptance
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAcceptInvite = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      await acceptInvitation(invitationId);
      toast.success('Welcome! You have joined the organization.');
      setStep('success');

      // Surgical invalidation so we don't wipe unrelated state (theme, session, etc.)
      // but ensure all organization-dependent data is refetched.
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      setTimeout(() => router.replace('/tasks/dashboard'), 1500);
    } catch (err: unknown) {
      console.error('Accept invite failed:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.';
      toast.error(message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error('Organization name is required.');
      return;
    }
    if (!orgSlug.trim()) {
      toast.error('Organization slug is required.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      toast.error('Slug may only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await authClient.organization.create({
        name: orgName.trim(),
        slug: orgSlug.trim(),
      });

      if (error || !data) {
        // Handle slug-taken conflict gracefully
        if (error?.message?.includes('slug') || error?.message?.includes('unique')) {
          toast.error('That organization URL is already taken. Please choose a different slug.');
        } else {
          toast.error(error?.message ?? 'Failed to create organization.');
        }
        return;
      }

      // Set the new organization as active with atomic cache clearance
      await safeSwitchOrganization(data.id, queryClient, router);

      setStep('success');
      setTimeout(() => router.replace('/tasks/dashboard'), 1500);
    } catch (err) {
      console.error('Organization creation failed:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const progress = STEP_PROGRESS[step];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.02, y: -16 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-lg border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Energy bar */}
          <div className="h-1 w-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: 'circOut' }}
            />
          </div>

          <div className="p-10">
            {/* ── STEP: Welcome ─────────────────────────────────────────────── */}
            {step === 'welcome' && (
              <div className="text-center space-y-8">
                <div className="relative inline-block">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    className="w-24 h-24 mx-auto border-2 border-primary bg-primary/5 rounded-full flex items-center justify-center relative z-10 p-1 overflow-hidden"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={96}
                        height={96}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <Icon icon="solar:user-bold-duotone" className="w-12 h-12 text-primary" />
                    )}
                  </motion.div>
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse -z-10" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                    Identity Confirmed
                  </h1>
                  <p className="text-muted-foreground font-mono text-sm">
                    Welcome,{' '}
                    <span className="text-foreground font-semibold">
                      {user?.name || user?.email?.split('@')[0] || 'Developer'}
                    </span>
                    . Let&apos;s set up your organization.
                  </p>
                </div>

                {invitesLoading ? (
                  <UnifiedLoader
                    message="SCANNING_PENDING_INVITATIONS..."
                    className="py-4"
                    size="sm"
                  />
                ) : pendingInvites.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 border border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon icon="solar:letter-opened-linear" className="w-4 h-4 text-primary" />
                        <span className="font-mono text-xs text-primary uppercase font-bold tracking-widest">
                          {pendingInvites.length} Pending{' '}
                          {pendingInvites.length === 1 ? 'Invitation' : 'Invitations'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You have been invited to join{' '}
                        {pendingInvites.length === 1 ? 'an organization' : 'organizations'} on
                        Internode.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="hero"
                        className="flex-1 h-12 font-mono text-xs uppercase"
                        onClick={() => setStep('have-invites')}
                      >
                        View Invitations
                        <Icon icon="solar:letter-opened-linear" className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 px-4 font-mono text-xs uppercase"
                        onClick={() => setStep('create-org')}
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full h-14 text-sm font-bold tracking-widest uppercase shadow-xl shadow-primary/20"
                    onClick={() => setStep('create-org')}
                  >
                    Create Your Organization
                    <Icon icon="solar:buildings-2-linear" className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* ── STEP: View & Accept Invitations ───────────────────────── */}
            {step === 'have-invites' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Pending Invitations
                  </h2>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                    Accept to join an existing organization
                  </p>
                </div>

                <div className="space-y-3">
                  {pendingInvites.map((invite, i) => (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between p-4 border border-border bg-muted/5 hover:bg-muted/10 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 border border-border flex items-center justify-center shrink-0 bg-primary/5">
                          <Icon icon="solar:buildings-2-linear" className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-sm truncate">
                            {invite.organizationName ?? 'Organization'}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground uppercase">
                            Role: {invite.role}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        size="sm"
                        className="ml-4 shrink-0 font-mono text-xs"
                        loading={acceptingId === invite.id}
                        onClick={() => handleAcceptInvite(invite.id)}
                      >
                        Accept
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1 h-11 font-mono text-xs uppercase"
                    onClick={() => setStep('welcome')}
                  >
                    <Icon icon="solar:arrow-left-linear" className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 font-mono text-xs uppercase"
                    onClick={() => setStep('create-org')}
                  >
                    Create New Instead
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP: Create Organization ──────────────────────────────── */}
            {step === 'create-org' && (
              <div className="space-y-7">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Create Your Organization
                  </h2>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                    You will be the Owner
                  </p>
                </div>

                <form onSubmit={handleCreateOrg} className="space-y-5">
                  {/* Organization Name */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block">
                      Organization Name
                    </label>
                    <Input
                      placeholder="Acme Corporation"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="bg-background border-border font-mono"
                      required
                      autoFocus
                      maxLength={80}
                    />
                    <p className="font-mono text-[10px] text-muted-foreground">
                      The full name of your organization or team.
                    </p>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block">
                      Organization URL
                    </label>
                    <div className="flex items-center border border-border bg-background overflow-hidden">
                      <span className="px-3 py-2 font-mono text-xs text-muted-foreground bg-muted/30 border-r border-border shrink-0">
                        internode.vercel.app/
                      </span>
                      <input
                        value={orgSlug}
                        onChange={(e) => {
                          setManualSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                          setSlugManuallyEdited(true);
                        }}
                        placeholder="acme-corporation"
                        className="flex-1 px-3 py-2 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                        required
                        maxLength={48}
                      />
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Lowercase letters, numbers, and hyphens only. Cannot be changed later.
                    </p>
                  </div>

                  {/* Owner notice */}
                  <div className="flex items-start gap-3 p-4 border border-border bg-muted/5">
                    <Icon
                      icon="solar:shield-star-linear"
                      className="w-5 h-5 text-primary mt-0.5 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">You will be assigned as Owner</p>
                      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                        As the owner you can invite members, manage settings, and transfer ownership
                        at any time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    {pendingInvites.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-12 px-4 font-mono text-xs uppercase"
                        onClick={() => setStep('have-invites')}
                      >
                        <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className={cn(
                        'h-12 text-sm font-bold tracking-widest uppercase shadow-xl shadow-primary/20',
                        pendingInvites.length > 0 ? 'flex-1' : 'w-full'
                      )}
                      disabled={!orgName.trim() || !orgSlug.trim()}
                      loading={isCreating}
                    >
                      Launch Organization
                      <Icon icon="solar:rocket-2-linear" className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── STEP: Success ──────────────────────────────────────────── */}
            {step === 'success' && (
              <UnifiedLoader variant="fullscreen" message="INITIALIZING_CORE..." />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
