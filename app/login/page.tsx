import type { Metadata } from 'next';
import { Suspense } from 'react';
import Login from '@/components/screens/Login';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

export const metadata: Metadata = {
  title: 'Login | Internode',
  description:
    'Authenticate to access your Internode organization and manage your engineering velocity.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <UnifiedLoader message="INITIALIZING_AUTH..." />
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
