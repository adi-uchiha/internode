import { Metadata } from 'next';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/landing/Animations';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';

export const metadata: Metadata = {
  title: `${NEXT_PUBLIC_APP_NAME} vs Jira | The Engineering-First Alternative`,
  description: `Why engineering teams are switching from Jira to ${NEXT_PUBLIC_APP_NAME}. Compare performance, developer experience, and real-time visibility.`,
  keywords: [
    'Jira alternative',
    'Engineering management',
    'Developer velocity',
    'Software project management',
  ],
};

const ComparisonTable = () => {
  const features = [
    {
      feature: 'Performance',
      internode: 'Sub-100ms interactions, optimized for speed.',
      jira: 'Bloated, slow-loading legacy architecture.',
    },
    {
      feature: 'Developer Experience',
      internode: 'Keyboard-first, zero-friction flow.',
      jira: 'Complex menus, forced workflows, high overhead.',
    },
    {
      feature: 'Real-time Visibility',
      internode: 'Heads-up display with live updates.',
      jira: 'Static snapshots requiring manual refresh.',
    },
    {
      feature: 'Setup Time',
      internode: 'Instant onboarding (Identity-first).',
      jira: 'Weeks of consultation and configuration.',
    },
    {
      feature: 'Focus',
      internode: 'Purely for engineering squads.',
      jira: 'Generic tool for every department.',
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-6 px-4 text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Feature
            </th>
            <th className="py-6 px-4 text-left font-display text-xl text-primary">
              {NEXT_PUBLIC_APP_NAME}
            </th>
            <th className="py-6 px-4 text-left font-display text-xl text-muted-foreground">Jira</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {features.map((item, i) => (
            <tr key={i} className="group hover:bg-white/5 transition-colors">
              <td className="py-6 px-4 font-mono text-sm">{item.feature}</td>
              <td className="py-6 px-4 text-sm text-foreground/90 font-medium">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:check-circle-bold" className="text-primary w-5 h-5 shrink-0" />
                  {item.internode}
                </div>
              </td>
              <td className="py-6 px-4 text-sm text-muted-foreground/70">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:close-circle-bold" className="w-5 h-5 shrink-0" />
                  {item.jira}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function JiraComparisonPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <FadeIn direction="up" className="text-center max-w-4xl mx-auto mb-20">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-6 px-3 py-1 border border-primary/30 bg-primary/5">
              [SYSTEM_COMPARISON_v1.0]
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-light leading-tight mb-8">
              The <span className="italic text-primary">engineering-first</span>
              <br /> alternative to Jira.
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Jira was built for the managers of 2002. {NEXT_PUBLIC_APP_NAME} is built for the
              engineers of 2026. Ditch the bloat, architect your velocity.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/login">
                <Button variant="hero" size="lg">
                  Initialize Shift
                </Button>
              </Link>
            </div>
          </FadeIn>

          {/* Comparison Grid */}
          <section className="mb-32">
            <FadeIn
              direction="up"
              delay={0.2}
              className="border border-border bg-card p-1 md:p-12 overflow-hidden relative"
            >
              <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
              <ComparisonTable />
            </FadeIn>
          </section>

          {/* Key Differences Bento */}
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
            <StaggerItem className="p-8 border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 border border-primary/30 flex items-center justify-center mb-6">
                <Icon icon="solar:bolt-bold" className="text-primary w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl mb-4">Zero Latency</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Next-gen performance with sub-100ms response times. No "loading spinners" when
                updating tickets or switching views.
              </p>
            </StaggerItem>

            <StaggerItem className="p-8 border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 border border-blue-500/30 flex items-center justify-center mb-6">
                <Icon icon="solar:eye-bold" className="text-blue-500 w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl mb-4">HUD Visibility</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                A heads-up display showing live engineering status. Know who is blocked and who is
                in flow without asking in Slack.
              </p>
            </StaggerItem>

            <StaggerItem className="p-8 border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 border border-amber-500/30 flex items-center justify-center mb-6">
                <Icon icon="solar:keyboard-bold" className="text-amber-500 w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl mb-4">Keyboard First</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Optimized for the command line mindset. Navigate the entire platform without ever
                touching your mouse.
              </p>
            </StaggerItem>
          </StaggerContainer>

          {/* Call to action */}
          <FadeIn direction="up" className="text-center py-20 border-t border-border">
            <h2 className="font-display text-4xl mb-8">Ready to architect your velocity?</h2>
            <Link href="/login">
              <Button variant="hero" size="lg">
                Get Started Free
              </Button>
            </Link>
          </FadeIn>
        </div>
      </main>

      <Footer />
    </div>
  );
}
