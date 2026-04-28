import React from 'react';
import { motion } from 'framer-motion';

interface OtpSuccessAnimationProps {
  title: string;
  subtitle: string;
  onComplete?: () => void;
}

/**
 * Telegram-style animated success screen shown after OTP verification.
 * Uses a combination of scale, draw, and confetti-like particle animations.
 */
export const OtpSuccessAnimation: React.FC<OtpSuccessAnimationProps> = ({
  title,
  subtitle,
  onComplete,
}) => {
  // Auto-redirect after animation
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 2800);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  // Confetti particle configs
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    delay: i * 0.04,
    color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#8b5cf6' : '#a78bfa',
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-6 py-8"
    >
      {/* Animated circle + checkmark */}
      <div className="relative w-24 h-24">
        {/* Expanding circle pulse */}
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className="absolute inset-0 rounded-full bg-accent-primary/20"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          className="absolute inset-0 rounded-full bg-accent-primary/15"
        />

        {/* Main circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-primary to-accent shadow-xl shadow-accent/30 flex items-center justify-center"
        >
          {/* SVG Checkmark with draw animation */}
          <svg
            viewBox="0 0 52 52"
            className="w-12 h-12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M14 27L22 35L38 19"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </svg>
        </motion.div>

        {/* Particle burst */}
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = Math.cos(rad) * 60;
          const y = Math.sin(rad) * 60;
          return (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x, y, scale: 0, opacity: 0 }}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: 0.4 + p.delay,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center space-y-2"
      >
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <p className="text-text-muted text-sm">{subtitle}</p>
      </motion.div>

      {/* Redirecting indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex items-center gap-2 text-xs text-text-muted"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-3 h-3 border-2 border-accent-primary/30 border-t-accent-primary rounded-full"
        />
        Redirecting...
      </motion.div>
    </motion.div>
  );
};
