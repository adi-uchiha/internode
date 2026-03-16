'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { Icon } from '@iconify/react';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <Icon icon="ph:check-circle-duotone" className="size-5 text-primary" />,
        info: <Icon icon="ph:info-duotone" className="size-5 text-blue-400" />,
        warning: <Icon icon="ph:warning-duotone" className="size-5 text-yellow-500" />,
        error: <Icon icon="ph:x-circle-duotone" className="size-5 text-destructive" />,
        loading: (
          <Icon icon="ph:spinner-gap-duotone" className="size-5 animate-spin text-primary" />
        ),
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--card))',
          '--normal-text': 'hsl(var(--card-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--border-radius': '12px',
          '--success-bg': 'hsl(var(--card))',
          '--success-text': 'hsl(var(--primary))',
          '--success-border': 'hsl(var(--primary) / 0.2)',
          '--error-bg': 'hsl(var(--card))',
          '--error-text': 'hsl(var(--destructive))',
          '--error-border': 'hsl(var(--destructive) / 0.2)',
          '--warning-bg': 'hsl(var(--card))',
          '--warning-text': 'hsl(45 100% 50%)',
          '--warning-border': 'hsl(45 100% 50% / 0.2)',
          '--info-bg': 'hsl(var(--card))',
          '--info-text': 'hsl(210 100% 50%)',
          '--info-border': 'hsl(210 100% 50% / 0.2)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'cn-toast group rounded-xl border bg-card text-card-foreground border-border shadow-lg px-4 py-3 min-w-[350px] transition-all duration-300 ease-in-out',
          success: 'success-toast !border-primary/20 !bg-card',
          error: 'error-toast !border-destructive/20 !bg-card',
          warning: 'warning-toast !border-yellow-500/20 !bg-card',
          info: 'info-toast !border-blue-500/20 !bg-card',
          title: 'text-sm font-semibold tracking-tight font-sans text-foreground',
          description: 'text-xs text-muted-foreground font-sans mt-1',
          actionButton:
            'bg-primary text-primary-foreground font-sans text-xs font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity',
          cancelButton:
            'bg-muted text-muted-foreground font-sans text-xs font-medium px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors',
          icon: 'mt-0.5',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
