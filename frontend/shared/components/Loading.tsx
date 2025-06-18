import { motion } from 'framer-motion';

export function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <motion.div
        className="relative w-16 h-16"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <motion.div
          className="absolute inset-0 border-4 border-primary rounded-full"
          initial={{ clipPath: 'inset(50% 0 0 0)' }}
          animate={{ clipPath: 'inset(0 0 0 0)' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  );
}
