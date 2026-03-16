import Link from 'next/link';
import { AuthButtons } from './AuthButtons';
import { FadeIn } from './Animations';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';

export const Navigation = () => {
  return (
    <FadeIn
      direction="none"
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-7 h-7 border-2 border-foreground flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]">
              <div className="w-2.5 h-2.5 bg-foreground transition-colors duration-300 group-hover:bg-primary" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-foreground uppercase">
              {NEXT_PUBLIC_APP_NAME}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-display animated-underline"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <AuthButtons />
        </nav>
      </div>
    </FadeIn>
  );
};
