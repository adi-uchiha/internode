'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export const MatrixRain = () => {
  const [columns, setColumns] = useState<
    Array<{
      id: number;
      x: number;
      delay: number;
      duration: number;
      chars: string[];
    }>
  >([]);

  useEffect(() => {
    const newColumns = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: (i / 20) * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 10,
      chars: Array.from({ length: 20 }, () => String.fromCharCode(0x30a0 + Math.random() * 96)),
    }));
    const timer = setTimeout(() => {
      setColumns(newColumns);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute top-0 w-4 font-mono text-xs text-primary"
          style={{ left: `${col.x}%` }}
          initial={{ y: '-100%' }}
          animate={{ y: '100vh' }}
          transition={{
            duration: col.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: col.delay,
          }}
        >
          {col.chars.map((char, i) => (
            <div key={i} className="opacity-50">
              {char}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};
