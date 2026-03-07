'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'admin' | 'member';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const DEMO_USERS: Record<string, User & { password: string }> = {
  'admin@internode.dev': {
    id: 'admin-001',
    email: 'admin@internode.dev',
    name: 'Aditya Kumar',
    role: 'admin',
    password: 'admin123',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AK&backgroundColor=00ff00&textColor=000000'
  },
  'member@internode.dev': {
    id: 'member-001',
    email: 'member@internode.dev',
    name: 'Alex Chen',
    role: 'member',
    password: 'member123',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AC&backgroundColor=00ff00&textColor=000000'
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = sessionStorage.getItem('internode_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('internode_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const demoUser = DEMO_USERS[email];

    if (demoUser && demoUser.password === password && demoUser.role === role) {
      const { password: _, ...userWithoutPassword } = demoUser;
      setUser(userWithoutPassword);
      sessionStorage.setItem('internode_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('internode_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
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
