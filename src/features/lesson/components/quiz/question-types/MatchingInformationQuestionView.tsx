'use client';

import React, { useMemo } from 'react';
import { MatchingInformationQuestion } from '../types';

interface MatchingInformationQuestionViewProps {
  question: MatchingInformationQuestion;
  value: Record<string, string>;
  disabled?: boolean;
  onChange: (next: Record<string, string>) => void;
}

export const MatchingInformationQuestionView: React.FC<
  MatchingInformationQuestionViewProps
> = ({ question, value, disabled, onChange }) => {
  const selectedTargetIds = useMemo(() => {
    if (question.allowReuse) return new Set<string>();
    return new Set(Object.values(value).filter(Boolean));
  }, [question.allowReuse, value]);

  return (
    <div className="space-y-3">
      {question.items.map((item) => {
        const selected = value[item.id] ?? '';
        return (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-white p-4"
          >
            <p className="text-sm font-bold text-slate-900">{item.statement}</p>
            <div className="mt-2 flex justify-end">
              <select
                value={selected}
                disabled={disabled}
                onChange={(e) => {
                  const next = { ...value };
                  const v = e.target.value;
                  if (!v) delete next[item.id];
                  else next[item.id] = v;
                  onChange(next);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                <option value="">未选择</option>
                {question.targets.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={
                      !question.allowReuse &&
                      t.id !== selected &&
                      selectedTargetIds.has(t.id)
                    }
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
};
