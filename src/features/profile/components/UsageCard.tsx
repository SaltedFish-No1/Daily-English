'use client';

/**
 * @description 用量卡片 — 展示当前等级、今日各 AI 路由剩余次数与 token 用量。
 */

import { Zap, Crown, Loader2 } from 'lucide-react';
import { useUsageQuery } from '@/hooks/useUsageQuery';
import type { RouteKey } from '@/types/usage';

/** 路由键 → 中文标签 */
const ROUTE_LABELS: Record<RouteKey, string> = {
  'review-generate': '复习生成',
  'writing-grade': '作文批改',
  'writing-ocr': '手写识别',
  'writing-parse-topic-image': '题目识别',
  'writing-submit-vision': '手写提交',
  'photo-capture': '拍照识词',
  dictionary: '词典查询',
  tts: '单词发音',
};

/** 展示优先级排序（高消耗 AI 优先） */
const DISPLAY_ORDER: RouteKey[] = [
  'review-generate',
  'writing-grade',
  'photo-capture',
  'dictionary',
  'tts',
  'writing-ocr',
  'writing-parse-topic-image',
  'writing-submit-vision',
];

function ProgressBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isHigh = pct >= 80;
  const isFull = pct >= 100;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${
          isFull ? 'bg-red-400' : isHigh ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function UsageCard() {
  const { data, isLoading } = useUsageQuery();

  if (isLoading) {
    return (
      <section className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </section>
    );
  }

  if (!data) return null;

  const { tier, today } = data;
  const isPro = tier === 'pro';

  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        {isPro ? (
          <Crown size={18} className="text-amber-500" />
        ) : (
          <Zap size={18} className="text-emerald-600" />
        )}
        <h2 className="text-sm font-bold text-slate-900">今日用量</h2>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            isPro ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {isPro ? 'Pro' : 'Free'}
        </span>
      </div>

      {/* Route usage rows */}
      <div className="space-y-3 px-5 pb-4">
        {DISPLAY_ORDER.map((key) => {
          const route = today.routes[key];
          if (!route) return null;
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {ROUTE_LABELS[key]}
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {route.calls}/{route.maxCalls}
                </span>
              </div>
              <ProgressBar current={route.calls} max={route.maxCalls} />
            </div>
          );
        })}
      </div>

      {/* Token usage */}
      <div className="border-t border-slate-100 px-5 py-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-slate-500">Token 用量</span>
          <span className="text-xs font-medium text-slate-700">
            {formatTokens(today.totalTokens)}/{formatTokens(today.maxTokens)}
          </span>
        </div>
        <ProgressBar current={today.totalTokens} max={today.maxTokens} />
      </div>
    </section>
  );
}
