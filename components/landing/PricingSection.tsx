'use client';

import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { FadeIn, StaggerContainer, StaggerItem } from './Animations';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { useIsMounted } from '@/hooks/use-mounted';

const plans = [
  {
    name: 'Starter Free',
    tagline: 'For solo developers & tiny teams',
    price: 'Free',
    period: '',
    features: [
      'Up to 5 active interns',
      'Up to 3 active projects',
      '1 active organization',
      'Daily time logging',
      'Basic analytics & board views',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro Growth',
    tagline: 'For scaling engineering teams',
    price: '$29',
    period: '/month',
    features: [
      'Up to 20 active interns',
      'Unlimited active projects',
      'Up to 3 active organizations',
      'Advanced organizational velocity analytics',
      'AI weekly work summaries',
      'Priority email support',
    ],
    cta: 'Get Pro',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For large agencies & software houses',
    price: '$99',
    period: '/month',
    features: [
      'Unlimited active interns',
      'Unlimited active projects',
      'Unlimited organizations',
      'Custom MCP server integrations',
      'Dedicated support channels',
      'SLA & compliance guarantees',
    ],
    cta: 'Get Enterprise',
    featured: false,
  },
];

export const PricingSection = () => {
  const isMounted = useIsMounted();
  const { data: session } = authClient.useSession();

  const getHref = (planName: string) => {
    if (!isMounted || !session) return '/login';
    if (planName === 'Starter Free') return '/tasks/dashboard';
    return '/tasks/settings#billing';
  };

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <FadeIn direction="up" className="text-center mb-20">
          <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-4 px-3 py-1 border border-primary/30 bg-primary/5">
            [PRICING]
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
            Simple, <span className="text-primary">transparent</span> pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free, scale as you grow
          </p>
        </FadeIn>

        {/* Pricing cards */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <StaggerItem
              key={plan.name}
              className={`
                relative p-6 border bg-card
                ${
                  plan.featured
                    ? 'border-primary/50 shadow-[0_0_40px_hsl(var(--primary)/0.1)]'
                    : 'border-border hover:border-border-glow/30'
                }
                transition-colors duration-300
              `}
            >
              {plan.featured && (
                <div className="absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-medium text-foreground">{plan.name}</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-light text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="font-mono text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <Link href={getHref(plan.name)} className="block mb-6">
                <Button variant={plan.featured ? 'hero' : 'hero-outline'} className="w-full">
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-4 h-4 text-primary shrink-0"
                    />
                    <span className="font-mono text-xs text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};
