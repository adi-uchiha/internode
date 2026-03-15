'use client';

import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';
import { Icon } from '@iconify/react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
        hero: 'bg-primary text-primary-foreground font-mono uppercase tracking-widest hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] border border-primary/50 transition-all duration-300',
        'hero-outline':
          'bg-transparent text-primary border border-primary/50 font-mono uppercase tracking-widest hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300',
      },
      size: {
        default:
          'h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        xs: "h-6 gap-1 rounded-sm px-2 text-[10px] font-mono uppercase tracking-tight has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 rounded-sm px-3 text-[11px] font-mono uppercase tracking-widest has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-2 px-6 text-sm font-mono uppercase tracking-[0.2em] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        xl: 'h-12 gap-3 px-8 text-base font-mono uppercase tracking-[0.3em] has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7',
        icon: 'size-8',
        'icon-xs': "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = ButtonPrimitive.Props & {
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'destructive'
    | 'link'
    | 'hero'
    | 'hero-outline';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'xl' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  loading?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', loading, children, disabled, ...props },
    ref
  ) => {
    return (
      <ButtonPrimitive
        ref={ref}
        disabled={loading || disabled}
        className={cn(buttonVariants({ variant, size, className }), 'relative')}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon="lucide:loader-2" className="animate-spin size-4" />
          </div>
        )}
        <span className={cn('flex items-center justify-center gap-2', loading && 'invisible')}>
          {children}
        </span>
      </ButtonPrimitive>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants, type ButtonProps };
