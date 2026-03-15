'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface UnifiedLoaderProps {
  message?: string;
  className?: string;
  variant?: 'inline' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
  show?: boolean;
}

/**
 * A standardized, premium loader for Internode.
 * Consolidates FullScreenLoader and Spinner into a single unified aesthetic.
 */
export function UnifiedLoader({
  message = 'INITIALIZING_SYSTEM...',
  className,
  variant = 'inline',
  size = 'md',
  show = true,
}: UnifiedLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />

        {/* Main Spinner Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Icon
            icon="solar:refresh-linear"
            className={cn(
              'text-primary',
              variant === 'fullscreen' ? 'w-12 h-12' : sizeClasses[size]
            )}
          />
        </motion.div>

        {/* Subtle Inner Detail */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              'bg-primary/10 rounded-full',
              variant === 'fullscreen' ? 'w-4 h-4' : 'w-2 h-2'
            )}
          />
        </div>
      </div>

      {message && (
        <div className="space-y-1.5 flex flex-col items-center">
          <span
            className={cn(
              'font-mono text-primary uppercase tracking-[0.2em] font-bold animate-pulse',
              variant === 'fullscreen' ? 'text-[11px]' : 'text-[9px]'
            )}
          >
            {message}
          </span>
          {variant === 'fullscreen' && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-px bg-primary/30"
            />
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            {/* Engineering Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.5px,transparent_0.5px)] bg-size-[24px_24px] opacity-[0.03] pointer-events-none" />
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return content;
}
