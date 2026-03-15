import { create } from 'zustand';

/**
 * UI Store for volatile state (Presence, Branding, Theme).
 * Following the Enterprise Cache Synergy Blueprint (Section 4.2).
 */

interface PresenceInfo {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
  activePath?: string;
}

interface UIState {
  // Presence
  presence: Record<string, PresenceInfo>;
  setPresence: (userId: string, info: Partial<PresenceInfo>) => void;

  // Organization Branding
  brandingColor: string;
  setBrandingColor: (color: string) => void;

  // Theme Overrides
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  presence: {},
  setPresence: (userId: string, info: Partial<PresenceInfo>) =>
    set((state) => {
      const current = state.presence[userId] || {
        userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      return {
        presence: {
          ...state.presence,
          [userId]: { ...current, ...info },
        },
      };
    }),

  brandingColor: '#0066FF', // Default Internode Blue
  setBrandingColor: (color) => {
    set({ brandingColor: color });
    // Ripple through CSS Variables (Section 3.7)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary', color);
    }
  },

  themeMode: 'system',
  setThemeMode: (mode) => set({ themeMode: mode }),
}));
