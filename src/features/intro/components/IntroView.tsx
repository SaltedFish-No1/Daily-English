'use client';

/**
 * @author SaltedFish-No1
 * @description 产品介绍页视图，展示薄荷外语功能亮点与注册引导。
 */
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  GraduationCap,
  Camera,
  ArrowRight,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Feature cards data                                                        */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    icon: BookOpen,
    title: '沉浸阅读',
    desc: '精选英语文章，中英对照，边读边学，词汇量自然提升',
  },
  {
    icon: Sparkles,
    title: 'AI 智能复习',
    desc: '根据你的生词本，AI 实时生成个性化阅读材料与测验',
  },
  {
    icon: GraduationCap,
    title: '写作批改',
    desc: 'AI 逐维度打分，语法纠错、词汇建议、范文对照，一键提升写作力',
  },
  {
    icon: Camera,
    title: '拍照识词',
    desc: '手写单词拍一拍，即刻识别、释义、发音，随时随地学习',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 14 },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -30 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 12,
      delay: 0.1,
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Typewriter title                                                          */
/* -------------------------------------------------------------------------- */

const TITLE = '薄荷外语';

function TypewriterTitle() {
  return (
    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
      {TITLE.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
        >
          {char}
        </motion.span>
      ))}
    </h1>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export const IntroView: React.FC = () => {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const loginHref = redirect ? `/login?redirect=${redirect}` : '/login';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* ── Floating gradient orbs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="animate-float-medium absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl sm:h-80 sm:w-80" />
        <div className="animate-float-fast absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl sm:h-72 sm:w-72" />
      </div>

      {/* ── Hero section ── */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-5 pt-16 pb-12 text-center sm:px-8 lg:min-h-[50vh] lg:px-16">
        <TypewriterTitle />

        <motion.p
          className="mt-4 max-w-md text-base font-medium text-slate-300 sm:text-lg lg:max-w-lg lg:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          每日沉浸式互动体验，轻松掌握地道外语表达
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="mt-8"
        >
          <Link
            href={loginHref}
            className="group relative inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-100"
          >
            {/* pulse glow */}
            <span className="animate-pulse-glow absolute inset-0 rounded-full bg-emerald-400/40 blur-md" />
            <span className="relative">开始使用</span>
            <ArrowRight
              size={18}
              className="relative transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </section>

      {/* ── Features section ── */}
      <section className="relative px-5 pb-24 sm:px-8 lg:px-16">
        <motion.div
          className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-emerald-400/30 hover:bg-white/10"
            >
              <motion.div
                variants={iconVariants}
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15"
              >
                <Icon size={24} className="text-emerald-400" />
              </motion.div>
              <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-6 text-sm text-slate-500">
            免费注册，即刻开启你的英语进阶之旅
          </p>
          <Link
            href={loginHref}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-emerald-500/40 px-8 py-3 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/10"
          >
            立即注册 / 登录
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};
