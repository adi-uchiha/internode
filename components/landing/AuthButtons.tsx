'use client';

import { useIsMounted } from '@/hooks/use-mounted';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export const AuthButtons = () => {
  const isMounted = useIsMounted();
  const { data: session, isPending } = authClient.useSession();

  if (!isMounted || isPending) {
    return <div className="w-24 h-9 animate-pulse bg-muted/20" />;
  }

  if (session) {
    return (
      <Link href="/tasks/dashboard">
        <Button variant="hero" size="sm" className="group">
          <span>Go to Dashboard</span>
          <Icon
            icon="solar:arrow-right-linear"
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-border bg-card/50">
        <div className="status-dot" />
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          v1.0.0
        </span>
      </div>

      {/* Login Button */}
      <Link href="/login">
        <Button variant="hero-outline" size="sm">
          <Icon icon="solar:login-2-linear" className="w-4 h-4" />
          <span>Login</span>
        </Button>
      </Link>

      {/* CTA */}
      <Link href="/login">
        <Button variant="hero" size="sm" className="group">
          <span>Start Engine</span>
          <Icon
            icon="solar:arrow-right-linear"
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Button>
      </Link>
    </div>
  );
};
