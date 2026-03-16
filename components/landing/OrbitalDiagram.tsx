'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const teamMembers = [
  { id: 'A', status: 'active', angle: -60, delay: 0 },
  { id: 'B', status: 'active', angle: 0, delay: 0.2 },
  { id: 'C', status: 'active', angle: 60, delay: 0.4 },
];

const logEntries = [
  { text: 'Pushed 3 commits', time: '2m ago' },
  { text: 'Completed API integration', time: '1h ago' },
  { text: 'Learning TypeScript generics', time: '3h ago' },
];

export const OrbitalDiagram = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const [beamPaths, setBeamPaths] = useState<
    Array<{ id: string; status: 'active' | 'blocked'; delay: number; d: string }>
  >([]);

  const defs = useMemo(
    () => ({
      active: { gradientId: 'pulseGradientGreen', filterId: 'glowGreen' },
      blocked: { gradientId: 'pulseGradientYellow', filterId: 'glowYellow' },
    }),
    []
  );

  useLayoutEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      const hud = hudRef.current;
      if (!container || !hud) return;

      const containerRect = container.getBoundingClientRect();
      const scale = 580 / containerRect.width;

      const hudRect = hud.getBoundingClientRect();
      const endX = (hudRect.left + hudRect.width / 2 - containerRect.left) * scale;
      const endY = (hudRect.top - containerRect.top) * scale;

      const next = teamMembers
        .map((member, index) => {
          const node = nodeRefs.current[index];
          if (!node) return null;
          const r = node.getBoundingClientRect();

          // Start exactly at the bottom-center edge of the A/B/C square blocks
          const startX = (r.left + r.width / 2 - containerRect.left) * scale;
          const startY = (r.top + r.height - containerRect.top) * scale;

          // Smooth curve into the HUD
          const midY = startY + (endY - startY) * 0.55;
          const c1X = startX;
          const c1Y = midY;
          const c2X = endX + (startX - endX) * 0.15;
          const c2Y = midY;

          return {
            id: member.id,
            status: member.status,
            delay: member.delay,
            d: `M ${startX} ${startY} C ${c1X} ${c1Y} ${c2X} ${c2Y} ${endX} ${endY}`,
          } as const;
        })
        .filter(Boolean) as Array<{
        id: string;
        status: 'active' | 'blocked';
        delay: number;
        d: string;
      }>;

      setBeamPaths(next);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (hudRef.current) ro.observe(hudRef.current);
    nodeRefs.current.forEach((n) => n && ro.observe(n));

    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[580px] aspect-square">
      {/* Subtle background glow */}
      <div
        className="absolute inset-[20%] opacity-30 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
        }}
      />

      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 580">
        <defs>
          {/* Green pulse beam */}
          <linearGradient id="pulseGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="35%" stopColor="hsl(140 100% 50% / 0.15)" />
            <stop offset="50%" stopColor="hsl(140 100% 60% / 0.9)" />
            <stop offset="65%" stopColor="hsl(140 100% 50% / 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Yellow pulse beam (blocked) */}
          <linearGradient id="pulseGradientYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="35%" stopColor="hsl(45 100% 50% / 0.15)" />
            <stop offset="50%" stopColor="hsl(45 100% 60% / 0.9)" />
            <stop offset="65%" stopColor="hsl(45 100% 50% / 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <filter id="glowGreen" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowYellow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Beams (DOM-aligned) */}
        {beamPaths.map((beam) => {
          const { gradientId, filterId } = defs[beam.status];
          return (
            <g key={beam.id}>
              {/* Base guide */}
              <motion.path
                d={beam.d}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.25 }}
                transition={{ duration: 1.1, delay: beam.delay + 0.4 }}
              />

              {/* Glow layer (thin) */}
              <motion.path
                d={beam.d}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="2.25"
                strokeLinecap="round"
                filter={`url(#${filterId})`}
                initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 0.12, 0.12, 0],
                  pathOffset: [0, 0, 0.88, 1],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{
                  duration: 3.0,
                  delay: beam.delay + 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.1,
                  ease: 'easeInOut',
                }}
              />

              {/* Core layer (thinner) */}
              <motion.path
                d={beam.d}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="1.25"
                strokeLinecap="round"
                initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 0.12, 0.12, 0],
                  pathOffset: [0, 0, 0.88, 1],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 3.0,
                  delay: beam.delay + 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.1,
                  ease: 'easeInOut',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Team member nodes at top */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 flex items-end gap-16">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: member.delay + 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Status indicator */}
            <div
              className={`w-2 h-2 rounded-full ${
                member.status === 'blocked' ? 'bg-yellow-500 animate-pulse' : 'bg-primary'
              }`}
            />

            {/* Member avatar */}
            <div
              ref={(el) => {
                nodeRefs.current[index] = el;
              }}
              className={`w-10 h-10 border ${
                member.status === 'blocked'
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-primary/50 bg-primary/10'
              } flex items-center justify-center`}
            >
              <span className="font-mono text-sm text-foreground">{member.id}</span>
            </div>

            {/* Label */}
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              {member.status === 'blocked' ? 'Blocked' : 'Active'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Center HUD - Admin View */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Outer frame */}
          <div className="absolute -inset-6 border border-border/30" />

          {/* Main container */}
          <div
            ref={hudRef}
            className="relative w-[200px] border border-border bg-card/90 backdrop-blur-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border border-foreground flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Admin HUD
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="font-mono text-[8px] text-primary">LIVE</span>
              </div>
            </div>

            {/* Activity feed */}
            <div className="p-3 space-y-2">
              {logEntries.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1 + index * 0.2 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-1 h-1 bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-foreground truncate">{entry.text}</p>
                    <p className="font-mono text-[8px] text-muted-foreground">{entry.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats footer */}
            <div className="px-3 py-2 border-t border-border bg-background/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="font-mono text-xs text-primary font-medium">12</p>
                  <p className="font-mono text-[7px] text-muted-foreground uppercase">Logs</p>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="text-center">
                  <p className="font-mono text-xs text-foreground font-medium">24h</p>
                  <p className="font-mono text-[7px] text-muted-foreground uppercase">Active</p>
                </div>
              </div>
              <Icon icon="mdi:github" className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-primary" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-primary" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />
        </motion.div>
      </div>

      {/* Side labels */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        className="absolute left-[5%] top-[40%]"
      >
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-primary/10 border border-primary/30">
            <span className="font-mono text-[9px] text-primary uppercase tracking-wider">
              Daily Logs
            </span>
          </div>
          <div className="w-4 h-px bg-primary/30" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.7 }}
        className="absolute right-[5%] top-[35%]"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-px bg-border" />
          <div className="px-2 py-1 bg-card/80 border border-border">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              Real-time
            </span>
          </div>
        </div>
      </motion.div>

      {/* Bottom metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.9 }}
        className="absolute bottom-[8%] left-1/2 -translate-x-1/2"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary" />
            <span className="font-mono text-[9px] text-muted-foreground">
              {teamMembers.filter((m) => m.status === 'active').length} Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500" />
            <span className="font-mono text-[9px] text-muted-foreground">
              {teamMembers.filter((m) => m.status === 'blocked').length} Blocked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-muted" />
            <span className="font-mono text-[9px] text-muted-foreground">0 Offline</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
