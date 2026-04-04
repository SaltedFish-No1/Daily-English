'use client';

/**
 * @description 判断正误（TRUE/FALSE/NOT GIVEN）题视图。
 */

import React from 'react';
import { TFNGLabel, TFNGQuestion, YNNGLabel } from '../types';

interface TFNGQuestionViewProps {
  question: TFNGQuestion;
  value: TFNGLabel | YNNGLabel | null;
  disabled?: boolean;
  onChange: (next: TFNGLabel | YNNGLabel) => void;
}

export const TFNGQuestionView: React.FC<TFNGQuestionViewProps> = ({
  question,
  value,
  disabled,
  onChange,
}) => {
  const options =
    question.mode === 'TFNG'
      ? (['TRUE', 'FALSE', 'NOT_GIVEN'] as const)
      : (['YES', 'NO', 'NOT_GIVEN'] as const);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
        {question.statement}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
              value === opt
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {opt.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
};
