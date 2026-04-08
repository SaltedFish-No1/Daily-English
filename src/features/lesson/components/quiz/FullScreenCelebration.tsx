'use client';

/**
 * @author SaltedFish-No1
 * @description 满分庆祝动画，使用 canvas-confetti 渲染礼花效果。
 */

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const colors = [
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#f43f5e',
  '#facc15',
];

export const FullScreenCelebration: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const instance = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const fireRibbons = () => {
      instance({
        particleCount: prefersReducedMotion ? 10 : 18,
        spread: 62,
        startVelocity: 30,
        gravity: 0.8,
        ticks: 260,
        scalar: 1.15,
        colors,
        origin: { x: 0, y: 0.55 },
      });
      instance({
        particleCount: prefersReducedMotion ? 10 : 18,
        spread: 62,
        startVelocity: 30,
        gravity: 0.8,
        ticks: 260,
        scalar: 1.15,
        colors,
        origin: { x: 1, y: 0.55 },
      });
    };

    const fireWorkBurst = () => {
      const x = 0.15 + Math.random() * 0.7;
      instance({
        particleCount: prefersReducedMotion ? 22 : 60,
        startVelocity: 55,
        spread: 75,
        gravity: 1,
        ticks: 300,
        scalar: 1.05,
        colors,
        origin: { x, y: 1 },
      });
      instance({
        particleCount: prefersReducedMotion ? 16 : 36,
        startVelocity: 22,
        spread: 120,
        gravity: 0.6,
        ticks: 260,
        scalar: 0.95,
        colors,
        origin: { x, y: 0.28 + Math.random() * 0.16 },
      });
    };

    fireRibbons();
    fireWorkBurst();

    const intervalId = window.setInterval(
      () => {
        fireRibbons();
        if (Math.random() < 0.8) fireWorkBurst();
      },
      prefersReducedMotion ? 1600 : 900
    );

    return () => {
      window.clearInterval(intervalId);
      instance.reset();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};
