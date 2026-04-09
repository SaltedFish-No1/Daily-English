'use client';

/**
 * @author SaltedFish-No1
 * @description 关于页组件文件：展示应用品牌信息、仓库元数据、作者信息与源码入口。
 *   页面包含彩蛋交互（连续点击叶子图标触发粒子动画）。
 */

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, ExternalLink, Leaf } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { clientEnv } from '@/lib/env/client';

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
  version: clientEnv.NEXT_PUBLIC_APP_VERSION ?? '线下版本',
  license: '保留所有权利',
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
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * @description 处理叶子图标点击：在短时间内累计点击次数，达到阈值触发彩蛋动画。
   * @returns void
   */
  const handleLeafTap = useCallback(() => {
    if (isEasterEgg) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setParticles(createParticles());
        setIsEasterEgg(true);
        setTimeout(() => setIsEasterEgg(false), 2500);
        return 0;
      }
      return next;
    });

    timerRef.current = setTimeout(() => setTapCount(0), 400);
  }, [isEasterEgg]);

  const infoItems = [
    { label: '版本', value: repo.version },
    { label: '许可协议', value: repo.license },
  ];
  const ownerInitial = repo.ownerLogin.slice(0, 1).toUpperCase();

  return (
    <div className="bg-background/90 min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white/70 px-4 py-3.5 backdrop-blur-md">
        <Link
          href="/profile"
          className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <h1 className="text-foreground text-base font-semibold">关于</h1>
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
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={handleLeafTap}
              className="h-20 w-20 rounded-3xl bg-emerald-50/90 text-emerald-500 hover:bg-emerald-100/80"
            >
              <motion.div
                animate={isEasterEgg ? { rotate: 360, scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <Leaf
                  size={36}
                  className="text-emerald-500"
                  strokeWidth={1.8}
                />
              </motion.div>
            </Button>

            {/* Easter egg particles */}
            <AnimatePresence>
              {isEasterEgg &&
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

          <h2 className="text-foreground mt-5 text-xl font-bold">薄荷外语</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            用 AI 驱动的沉浸式英语学习应用
          </p>
        </motion.section>

        {/* Info Card */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card className="bg-card/95 gap-0 rounded-2xl border-0 py-0 shadow-sm">
            {infoItems.map((item, idx) => (
              <div key={item.label} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {item.label}
                  </span>
                  <span className="text-foreground text-sm font-medium">
                    {item.value}
                  </span>
                </div>
                {idx < infoItems.length - 1 ? (
                  <Separator className="bg-border/70 mt-4" />
                ) : null}
              </div>
            ))}
          </Card>
        </motion.div>

        {/* Author Card */}
        <motion.div
          className="mt-4"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card className="bg-card/95 rounded-2xl border-0 py-0 shadow-sm">
            <a
              href={repo.ownerUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/40 flex items-center gap-3.5 px-5 py-4 transition-colors"
            >
              <Avatar size="lg">
                <AvatarImage src={repo.ownerAvatar} alt={repo.ownerLogin} />
                <AvatarFallback>{ownerInitial}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">
                  {repo.ownerLogin}
                </p>
                <p className="text-muted-foreground text-xs">作者 · GitHub</p>
              </div>
              <ExternalLink size={16} className="text-muted-foreground/60" />
            </a>
          </Card>
        </motion.div>

        {/* Source Code Link */}
        <motion.div
          className="mt-4"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card className="bg-card/95 rounded-2xl border-0 py-0 shadow-sm">
            <a
              href="https://github.com/SaltedFish-No1/Daily-English"
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/40 flex items-center justify-between px-5 py-4 transition-colors"
            >
              <span className="text-muted-foreground text-sm">源代码</span>
              <ChevronRight size={16} className="text-muted-foreground/70" />
            </a>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-muted-foreground/70 pt-10 pb-4 text-center text-xs"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        >
          Made with love for learners
        </motion.p>
      </motion.div>
    </div>
  );
}
