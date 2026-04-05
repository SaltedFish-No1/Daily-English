'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion';

const SWIPE_THRESHOLD = 100;
const EXIT_X = 600;

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface SwipeCardProps {
  onSwipe: (direction: 'left' | 'right') => void;
  children: React.ReactNode;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  function SwipeCard({ onSwipe, children }, ref) {
    const x = useMotionValue(0);
    const swipedRef = useRef(false);

    const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
    const forgotOpacity = useTransform(x, [-150, -50, 0], [1, 0.4, 0]);
    const rememberedOpacity = useTransform(x, [0, 50, 150], [0, 0.4, 1]);

    const animateOut = (direction: 'left' | 'right') => {
      if (swipedRef.current) return;
      swipedRef.current = true;
      onSwipe(direction);
    };

    const handleDragEnd = (_: unknown, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD) {
        animateOut('left');
      } else if (info.offset.x > SWIPE_THRESHOLD) {
        animateOut('right');
      }
    };

    useImperativeHandle(ref, () => ({
      swipeLeft: () => animateOut('left'),
      swipeRight: () => animateOut('right'),
    }));

    return (
      <motion.div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        exit={{
          x: swipedRef.current
            ? x.get() < 0
              ? -EXIT_X
              : EXIT_X
            : 0,
          opacity: 0,
          transition: { duration: 0.3, ease: 'easeOut' },
        }}
      >
        {/* Overlay labels */}
        <motion.div
          className="pointer-events-none absolute top-8 right-6 z-10 rounded-lg border-3 border-red-500 px-4 py-2"
          style={{ opacity: forgotOpacity }}
        >
          <span className="text-xl font-black text-red-500">忘了</span>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute top-8 left-6 z-10 rounded-lg border-3 border-emerald-500 px-4 py-2"
          style={{ opacity: rememberedOpacity }}
        >
          <span className="text-xl font-black text-emerald-500">记住了</span>
        </motion.div>

        {children}
      </motion.div>
    );
  }
);
