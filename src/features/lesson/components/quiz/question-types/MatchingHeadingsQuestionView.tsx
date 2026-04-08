'use client';

/**
 * @author SaltedFish-No1
 * @description 段落标题匹配题视图。
 */

import React, { useMemo } from 'react';
import { MatchingHeadingsQuestion } from '../types';

interface MatchingHeadingsQuestionViewProps {
  question: MatchingHeadingsQuestion;
  value: Record<string, string>;
  disabled?: boolean;
  onChange: (next: Record<string, string>) => void;
}

export const MatchingHeadingsQuestionView: React.FC<
  MatchingHeadingsQuestionViewProps
> = ({ question, value, disabled, onChange }) => {
  const selectedHeadingIds = useMemo(() => {
    if (question.allowReuse) return new Set<string>();
    return new Set(Object.values(value).filter(Boolean));
  }, [question.allowReuse, value]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-bold text-slate-800">标题池</p>
        <div className="mt-2 space-y-1">
          {question.headings.map((h) => (
            <div key={h.id} className="flex items-start gap-2">
              <span className="w-10 flex-shrink-0 rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                {h.id}
              </span>
              <span className="text-sm text-slate-700">{h.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {question.paragraphs.map((p) => {
          const selected = value[p.id] ?? '';
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">{p.label}</p>
                <select
                  value={selected}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = { ...value };
                    const v = e.target.value;
                    if (!v) delete next[p.id];
                    else next[p.id] = v;
                    onChange(next);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  <option value="">未选择</option>
                  {question.headings.map((h) => (
                    <option
                      key={h.id}
                      value={h.id}
                      disabled={
                        !question.allowReuse &&
                        h.id !== selected &&
                        selectedHeadingIds.has(h.id)
                      }
                    >
                      {h.id}
                    </option>
                  ))}
                </select>
              </div>
              {p.textRef && (
                <p className="text-xs text-slate-500">定位：{p.textRef}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
