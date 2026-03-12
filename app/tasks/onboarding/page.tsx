'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-lg border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Top Energy Bar */}
          <div className="h-1 w-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: 'circOut' }}
            />
          </div>

          <div className="p-10">
            {step === 1 && (
              <div className="text-center space-y-8">
                <div className="relative inline-block">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 mx-auto border-2 border-primary bg-primary/5 rounded-full flex items-center justify-center relative z-10 p-1 overflow-hidden"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={96}
                        height={96}
                        className="w-full h-full rounded-full object-cover transition-all duration-500"
                      />
                    ) : (
                      <Icon icon="solar:user-bold-duotone" className="w-12 h-12 text-primary" />
                    )}
                  </motion.div>
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse -z-10" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
                    Protocol Initiated
                  </h1>
                  <p className="text-muted-foreground font-mono text-sm opacity-60">
                    Welcome to the <span className="text-primary font-bold">INTERNODE</span>{' '}
                    ecosystem, <span className="text-foreground">{user?.name || 'Architect'}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                    Access Level: {user?.role === 'admin' ? 'ARCHITECT' : 'DEVELOPER'}
                  </span>
                </div>

                <div className="pt-6">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full h-14 text-sm font-bold tracking-widest uppercase shadow-xl shadow-primary/20"
                    onClick={() => setStep(2)}
                  >
                    Establish Connection
                    <Icon icon="solar:round-alt-arrow-right-linear" className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Signal Configuration
                  </h2>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                    Neural Notification Gateway
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: 'SMTP: Ticket Assignment Alerts',
                      desc: 'Critical state changes via email',
                      default: true,
                    },
                    {
                      label: 'SMTP: Threshold Breech Warning',
                      desc: 'Overdue warnings and burn rate alerts',
                      default: true,
                    },
                    {
                      label: 'HUD: Push Notifications',
                      desc: 'Real-time interface updates',
                      default: false,
                    },
                  ].map((toggle, i) => (
                    <motion.div
                      key={toggle.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-5 border border-border bg-muted/5 group hover:bg-muted/10 transition-all cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-bold tracking-tight">{toggle.label}</span>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-50">
                          {toggle.desc}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300',
                          toggle.default ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full transition-transform duration-300',
                            toggle.default
                              ? 'bg-black translate-x-6'
                              : 'bg-muted-foreground translate-x-0'
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    variant="ghost"
                    className="flex-1 h-12 font-mono text-xs uppercase"
                    onClick={() => setStep(1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-2 h-12 font-mono text-xs uppercase"
                    onClick={() => setStep(3)}
                  >
                    Commit Config
                    <Icon icon="solar:check-circle-linear" className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-primary">
                    System Briefing
                  </h2>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                    Operational Core Overview
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: 'solar:chart-2-linear',
                      title: 'Predictive Dashboard',
                      desc: 'Real-time KPIs, velocity analysis, and system health status.',
                      color: 'text-blue-500',
                    },
                    {
                      icon: 'solar:widget-4-linear',
                      title: 'Execution Kanban',
                      desc: 'Low-latency ticket management with fluid drag & drop protocols.',
                      color: 'text-amber-500',
                    },
                    {
                      icon: 'solar:graph-up-linear',
                      title: 'Neural Analytics',
                      desc: 'Deep-dive resource diagnostics and performance profiling.',
                      color: 'text-primary',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-5 p-5 border border-border bg-muted/5 group hover:bg-muted/10 transition-all"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 border border-border flex items-center justify-center shrink-0 transition-colors',
                          'group-hover:border-primary/50'
                        )}
                      >
                        <Icon icon={item.icon} className={cn('w-6 h-6', item.color)} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-sm uppercase tracking-wide">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed opacity-70">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-6">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full h-14 text-sm font-bold tracking-[0.2em] uppercase shadow-2xl shadow-primary/20"
                    onClick={() => router.push('/tasks/dashboard')}
                  >
                    Initialize Core
                    <Icon icon="solar:power-linear" className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
