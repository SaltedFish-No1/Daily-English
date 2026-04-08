'use client';

/**
 * @author SaltedFish-No1
 * @description 填空题视图，将 contentTemplate 中的 {{id}} 解析为输入框。
 */

import React, { useMemo } from 'react';
import { CompletionQuestion } from '../types';

interface CompletionQuestionViewProps {
  question: CompletionQuestion;
  value: Record<string, string>;
  disabled?: boolean;
  onChange: (next: Record<string, string>) => void;
}

const tokenRegex = /\{\{([^}]+)\}\}/g;

export const CompletionQuestionView: React.FC<CompletionQuestionViewProps> = ({
  question,
  value,
  disabled,
  onChange,
}) => {
  const blankMeta = useMemo(() => {
    return question.blanks.reduce<
      Record<string, CompletionQuestion['blanks'][0]>
    >((acc, b) => {
      acc[b.id] = b;
      return acc;
    }, {});
  }, [question.blanks]);

  const parts = useMemo(() => {
    const out: Array<
      { type: 'text'; value: string } | { type: 'blank'; id: string }
    > = [];
    let lastIndex = 0;
    for (const match of question.contentTemplate.matchAll(tokenRegex)) {
      const idx = match.index ?? 0;
      const id = match[1].trim();
      if (idx > lastIndex) {
        out.push({
          type: 'text',
          value: question.contentTemplate.slice(lastIndex, idx),
        });
      }
      out.push({ type: 'blank', id });
      lastIndex = idx + match[0].length;
    }
    if (lastIndex < question.contentTemplate.length) {
      out.push({
        type: 'text',
        value: question.contentTemplate.slice(lastIndex),
      });
    }
    return out;
  }, [question.contentTemplate]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-bold text-slate-900">{question.instruction}</p>
        <div className="mt-3 flex flex-wrap items-center leading-relaxed">
          {parts.map((part, idx) => {
            if (part.type === 'text') {
              return (
                <span key={idx} className="whitespace-pre-wrap">
                  {part.value}
                </span>
              );
            }
            const meta = blankMeta[part.id];
            const v = value[part.id] ?? '';
            const placeholder = meta?.posHint
              ? meta.posHint
              : meta?.wordLimit
                ? `≤${meta.wordLimit}词`
                : '';
            return (
              <span key={idx} className="mx-1 inline-flex flex-col">
                <input
                  value={v}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      [part.id]: e.target.value,
                    })
                  }
                  placeholder={placeholder}
                  className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 disabled:opacity-60 sm:w-44"
                />
              </span>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {question.blanks.map((b) => (
          <div
            key={b.id}
            className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600"
          >
            <span className="font-bold text-slate-700">{b.id}</span>
            {b.wordLimit ? ` · ≤${b.wordLimit}词` : ''}
            {b.posHint ? ` · ${b.posHint}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
};
