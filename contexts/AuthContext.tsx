'use client';

import { createContext, useContext, ReactNode } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/auth-types';

type UserRole = 'admin' | 'member';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { data: sessionData, isPending: isLoading } = authClient.useSession();

  const user = sessionData?.user as User | null;

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error || !data) {
      return false;
    }

    router.refresh(); // Refresh Next.js cache to re-run layout/middleware conditionally
    return true;
  };

  const logout = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
