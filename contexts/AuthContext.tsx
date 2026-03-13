'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Session } from '@/lib/auth-types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: sessionData, isPending: isLoading, error } = authClient.useSession();

  const user = sessionData?.user as User | null;

  useEffect(() => {
    const isAuthRoute = ['/login', '/register'].includes(pathname);
    const isPublicPath =
      pathname === '/' ||
      pathname === '/login' ||
      pathname === '/register' ||
      pathname.startsWith('/accept-invite');

    if (!isLoading) {
      if (!sessionData && !isPublicPath) {
        router.push('/login');
      } else if (sessionData && isAuthRoute) {
        if (user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/tasks/dashboard');
        }
      }
    }

    if (error) {
      console.error('Session error:', error);
      if (!isPublicPath) {
        router.push('/login');
      }
    }
  }, [sessionData, isLoading, error, pathname, router, user?.role]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data: signInData, error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError || !signInData) {
      return false;
    }

    const { data: freshSession } = await authClient.getSession();
    const loggedInUser = freshSession?.user as User | null;

    if (loggedInUser?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/tasks/dashboard');
    }

    router.refresh();
    return true;
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    const { data: signUpData, error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: email.split('@')[0],
    });

    if (signUpError || !signUpData) {
      console.error('Signup failed:', signUpError);
      return false;
    }

    router.push('/tasks/dashboard');
    router.refresh();
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
        session: sessionData as Session | null,
        user,
        isLoading,
        login,
        signup,
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
