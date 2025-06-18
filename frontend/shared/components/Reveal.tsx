import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
interface Props {
  children: JSX.Element;
  width?: 'full' | '100%';
}

export const Reveal = ({ children, width = 'full' }: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start('visible');
    }
  }, [isInView, mainControls]);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <motion.div
        variants={{
          hidden: {
            x: '-100%',
            opacity: 0,
          },
          visible: {
            x: 0,
            opacity: 1,
          },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: 0.25 }}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
