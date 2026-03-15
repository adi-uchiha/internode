'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  message?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ message, className, iconClassName, size = 'md' }: SpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className="relative">
        <Icon
          icon="solar:refresh-linear"
          className={cn('text-primary animate-spin', sizeMap[size], iconClassName)}
        />
        <div
          className={cn(
            'absolute inset-0 blur-lg bg-primary/20 rounded-full animate-pulse',
            sizeMap[size]
          )}
        />
      </div>
      {message && (
        <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-medium">
          {message}
        </span>
      )}
    </div>
  );
}
