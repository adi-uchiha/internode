'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { HUDFeature } from './features/HUDFeature';
import { LoggingFeature } from './features/LoggingFeature';
import { AnalyticsFeature } from './features/AnalyticsFeature';
import { FeedbackFeature } from './features/FeedbackFeature';
import { SkillsFeature } from './features/SkillsFeature';
import { ReportsFeature } from './features/ReportsFeature';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-32 overflow-hidden">
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
            [FEATURE_SET]
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
            Built for <span className="text-primary">engineering</span> velocity
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A developer-first approach to intern management. Real-time data, actionable insights,
            zero overhead.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Large card - HUD */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
            <HUDFeature />
          </motion.div>

          {/* Tall card - Daily Logging */}
          <motion.div variants={itemVariants} className="md:row-span-2">
            <LoggingFeature />
          </motion.div>

          {/* Regular card - Analytics */}
          <motion.div variants={itemVariants}>
            <AnalyticsFeature />
          </motion.div>

          {/* Regular card - Feedback */}
          <motion.div variants={itemVariants}>
            <FeedbackFeature />
          </motion.div>

          {/* Wide card - Skills */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <SkillsFeature />
          </motion.div>

          {/* Regular card - Reports */}
          <motion.div variants={itemVariants}>
            <ReportsFeature />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
