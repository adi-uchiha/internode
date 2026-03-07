"use client";

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

export const CTASection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(140 100% 50% / 0.15) 0%, transparent 60%)',
        }}
      />
      
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            System Ready
          </span>
          
          <h2 className="font-display text-4xl md:text-6xl font-light text-foreground mb-6 leading-tight">
            Ready to engineer
            <br />
            <span className="text-primary italic">better internships?</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join engineering teams that have transformed their intern programs with real-time visibility and data-driven mentorship.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" className="group">
              <Icon icon="solar:play-bold" className="w-4 h-4" />
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
        </motion.div>
      </div>
    </section>
  );
};
