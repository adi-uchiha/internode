import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

export const MatrixRain = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create columns of falling characters
  const columns = useMemo(() => {
    if (!mounted) return [];

    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: (i / 20) * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 10,
      // Generate characters only for this column
      chars: Array.from({ length: 20 }, () =>
        String.fromCharCode(0x30A0 + Math.random() * 96)
      )
    }));
  }, [mounted]);

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]" />;

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
