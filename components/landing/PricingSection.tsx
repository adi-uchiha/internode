'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Starter',
    tagline: 'For small teams',
    price: 'Free',
    period: '',
    features: ['Up to 5 interns', 'Daily logging', 'Basic analytics', 'Email support'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Growth',
    tagline: 'For scaling teams',
    price: '$29',
    period: '/month',
    features: [
      'Up to 25 interns',
      'Advanced analytics',
      'AI weekly summaries',
      'Slack integration',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For large orgs',
    price: '$149',
    period: '/month',
    features: [
      'Unlimited interns',
      'Custom integrations',
      'SSO & SAML',
      'Dedicated account manager',
      'SLA guarantees',
      'On-prem option',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-4 px-3 py-1 border border-primary/30 bg-primary/5">
            [PRICING]
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
            Simple, <span className="text-primary">transparent</span> pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free, scale as you grow
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
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
                <span className="text-3xl font-bold text-gradient-primary bg-linear-to-r from-primary to-primary-muted">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="font-mono text-sm text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                )}
              </div>

              <Button variant={plan.featured ? 'hero' : 'hero-outline'} className="w-full mb-6">
                {plan.cta}
              </Button>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-5 h-5 text-primary shrink-0"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
