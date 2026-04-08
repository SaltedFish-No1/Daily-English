'use client';

/**
 * @author SaltedFish-No1
 * @description 写作编辑器组件，提供文本输入区域和字数统计功能。
 */
import { useCallback } from 'react';
import { useWritingStore } from '@/store/useWritingStore';
import { Textarea } from '@/components/ui/textarea';

interface WritingEditorProps {
  wordLimit?: number | null;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function WritingEditor({ wordLimit }: WritingEditorProps) {
  const { currentDraftText, setDraftText, isTimerRunning, startTimer } =
    useWritingStore();

  const wordCount = countWords(currentDraftText);
  const isOverLimit = wordLimit ? wordCount > wordLimit * 1.1 : false;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDraftText(e.target.value);
      if (!isTimerRunning && e.target.value.trim().length > 0) {
        startTimer();
      }
    },
    [setDraftText, isTimerRunning, startTimer]
  );

  return (
    <div className="flex flex-1 flex-col">
      <Textarea
        value={currentDraftText}
        onChange={handleChange}
        placeholder="Start writing your answer here..."
        className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 transition-colors outline-none placeholder:text-slate-300 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        style={{ minHeight: '280px' }}
      />
      <div className="mt-2 flex items-center justify-between px-1">
        <span
          className={`text-xs font-medium ${
            isOverLimit ? 'text-red-500' : 'text-slate-400'
          }`}
        >
          {wordCount} 词{wordLimit ? ` / ${wordLimit}` : ''}
        </span>
        {wordLimit && wordCount > 0 && (
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                isOverLimit
                  ? 'bg-red-400'
                  : wordCount >= wordLimit
                    ? 'bg-emerald-400'
                    : 'bg-violet-400'
              }`}
              style={{
                width: `${Math.min((wordCount / wordLimit) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
