'use client';

import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkCompatProps extends Omit<LinkProps, 'className' | 'href'> {
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
  children: React.ReactNode;
  to: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, to, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === to;

    const computedClassName =
      typeof className === 'function'
        ? className({ isActive })
        : cn(className, isActive && activeClassName);

    return <Link ref={ref} href={to} className={computedClassName} {...props} />;
  }
);

NavLink.displayName = 'NavLink';

export { NavLink };
