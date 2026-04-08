'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'motion/react';

const SWIPE_THRESHOLD = 100;
const EXIT_X = 600;

/** Spring configs */
const SPRING_OUT = { type: 'spring' as const, stiffness: 600, damping: 35 };
const SPRING_BACK = { type: 'spring' as const, stiffness: 300, damping: 25 };

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface SwipeCardProps {
  /** Called AFTER the card has fully animated off screen */
  onSwipe: (direction: 'left' | 'right') => void;
  children: React.ReactNode;
  /** Initial x position – used for undo fly-back from off-screen */
  initialX?: number;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  function SwipeCard({ onSwipe, children, initialX = 0 }, ref) {
    const x = useMotionValue(initialX);
    const swipedRef = useRef(false);

    const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
    const forgotOpacity = useTransform(x, [-150, -50, 0], [1, 0.4, 0]);
    const rememberedOpacity = useTransform(x, [0, 50, 150], [0, 0.4, 1]);

    const animateOut = (direction: 'left' | 'right') => {
      if (swipedRef.current) return;
      swipedRef.current = true;

      const targetX = direction === 'left' ? -EXIT_X : EXIT_X;
      animate(x, targetX, SPRING_OUT).then(() => {
        onSwipe(direction);
      });
    };

    const handleDragEnd = (_: unknown, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD) {
        animateOut('left');
      } else if (info.offset.x > SWIPE_THRESHOLD) {
        animateOut('right');
      } else {
        // Snap back to center with spring
        animate(x, 0, SPRING_BACK);
      }
    };

    useImperativeHandle(ref, () => ({
      swipeLeft: () => animateOut('left'),
      swipeRight: () => animateOut('right'),
    }));

    // If initialX !== 0 (undo fly-back), animate to center on mount
    React.useEffect(() => {
      if (initialX !== 0) {
        animate(x, 0, SPRING_OUT);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <motion.div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ x, rotate, zIndex: 1 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
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
