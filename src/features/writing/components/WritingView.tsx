'use client';

/**
 * @author SaltedFish-No1
 * @description 写作练习主视图，展示写作题目列表和题目上传入口。
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, Plus, Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { TopicCard } from './TopicCard';
import { TopicUploader } from './TopicUploader';
import { useWritingTopicsQuery } from '@/features/writing/hooks/useWritingTopicsQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import type { WritingTopic } from '@/types/writing';

export function WritingView() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [showUploader, setShowUploader] = useState(false);

  const { data: topics = [], isLoading: isTopicsLoading } =
    useWritingTopicsQuery();

  const isLoading = isAuthLoading || (!!user && isTopicsLoading);

  function handleTopicCreated(topic: WritingTopic) {
    setShowUploader(false);
    router.push(`/writing/${topic.id}`);
  }

  // Not logged in
  if (!isAuthLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5">
        <PenLine size={48} className="mb-4 text-violet-300" />
        <p className="text-center text-sm text-slate-500">
          登录后即可使用写作练习功能
        </p>
        <Button
          onClick={() => router.push('/login')}
          className="mt-4 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white"
        >
          去登录
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 hidden border-b border-gray-100 bg-white shadow-sm lg:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-5 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/learn')}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                写作练习
              </h1>
              <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Writing Practice
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-grow px-5 py-6">
        {/* Upload CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowUploader(true)}
          className="mb-6 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-5 text-left transition-all hover:border-violet-400 hover:bg-violet-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <Plus size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">上传新题目</p>
            <p className="text-xs text-slate-500">
              拍照或选择写作题目图片，AI 自动识别
            </p>
          </div>
        </motion.button>

        {/* Topic list */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <BookOpen size={40} className="text-slate-200" />
            <p className="text-sm">还没有写作题目</p>
            <p className="text-xs">点击上方按钮上传你的第一个题目</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TopicCard topic={topic} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Uploader modal */}
      <AnimatePresence>
        {showUploader && (
          <TopicUploader
            onTopicCreated={handleTopicCreated}
            onClose={() => setShowUploader(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
