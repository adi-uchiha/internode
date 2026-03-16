import { HUDFeature } from './features/HUDFeature';
import { LoggingFeature } from './features/LoggingFeature';
import { AnalyticsFeature } from './features/AnalyticsFeature';
import { FeedbackFeature } from './features/FeedbackFeature';
import { SkillsFeature } from './features/SkillsFeature';
import { ReportsFeature } from './features/ReportsFeature';
import { TaskManagerFeature } from './features/TaskManagerFeature';
import { FadeIn, StaggerContainer, StaggerItem } from './Animations';

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <FadeIn direction="up" className="text-center mb-20">
          <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-4 px-3 py-1 border border-primary/30 bg-primary/5">
            [FEATURE_SET]
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
            Built for <span className="text-primary">engineering</span> velocity
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A developer-first approach to project management. Designed to strip away the legacy
            overhead and replace bloated workflows with real-time data and zero friction.
          </p>
        </FadeIn>

        {/* Bento Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large card - HUD */}
          <StaggerItem className="md:col-span-2 lg:col-span-2">
            <HUDFeature />
          </StaggerItem>

          {/* Tall card - Daily Logging */}
          <StaggerItem className="md:row-span-2">
            <LoggingFeature />
          </StaggerItem>

          {/* Regular card - Analytics */}
          <StaggerItem>
            <AnalyticsFeature />
          </StaggerItem>

          {/* Regular card - Feedback */}
          <StaggerItem>
            <FeedbackFeature />
          </StaggerItem>

          {/* Wide card - Skills */}
          <StaggerItem className="md:col-span-2">
            <SkillsFeature />
          </StaggerItem>

          {/* Regular card - Reports */}
          <StaggerItem>
            <ReportsFeature />
          </StaggerItem>

          {/* Wide card - Task Manager */}
          <StaggerItem className="md:col-span-2 lg:col-span-3">
            <TaskManagerFeature />
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
};
