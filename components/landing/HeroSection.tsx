'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { OrbitalDiagram } from './OrbitalDiagram';
import { MatrixRain } from './MatrixRain';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-16 overflow-hidden">
      {/* Matrix rain effect */}
      <MatrixRain />
      {/* Background effects */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div
        className="absolute top-0 right-0 w-[800px] h-[800px] opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(140 100% 50% / 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-[40%] left-0 right-0 h-px bg-linear-to-r from-transparent via-border/50 to-transparent" />
        <div className="absolute top-[60%] left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-[80%] left-0 right-0 h-px bg-linear-to-r from-transparent via-border/50 to-transparent" />
      </div>

      <div className="container mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center min-h-[70vh]">
          {/* Left content */}
          <div className="relative z-10">
            {/* Status tag */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <div className="status-dot" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                System Operational
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-6"
            >
              <span className="text-primary italic">Engineer</span>
              <span className="text-primary italic"> your</span>
              <br />
              <span className="text-primary italic">interns&apos;</span>
              <br />
              <span className="text-foreground font-medium">growth trajectory.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-muted-foreground text-lg md:text-xl max-w-lg mb-10 leading-relaxed"
            >
              Real-time visibility into your engineering interns. Transform internships from
              black-box experiences into transparent, growth-oriented journeys.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap gap-4"
            >
              <Button variant="hero" size="lg" className="group">
                <Icon icon="solar:play-bold" className="w-4 h-4" />
                <span>Initialize</span>
              </Button>
              <Button variant="hero-outline" size="lg" className="group">
                <span>View Ecosystem</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>
            </motion.div>

            {/* Metrics bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-16 pt-8 border-t border-border"
            >
              <div className="flex items-center gap-8 font-mono text-xs text-muted-foreground">
                <span>01</span>
                <div className="flex-1 h-px bg-border" />
                <span>02</span>
                <div className="flex-1 h-px bg-border" />
                <span>03</span>
                <div className="flex-1 h-px bg-border" />
                <span>04</span>
                <div className="flex-1 h-px bg-border" />
                <span>05</span>
              </div>
            </motion.div>
          </div>

          {/* Right content - Orbital Diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <OrbitalDiagram />
          </motion.div>
        </div>
      </div>

      {/* Bottom trust bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <Icon icon="cib:y-combinator" className="w-5 h-5 text-[#ff6600]" />
                  <span className="font-mono text-[10px] font-bold tracking-tighter">
                    COMBINATOR
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <Icon icon="simple-icons:a16z" className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <Icon icon="cib:vercel" className="w-5 h-5 text-foreground" />
                  <span className="font-display text-[10px] font-bold tracking-widest">VERCEL</span>
                </div>
                <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <Icon icon="cib:stripe" className="w-8 h-8 text-[#635bff]" />
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="opacity-50">[</span>
              <span>v</span>
              <span className="opacity-50">]</span>
              <span className="uppercase tracking-wider">Trusted by industry leaders</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
