import { Icon } from '@iconify/react';
import { FadeIn, StaggerContainer, StaggerItem } from './Animations';

const steps = [
  {
    number: '01',
    title: 'Teams Sync Daily',
    description: 'Quick 3-minute entries capture what they did, learned, and any blockers.',
    icon: 'solar:pen-new-square-linear',
  },
  {
    number: '02',
    title: 'Velocity Aggregates',
    description: 'Throughput, hours, and progress automatically visualized in real-time.',
    icon: 'solar:graph-new-up-linear',
  },
  {
    number: '03',
    title: 'Leads Calibrate',
    description: 'Spot blockers instantly, provide async feedback, and optimize performance.',
    icon: 'solar:chat-round-check-linear',
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <FadeIn direction="up" className="text-center mb-20">
          <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-4 px-3 py-1 border border-primary/30 bg-primary/5">
            [WORKFLOW]
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
            How <span className="text-primary">Internode</span> works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A precise three-step process that transforms engineering operations
          </p>
        </FadeIn>

        {/* Steps */}
        <StaggerContainer className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <StaggerItem key={step.number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-linear-to-r from-border to-transparent" />
              )}

              <div className="p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300 h-full">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-3xl text-primary/30">{step.number}</span>
                  <div className="w-12 h-12 flex items-center justify-center border border-primary/30 bg-primary/5">
                    <Icon icon={step.icon} className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-medium text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};
