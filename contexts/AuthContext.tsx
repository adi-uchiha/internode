'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { data: sessionData, isPending: isLoading, error } = authClient.useSession();

  const user = sessionData?.user as User | null;

  // Redirect if session is invalid on protected routes
  useEffect(() => {
    const isPublicRoute = ['/', '/login', '/register'].includes(pathname);
    const isAuthRoute = ['/login', '/register'].includes(pathname);

    if (!isLoading) {
      if (!sessionData && !isPublicRoute) {
        router.push('/login');
      } else if (sessionData && isAuthRoute) {
        if (user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/member');
        }
      }
    }

    if (error) {
      console.error('Session error:', error);
      // If there's a serious session error (like the 500s we saw), treat as logged out
      if (!isPublicRoute) {
        router.push('/login');
      }
    }
  }, [sessionData, isLoading, error, pathname, router, user?.role]);

  const login = async (
    email: string,
    password: string,
    requiredRole?: UserRole
  ): Promise<boolean> => {
    const { data: signInData, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error || !signInData) {
      return false;
    }

    // Check role if required
    if (requiredRole) {
      const { data: sessionData } = await authClient.getSession();
      const user = sessionData?.user as User | null;

      if (user?.role !== requiredRole) {
        // If they logged in but have the wrong role, log them out immediately
        await authClient.signOut();
        return false;
      }
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
