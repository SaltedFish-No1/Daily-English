'use client';

/**
 * @author SaltedFish-No1
 * @description 写作主题卡片组件，展示题目信息、提交次数和最近成绩。
 */
import Link from 'next/link';
import { FileText, Trophy, Hash, ArrowRight } from 'lucide-react';
import type { WritingTopicWithStats } from '@/types/writing';

interface TopicCardProps {
  topic: WritingTopicWithStats;
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Link
      href={`/writing/${topic.id}`}
      className="group block rounded-2xl border border-violet-100 bg-white shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
    >
      <div className="flex items-start gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <FileText size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {topic.title ?? '未命名题目'}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {topic.writingPrompt}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Hash size={12} />
              {topic.submissionCount} 次作答
            </span>
            {topic.bestScore != null && (
              <span className="flex items-center gap-1">
                <Trophy size={12} className="text-amber-500" />
                最高 {topic.bestScore}
              </span>
            )}
            {topic.wordLimit && <span>{topic.wordLimit} 词</span>}
          </div>
        </div>
        <ArrowRight
          size={16}
          className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-violet-500"
        />
      </div>
    </Link>
  );
}
