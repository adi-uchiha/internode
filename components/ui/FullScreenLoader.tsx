'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface FullScreenLoaderProps {
  message?: string;
  className?: string;
  show?: boolean;
}

export function FullScreenLoader({
  message = 'SYNCING_SYSTEM...',
  className,
  show = true,
}: FullScreenLoaderProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-center',
            className
          )}
        >
          {/* Background decorative elements - keeping it minimal as requested */}
          <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />

          <div className="relative flex flex-col items-center gap-6">
            {/* Standardized Green Spinner */}
            <div className="relative">
              <Icon icon="solar:refresh-linear" className="w-10 h-10 text-primary animate-spin" />
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
            </div>

            {/* Simple Monospace Message */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-primary uppercase tracking-[0.3em] font-medium">
                {message}
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-px bg-primary/30 mx-auto"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
