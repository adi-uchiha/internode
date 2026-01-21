'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

export const Navigation = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-7 h-7 border-2 border-foreground flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]">
              <div className="w-2.5 h-2.5 bg-foreground transition-colors duration-300 group-hover:bg-primary" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-foreground">
              INTERNODE
            </span>
          </a>

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
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-border bg-card/50">
              <div className="status-dot" />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                v1.0.0
              </span>
            </div>

            {/* Login Button */}
            <a href="/login">
              <Button variant="hero-outline" size="sm">
                <Icon icon="solar:login-2-linear" className="w-4 h-4" />
                <span>Login</span>
              </Button>
            </a>

            {/* CTA */}
            <a href="/login">
              <Button variant="hero" size="sm" className="group">
                <span>Start Engine</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>
            </a>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};
