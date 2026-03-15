'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import { AUTH_FLAGS } from '@/lib/feature-flags';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type FormMode = 'login' | 'signup';

const Login = () => {
  const [formMode, setFormMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const { login, signup } = useAuth();
  const redirectTo = redirect ? decodeURIComponent(redirect) : undefined;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password, redirectTo);

    if (!success) {
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await signup(email, password, name, redirectTo);

    if (!success) {
      setError('Signup failed. Please try again or use a different email.');
      setIsLoading(false);
    }
  };

  const handleSubmit = formMode === 'login' ? handleLogin : handleSignup;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-black to-slate-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent" />

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

          {/* Header */}
          <div className="mb-8">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              [SYSTEM ACCESS]
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight">Developer Portal</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Authenticate to access your organization.
            </p>
          </div>

          <div className="border border-border bg-card p-8 space-y-6">
            {/* GitHub OAuth - always primary for members */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-3 font-mono text-sm"
              disabled={isGithubLoading}
              onClick={async () => {
                setIsGithubLoading(true);
                try {
                  await authClient.signIn.social({
                    provider: 'github',
                    callbackURL: redirectTo || '/tasks/dashboard',
                  });
                } catch (err) {
                  console.error('GitHub sign-in error:', err);
                  setIsGithubLoading(false);
                }
              }}
            >
              {isGithubLoading ? (
                <UnifiedLoader size="sm" className="text-white" />
              ) : (
                <Image
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg"
                  className="w-5 h-5 invert dark:invert-0"
                  alt="GitHub"
                  width={20}
                  height={20}
                  unoptimized
                />
              )}
              {isGithubLoading ? 'Connecting...' : 'Continue with GitHub'}
            </Button>

            {/* Email/Password — controlled by feature flag */}
            {AUTH_FLAGS.ENABLE_EMAIL_SIGNUP && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={formMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {formMode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="bg-background border-border font-mono mb-4"
                          required
                          autoComplete="name"
                        />
                      </motion.div>
                    )}

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
                        autoComplete="email"
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
                        autoComplete={formMode === 'login' ? 'current-password' : 'new-password'}
                      />
                    </div>

                    {error && (
                      <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono">
                        <Icon
                          icon="solar:danger-triangle-linear"
                          className="inline-block mr-2 w-4 h-4"
                        />
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
                          <UnifiedLoader size="sm" className="text-white" />
                          <span className="ml-2">
                            {formMode === 'login' ? 'Authenticating...' : 'Creating Account...'}
                          </span>
                        </>
                      ) : (
                        <>
                          {formMode === 'login' ? 'Log In' : 'Create Account'}
                          <Icon
                            icon={
                              formMode === 'login'
                                ? 'solar:login-2-linear'
                                : 'solar:user-plus-linear'
                            }
                            className="w-4 h-4"
                          />
                        </>
                      )}
                    </Button>
                  </motion.form>
                </AnimatePresence>

                {/* Toggle between login and signup */}
                <p className="text-center font-mono text-xs text-muted-foreground">
                  {formMode === 'login' ? (
                    <>
                      No account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('signup');
                          setError('');
                        }}
                        className="text-primary hover:underline font-bold"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('login');
                          setError('');
                        }}
                        className="text-primary hover:underline font-bold"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </>
            )}
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
