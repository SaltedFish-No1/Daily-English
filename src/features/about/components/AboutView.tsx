'use client';

/**
 * @author SaltedFish-No1
 * @description 关于页组件文件：展示应用品牌信息、仓库元数据、作者信息与源码入口。
 *   页面包含彩蛋交互（连续点击叶子图标触发粒子动画）。
 */

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, ExternalLink, Leaf } from 'lucide-react';

/**
 * @description 关于页展示元数据结构。
 *   用于渲染「版本」「许可协议」与作者卡片信息。
 */
interface RepoMeta {
  /** 当前版本号 */
  version: string;
  /** SPDX 许可标识，缺失时展示默认值 */
  license: string;
  /** 作者头像 URL */
  ownerAvatar: string;
  /** 作者 GitHub 用户名 */
  ownerLogin: string;
  /** 作者 GitHub 主页链接 */
  ownerUrl: string;
}

/** 关于页静态展示数据 */
const FALLBACK: RepoMeta = {
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'v0.1.0',
  license: 'All Rights Reserved',
  ownerAvatar: 'https://avatars.githubusercontent.com/u/138401553',
  ownerLogin: 'SaltedFish-No1',
  ownerUrl: 'https://github.com/SaltedFish-No1',
};

/** 彩蛋粒子数量 */
const PARTICLE_COUNT = 10;
type Particle = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
};

const createParticles = (): Particle[] =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i;
    const rad = (angle * Math.PI) / 180;
    const distance = 60 + Math.random() * 40;
    return {
      id: i,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      rotate: Math.random() * 360,
      scale: 0.4 + Math.random() * 0.4,
      delay: Math.random() * 0.15,
    };
  });

/**
 * @author SaltedFish-No1
 * @description 关于页主视图组件：负责数据拉取、彩蛋交互与页面内容渲染。
 *
 * @param props 无入参（页面级组件）
 * @return 关于页面 UI
 */
export function AboutView() {
  const repo = FALLBACK;
  const [, setTapCount] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * @description 处理叶子图标点击：在短时间内累计点击次数，达到阈值触发彩蛋动画。
   * @returns void
   */
  const handleLeafTap = useCallback(() => {
    if (easterEgg) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setParticles(createParticles());
        setEasterEgg(true);
        setTimeout(() => setEasterEgg(false), 2500);
        return 0;
      }
      return next;
    });

    timerRef.current = setTimeout(() => setTapCount(0), 400);
  }, [easterEgg]);

  const infoItems = [
    { label: '版本', value: repo.version },
    { label: '许可协议', value: repo.license },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/90 px-4 py-3.5 backdrop-blur-md">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-base font-semibold text-slate-800">关于</h1>
      </header>

      <motion.div
        className="mx-auto max-w-lg px-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {/* App Identity */}
        <motion.section
          className="flex flex-col items-center pt-12 pb-8"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={handleLeafTap}
              className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-emerald-50 transition-transform active:scale-95"
            >
              <motion.div
                animate={easterEgg ? { rotate: 360, scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <Leaf
                  size={36}
                  className="text-emerald-500"
                  strokeWidth={1.8}
                />
              </motion.div>
            </button>

            {/* Easter egg particles */}
            <AnimatePresence>
              {easterEgg &&
                particles.map((p) => (
                  <motion.div
                    key={p.id}
                    className="pointer-events-none absolute top-1/2 left-1/2"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: 0,
                      scale: p.scale,
                      rotate: p.rotate,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.2,
                      delay: p.delay,
                      ease: 'easeOut',
                    }}
                  >
                    <Leaf
                      size={16}
                      className="text-emerald-400"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-800">薄荷外语</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            用 AI 驱动的沉浸式英语学习应用
          </p>
        </motion.section>

        {/* Info Card */}
        <motion.div
          className="overflow-hidden rounded-2xl bg-white shadow-sm"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {infoItems.map((item, idx) => (
            <div
              key={item.label}
              className={`flex items-center justify-between px-5 py-4 ${
                idx < infoItems.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-700">
                {item.value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Author Card */}
        <motion.div
          className="mt-4"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <a
            href={repo.ownerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-sm transition-colors hover:bg-slate-50"
          >
            <img
              src={repo.ownerAvatar}
              alt={repo.ownerLogin}
              className="h-10 w-10 rounded-full bg-slate-100"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">
                {repo.ownerLogin}
              </p>
              <p className="text-xs text-slate-400">作者 · GitHub</p>
            </div>
            <ExternalLink size={16} className="text-slate-300" />
          </a>
        </motion.div>

        {/* Source Code Link */}
        <motion.div
          className="mt-4"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <a
            href="https://github.com/SaltedFish-No1/Daily-English"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm transition-colors hover:bg-slate-50"
          >
            <span className="text-sm text-slate-500">源代码</span>
            <ChevronRight size={16} className="text-slate-300" />
          </a>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="pt-10 pb-4 text-center text-xs text-slate-300"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        >
          Made with love for learners
        </motion.p>
      </motion.div>
    </div>
  );
}
