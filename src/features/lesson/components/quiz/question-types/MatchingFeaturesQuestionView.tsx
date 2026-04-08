'use client';

/**
 * @author SaltedFish-No1
 * @description 特征匹配题视图。
 */

import React, { useMemo } from 'react';
import { MatchingFeaturesQuestion } from '../types';

interface MatchingFeaturesQuestionViewProps {
  question: MatchingFeaturesQuestion;
  value: Record<string, string>;
  disabled?: boolean;
  onChange: (next: Record<string, string>) => void;
}

export const MatchingFeaturesQuestionView: React.FC<
  MatchingFeaturesQuestionViewProps
> = ({ question, value, disabled, onChange }) => {
  const selectedFeatureIds = useMemo(() => {
    if (question.allowReuse) return new Set<string>();
    return new Set(Object.values(value).filter(Boolean));
  }, [question.allowReuse, value]);

  return (
    <div className="space-y-3">
      {question.statements.map((s) => {
        const selected = value[s.id] ?? '';
        return (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-100 bg-white p-4"
          >
            <p className="text-sm font-bold text-slate-900">{s.text}</p>
            <div className="mt-2 flex justify-end">
              <select
                value={selected}
                disabled={disabled}
                onChange={(e) => {
                  const next = { ...value };
                  const v = e.target.value;
                  if (!v) delete next[s.id];
                  else next[s.id] = v;
                  onChange(next);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                <option value="">未选择</option>
                {question.features.map((f) => (
                  <option
                    key={f.id}
                    value={f.id}
                    disabled={
                      !question.allowReuse &&
                      f.id !== selected &&
                      selectedFeatureIds.has(f.id)
                    }
                  >
                    {f.label}
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
