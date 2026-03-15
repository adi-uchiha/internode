'use client';

import { Suspense } from 'react';
import Login from '@/components/screens/Login';
import { Spinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner message="INITIALIZING_AUTH..." />
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
