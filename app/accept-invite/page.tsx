'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
  inviterName?: string;
}

type PageState =
  | 'loading' // fetching the invitation
  | 'unauthenticated' // user not logged in
  | 'ready' // invitation valid, user logged in — show confirm UI
  | 'accepting' // awaiting acceptInvitation response
  | 'success' // accepted, redirecting
  | 'error'; // expired, invalid, already used

// ─── Content ──────────────────────────────────────────────────────────────────

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invitationId');
  const queryClient = useQueryClient();

  const [state, setState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Guard: once we've fetched or processed the invitation, don't re-fetch
  // even if session data changes (e.g. after queryClient.clear()).
  const hasFetchedRef = useRef(false);

  const { data: sessionData, isPending: sessionLoading } = authClient.useSession();
  const user = sessionData?.user;

  // ── Fetch invitation details ───────────────────────────────────────────────
  useEffect(() => {
    if (sessionLoading) return; // Wait for session to resolve

    // Once we've successfully loaded the invitation (or moved to a terminal
    // state like accepting/success), don't re-fetch. This prevents
    // queryClient.clear() from triggering a re-fetch on the now-accepted invite.
    if (hasFetchedRef.current) return;

    if (!invitationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMessage(
        'No invitation ID provided in the link. Please use the full invite link from your email.'
      );

      setState('error');
      return;
    }

    if (!user) {
      // Not logged in — defer to "unauthenticated" state

      setState('unauthenticated');
      return;
    }

    // User is logged in — fetch the invitation
    const fetchInvitation = async () => {
      try {
        const { data, error } = await (
          authClient.organization.getInvitation as (opts: {
            query: { id: string };
          }) => Promise<{ data: unknown; error: { message?: string } | null }>
        )({
          query: { id: invitationId },
        });

        if (error || !data) {
          setErrorMessage(
            error?.message ||
              'This invitation could not be found. It may have already been revoked.'
          );
          setState('error');
          return;
        }

        // Client-side expiry guard
        const rawExpiry = (data as { expiresAt: Date | string }).expiresAt;
        if (new Date(rawExpiry as string) < new Date()) {
          setErrorMessage(
            'This invitation has expired. Please ask the organization admin to send a new one.'
          );
          setState('error');
          return;
        }

        if ((data as { status: string }).status !== 'pending') {
          if ((data as { status: string }).status === 'accepted') {
            setErrorMessage('This invitation has already been accepted.');
          } else {
            setErrorMessage(
              `This invitation is no longer active (status: ${(data as { status: string }).status}).`
            );
          }
          setState('error');
          return;
        }

        // Map better-auth data to our local type.
        // Note: getInvitation returns org info as flat top-level fields
        // (organizationName, organizationSlug, inviterEmail), NOT nested objects.
        const invData = data as {
          id: string;
          email: string;
          role: string;
          status: string;
          expiresAt: Date | string;
          organizationId: string;
          organizationName?: string;
          organizationSlug?: string;
          inviterEmail?: string;
        };

        setInvitation({
          id: invData.id,
          email: invData.email,
          role: invData.role,
          status: invData.status,
          expiresAt: invData.expiresAt as string,
          organizationId: invData.organizationId,
          organizationName: invData.organizationName ?? 'Unknown Organization',
          organizationSlug: invData.organizationSlug,
          inviterName: undefined, // getInvitation only returns inviterEmail, not name
        });
        hasFetchedRef.current = true;
        setState('ready');
      } catch (err) {
        console.error('[accept-invite] Failed to fetch invitation:', err);
        setErrorMessage('Failed to load invitation details. Please try again.');
        setState('error');
      }
    };

    fetchInvitation();
  }, [invitationId, user, sessionLoading]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAccept = async () => {
    if (!invitationId || state === 'accepting' || state === 'success') return;
    setState('accepting');

    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message ?? 'Failed to accept invitation. Please try again.');
        setState('ready');
        return;
      }

      // Explicitly set the newly joined organization as the active one
      if (invitation?.organizationId) {
        await authClient.organization.setActive({ organizationId: invitation.organizationId });
      }

      // Clear all query caches so the TaskManagerLayout doesn't see stale
      // org data (empty list → onboarding flash) when we navigate.
      queryClient.clear();

      toast.success(`Welcome to ${invitation?.organizationName}!`);
      setState('success');
      // Small delay so the success animation is visible
      setTimeout(() => router.replace('/tasks/dashboard'), 2000);
    } catch (err) {
      console.error('[accept-invite] Accept failed:', err);
      toast.error('An unexpected error occurred. Please try again.');
      setState('ready');
    }
  };

  const handleSignInRedirect = () => {
    const returnUrl = encodeURIComponent(`/accept-invite?invitationId=${invitationId}`);
    router.push(`/login?redirect=${returnUrl}`);
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const capitalizedRole =
    invitation?.role?.charAt(0).toUpperCase() + (invitation?.role?.slice(1) ?? '');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-[15%] -left-[15%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[15%] -right-[15%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo bar */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-8 h-8 border-2 border-primary flex items-center justify-center">
            <div className="w-3 h-3 bg-primary" />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight">INTERNODE</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Loading ──────────────────────────────────────────────── */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="border border-border bg-card p-10 text-center space-y-4"
            >
              <Icon
                icon="solar:refresh-linear"
                className="w-10 h-10 text-primary mx-auto animate-spin"
              />
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Verifying invitation...
              </p>
            </motion.div>
          )}

          {/* ── Unauthenticated ──────────────────────────────────────── */}
          {state === 'unauthenticated' && (
            <motion.div
              key="unauth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="border border-border bg-card overflow-hidden"
            >
              <div className="h-1 w-full bg-primary" />
              <div className="p-10 space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 border-2 border-primary bg-primary/5 rounded-full flex items-center justify-center">
                    <Icon
                      icon="solar:letter-opened-bold-duotone"
                      className="w-10 h-10 text-primary"
                    />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    You have been invited
                  </h1>
                  <p className="text-muted-foreground text-sm font-mono">
                    Sign in to view and accept your organization invitation.
                  </p>
                </div>

                {/* Invitation ID hint */}
                <div className="p-4 border border-border bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="solar:shield-check-linear"
                      className="w-4 h-4 text-primary shrink-0"
                    />
                    <p className="font-mono text-xs text-muted-foreground">
                      Invitation ID:{' '}
                      <span className="text-foreground">{invitationId?.slice(0, 12)}...</span>
                    </p>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full h-14 text-sm font-bold tracking-widest uppercase"
                  onClick={handleSignInRedirect}
                >
                  Sign in to Accept
                  <Icon icon="solar:login-2-linear" className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Ready — show confirm UI ──────────────────────────────── */}
          {(state === 'ready' || state === 'accepting') && invitation && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="border border-border bg-card overflow-hidden"
            >
              <div className="h-1 w-full bg-primary" />
              <div className="p-10 space-y-8">
                {/* Org avatar */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 border-2 border-primary bg-primary/5 rounded-full flex items-center justify-center">
                    <Icon
                      icon="solar:buildings-2-bold-duotone"
                      className="w-10 h-10 text-primary"
                    />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    Join {invitation.organizationName}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {invitation.inviterName
                      ? `${invitation.inviterName} has invited you`
                      : 'You have been invited'}{' '}
                    to collaborate on Internode.
                  </p>
                </div>

                {/* Details card */}
                <div className="border border-border bg-muted/5 divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Organization
                    </span>
                    <span className="font-display font-semibold text-sm">
                      {invitation.organizationName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Your Role
                    </span>
                    <span
                      className={cn(
                        'font-mono text-xs uppercase px-2 py-0.5 border',
                        invitation.role === 'owner'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          : invitation.role === 'admin'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {capitalizedRole}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Invited As
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Expires
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(invitation.expiresAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* User context notice */}
                <div className="flex items-start gap-3 p-3 border border-border bg-muted/5">
                  <Icon
                    icon="solar:user-check-linear"
                    className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0"
                  />
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                    You are signed in as <strong className="text-foreground">{user?.email}</strong>.
                    This invitation is addressed to{' '}
                    <strong className="text-foreground">{invitation.email}</strong>.
                  </p>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full h-14 text-sm font-bold tracking-widest uppercase shadow-xl shadow-primary/20"
                  onClick={handleAccept}
                  disabled={state === 'accepting'}
                >
                  {state === 'accepting' ? (
                    <>
                      <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                      <span className="ml-2">Joining organization...</span>
                    </>
                  ) : (
                    <>
                      Accept Invitation
                      <Icon icon="solar:check-circle-linear" className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center font-mono text-[10px] text-muted-foreground">
                  By accepting, you agree to collaborate within{' '}
                  <strong>{invitation.organizationName}</strong> on Internode.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Success ──────────────────────────────────────────────── */}
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-border bg-card overflow-hidden"
            >
              <div className="h-1 w-full bg-primary" />
              <div className="p-10 text-center space-y-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-24 h-24 mx-auto border-2 border-primary bg-primary/10 rounded-full flex items-center justify-center relative"
                >
                  <Icon icon="solar:check-circle-bold-duotone" className="w-12 h-12 text-primary" />
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse -z-10" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl font-bold tracking-tight text-primary">
                    Organization Joined!
                  </h2>
                  <p className="text-muted-foreground font-mono text-sm">
                    You are now a member of{' '}
                    <strong className="text-foreground">{invitation?.organizationName}</strong>.
                    Redirecting to your dashboard...
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground font-mono text-xs">
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                  INITIALIZING_ORGANIZATION...
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-destructive/50 bg-card overflow-hidden"
            >
              <div className="h-1 w-full bg-destructive" />
              <div className="p-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto border-2 border-destructive bg-destructive/10 rounded-full flex items-center justify-center">
                  <Icon
                    icon="solar:close-circle-bold-duotone"
                    className="w-10 h-10 text-destructive"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-destructive">
                    Invitation Invalid
                  </h2>
                  <p className="text-muted-foreground font-mono text-sm max-w-xs mx-auto">
                    {errorMessage}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-11 font-mono text-xs uppercase"
                  onClick={() => router.push('/tasks/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Icon icon="solar:refresh-linear" className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
