'use client';

/**
 * @author SaltedFish-No1
 * @description 用户反馈表单组件 — 支持选择反馈类型、填写内容和联系方式。
 */

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FEEDBACK_TYPE_OPTIONS,
  type FeedbackType,
  type FeedbackPayload,
  type FeedbackContext,
} from '../types';

interface FeedbackFormProps {
  onSuccess: () => void;
}

const MIN_CONTENT_LENGTH = 10;

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const { user, isGuest } = useAuthStore();

  const [type, setType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = content.trim();
    if (trimmed.length < MIN_CONTENT_LENGTH) {
      toast.error(`反馈内容至少 ${MIN_CONTENT_LENGTH} 个字`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: FeedbackPayload = {
        type,
        content: trimmed,
        ...(contact.trim() && { contact: contact.trim() }),
      };

      const context: FeedbackContext = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...(!isGuest && user?.id && { userId: user.id }),
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, context }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? '提交失败');
      }

      toast.success('感谢您的反馈！');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── 反馈类型 ── */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          反馈类型
        </label>
        <div className="flex gap-2">
          {FEEDBACK_TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={opt.value === type ? 'default' : 'ghost'}
              onClick={() => setType(opt.value)}
              disabled={isSubmitting}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                opt.value === type
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── 反馈内容 ── */}
      <div>
        <label
          htmlFor="feedback-content"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          详细描述
        </label>
        <Textarea
          id="feedback-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请描述您遇到的问题或建议..."
          disabled={isSubmitting}
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">
          {content.length}/1000
        </p>
      </div>

      {/* ── 联系方式 ── */}
      <div>
        <label
          htmlFor="feedback-contact"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          联系方式
          <span className="ml-1 text-xs text-slate-400">（选填）</span>
        </label>
        <Input
          id="feedback-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="邮箱或微信号，方便我们联系您"
          disabled={isSubmitting}
          maxLength={100}
        />
      </div>

      {/* ── 提交按钮 ── */}
      <Button
        type="submit"
        disabled={isSubmitting || content.trim().length < MIN_CONTENT_LENGTH}
        className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            提交中...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Send size={16} />
            提交反馈
          </span>
        )}
      </Button>
    </form>
  );
}
