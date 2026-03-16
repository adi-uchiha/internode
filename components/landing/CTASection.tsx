import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { FadeIn } from './Animations';

export const CTASection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(140 100% 50% / 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="container mx-auto px-6">
        <FadeIn direction="up" className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            System Ready
          </span>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8 leading-tight">
            Ready to architect
            <br />
            <span className="text-primary italic">engineering excellence?</span>
          </h2>

          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Join engineering teams that have transformed their delivery cycles with real-time
            velocity tracking and automated insights.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" className="group h-14 px-10 text-lg">
              <span>Initialize Internode</span>
            </Button>
            <Button variant="hero-outline" size="lg" className="group">
              <span>Schedule Demo</span>
              <Icon
                icon="solar:arrow-right-linear"
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
