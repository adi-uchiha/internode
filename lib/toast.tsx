import { toast as sonnerToast } from 'sonner';
import { Icon } from '@iconify/react';
import React from 'react';

/**
 * Enhanced Toast Utility for Internode
 * Provides a standardized, engineering-grade notification API.
 */

type ToastOptions = {
  description?: string;
  duration?: number;
  id?: string | number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const createToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' | 'loading' = 'success',
  options?: ToastOptions
) => {
  const method = type === 'loading' ? 'loading' : type;

  return sonnerToast[method](message, {
    description: options?.description,
    duration: options?.duration,
    id: options?.id,
    action: options?.action,
  });
};

export const toast = {
  success: (message: string, options?: ToastOptions) => createToast(message, 'success', options),

  error: (message: string, options?: ToastOptions) => createToast(message, 'error', options),

  info: (message: string, options?: ToastOptions) => createToast(message, 'info', options),

  warning: (message: string, options?: ToastOptions) => createToast(message, 'warning', options),

  loading: (message: string, options?: ToastOptions) => createToast(message, 'loading', options),

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Matrix/Engineering specific variant (uses success colors but custom icon)
  matrix: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: React.createElement(Icon, {
        icon: 'ph:terminal-window-duotone',
        className: 'size-5 text-primary',
      }),
    });
  },

  // System/Industrial variant
  system: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      ...options,
      icon: React.createElement(Icon, {
        icon: 'ph:cpu-duotone',
        className: 'size-5 text-muted-foreground',
      }),
    });
  },

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
