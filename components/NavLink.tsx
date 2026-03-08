'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

type NavLinkCombinedProps = NavLinkProps &
  Omit<React.ComponentProps<typeof Link>, keyof NavLinkProps>;

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCombinedProps>(
  ({ className, activeClassName, pendingClassName, href, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <Link ref={ref} href={href} className={cn(className, isActive && activeClassName)} {...props}>
        {children}
      </Link>
    );
  }
);

NavLink.displayName = 'NavLink';

export { NavLink };
