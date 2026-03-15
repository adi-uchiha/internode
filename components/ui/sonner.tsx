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
          '--border-radius': '0px',
          '--success-bg': 'hsl(var(--background))',
          '--success-text': 'hsl(var(--primary))',
          '--success-border': 'hsl(var(--primary) / 0.5)',
          '--error-bg': 'hsl(var(--destructive) / 0.1)',
          '--error-text': 'hsl(var(--destructive))',
          '--error-border': 'hsl(var(--destructive) / 0.5)',
          '--warning-bg': 'hsl(var(--background))',
          '--warning-text': 'hsl(45 100% 50%)',
          '--warning-border': 'hsl(45 100% 50% / 0.5)',
          '--info-bg': 'hsl(var(--background))',
          '--info-text': 'hsl(210 100% 50%)',
          '--info-border': 'hsl(210 100% 50% / 0.5)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'cn-toast font-mono rounded-none border shadow-none bg-[var(--normal-bg)] text-[var(--normal-text)] border-[var(--normal-border)] relative overflow-hidden before:absolute before:inset-0 before:pointer-events-none before:border-[0.5px] before:border-white/10 after:absolute after:inset-0 after:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] after:bg-[length:250%_250%,100%_100%] after:animate-[toast-shine_3s_ease-in-out_infinite]',
          success:
            '!bg-[var(--success-bg)] !text-[var(--success-text)] !border-[var(--success-border)] shadow-[0_0_15px_var(--success-border)]',
          error:
            '!bg-[var(--error-bg)] !text-[var(--error-text)] !border-[var(--error-border)] shadow-[0_0_15px_var(--error-border)]',
          warning:
            '!bg-[var(--warning-bg)] !text-[var(--warning-text)] !border-[var(--warning-border)] shadow-[0_0_15px_var(--warning-border)]',
          info: '!bg-[var(--info-bg)] !text-[var(--info-text)] !border-[var(--info-border)] shadow-[0_0_15px_var(--info-border)]',
          title: 'text-sm font-bold tracking-tight font-display text-foreground',
          description: 'text-[10px] uppercase opacity-70 font-mono tracking-widest mt-1',
          actionButton:
            'bg-primary text-primary-foreground font-mono uppercase text-[10px] tracking-wider rounded-none hover:bg-primary/80 transition-colors',
          cancelButton:
            'bg-muted text-muted-foreground font-mono uppercase text-[10px] tracking-wider rounded-none hover:bg-muted/80 transition-colors',
          icon: 'mt-0.5',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
