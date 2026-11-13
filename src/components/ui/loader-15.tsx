import { motion } from 'motion/react';

interface LoaderProps {
  size?: number;
  className?: string;
}

const DOT_COLORS = ['#22d3ee', '#e879f9', '#f472b6'];

export default function Loader({ size = 44, className = '' }: LoaderProps) {
  const dotSize = size * 0.22;
  const radius = size * 0.28;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
      >
        {DOT_COLORS.map((color, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 0.18}px ${color}`,
              left: `calc(50% - ${dotSize / 2}px)`,
              top: `calc(50% - ${dotSize / 2}px)`,
              transformOrigin: `${dotSize / 2}px ${radius}px`,
            }}
            animate={{
              y: [0, -radius * 0.55, 0],
              scale: [1, 0.55, 1],
              opacity: [1, 0.65, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: 'easeInOut',
              delay: i * 0.18,
            }}
          />
        ))}
      </motion.div>
      <motion.span
        className="absolute rounded-full bg-white"
        style={{
          width: size * 0.14,
          height: size * 0.14,
          boxShadow: `0 0 ${size * 0.22}px rgba(255,255,255,0.9)`,
        }}
        animate={{ scale: [1, 0.6, 1], opacity: [0.95, 0.5, 0.95] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      />
    </div>
  );
}
