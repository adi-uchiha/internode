'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Session } from '@/lib/auth-types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  orgRole: 'owner' | 'admin' | 'member';
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
        // Not logged in and trying to access a protected route
        router.push('/login');
      } else if (sessionData && isAuthRoute) {
        // Logged in but on the login/register page
        router.push('/tasks/dashboard');
      } else if (
        sessionData &&
        !sessionData.session.activeOrganizationId &&
        !isPublicPath &&
        pathname !== '/tasks/onboarding'
      ) {
        // Logged in, not on a public path, not on onboarding, but has no active organization
        router.push('/tasks/onboarding');
      } else if (
        sessionData &&
        sessionData.session.activeOrganizationId &&
        pathname === '/tasks/onboarding'
      ) {
        // Logged in, has an active organization, but is on the onboarding page
        router.push('/tasks/dashboard');
      }
    }

    if (error) {
      console.error('Session error:', error);
      if (!isPublicPath) {
        router.push('/login');
      }
    }
  }, [sessionData, isLoading, error, pathname, router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data: signInData, error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError || !signInData) {
      return false;
    }

    const { data: freshSession } = await authClient.getSession();
    void freshSession;

    router.push('/tasks/dashboard');

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

  const { data: member } = authClient.useActiveMember();
  const orgRole = (member?.role as 'owner' | 'admin' | 'member') || 'member';

  return (
    <AuthContext.Provider
      value={{
        session: sessionData as Session | null,
        user,
        orgRole,
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
