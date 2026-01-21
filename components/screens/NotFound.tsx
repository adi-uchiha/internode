'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-6">
          <span className="font-mono text-8xl font-light text-primary">404</span>
        </div>
        <h1 className="mb-2 font-display text-2xl font-medium text-foreground">Route not found</h1>
        <p className="mb-8 font-mono text-sm text-muted-foreground">
          [ERROR] The requested path does not exist
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
          Return to Base
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
