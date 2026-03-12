'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import Image from 'next/image';

type LoginMode = 'admin' | 'member';

const Login = () => {
  const [mode, setMode] = useState<LoginMode>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);

    if (!success) {
      setError('Invalid credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-black to-slate-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent" />

        {/* Floating elements */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 border-2 border-primary flex items-center justify-center">
                <div className="w-4 h-4 bg-primary" />
              </div>
              <span className="font-display font-bold text-2xl">INTERNODE</span>
            </div>

            <h1 className="text-5xl font-display font-bold mb-6 leading-tight">
              Engineering
              <br />
              <span className="text-primary text-glow">Management</span>
              <br />
              Reimagined.
            </h1>

            <p className="text-muted-foreground text-lg max-w-md mb-8">
              A real-time HUD for tracking intern progress, providing mentorship, and building
              engineering excellence.
            </p>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="border border-border p-4 bg-card/50">
                <div className="font-mono text-3xl text-primary mb-1">98%</div>
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  [LOG RATE]
                </div>
              </div>
              <div className="border border-border p-4 bg-card/50">
                <div className="font-mono text-3xl text-primary mb-1">2.4h</div>
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  [AVG RESOLVE]
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative lines */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-1/4 right-0 w-px h-1/2 bg-linear-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-8 h-8 border-2 border-primary flex items-center justify-center">
              <div className="w-3 h-3 bg-primary" />
            </div>
            <span className="font-display font-bold text-xl">INTERNODE</span>
          </div>

          {/* Mode Tabs */}
          <div className="flex mb-8 border border-border">
            <button
              onClick={() => setMode('member')}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-all ${
                mode === 'member'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="solar:user-linear" className="inline-block mr-2 w-4 h-4" />
              Member
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`flex-1 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-all border-l border-border ${
                mode === 'admin'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="solar:shield-user-linear" className="inline-block mr-2 w-4 h-4" />
              Admin
            </button>
          </div>

          <div className="border border-border bg-card p-8">
            <div className="mb-6">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
                [{mode === 'admin' ? 'ADMIN ACCESS' : 'MEMBER LOGIN'}]
              </div>
              <h2 className="text-2xl font-display font-semibold">
                {mode === 'admin' ? 'Admin Dashboard' : 'Developer Portal'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.dev"
                  className="bg-background border-border font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-border font-mono"
                  required
                />
              </div>

              {error && (
                <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono">
                  <Icon icon="solar:danger-triangle-linear" className="inline-block mr-2 w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Initialize Session
                    <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  await authClient.signIn.social({
                    provider: 'github',
                    callbackURL: '/dashboard',
                  });
                }}
              >
                <Image
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg"
                  className="w-5 h-5 invert dark:invert-0"
                  alt="GitHub"
                  width={20}
                  height={20}
                />
                Sign in with GitHub
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" className="inline-block mr-2 w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
