'use client';

/**
 * @author SaltedFish-No1
 * @description 单选/多选题视图。
 */

import React from 'react';
import { MultipleChoiceQuestion } from '../types';

interface MultipleChoiceQuestionViewProps {
  question: MultipleChoiceQuestion;
  value: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}

const toggle = (arr: string[], id: string) => {
  if (arr.includes(id)) return arr.filter((x) => x !== id);
  return [...arr, id];
};

export const MultipleChoiceQuestionView: React.FC<
  MultipleChoiceQuestionViewProps
> = ({ question, value, disabled, onChange }) => {
  const isMulti = question.selectionMode === 'multiple';
  return (
    <div className="space-y-3">
      {question.options.map((opt, idx) => {
        const selected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (isMulti) {
                onChange(toggle(value, opt.id));
              } else {
                onChange([opt.id]);
              }
            }}
            className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
              selected
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <div
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                selected
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              <span className="text-xs font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700 sm:text-base">
              {opt.text}
            </span>
          </button>
        );
      })}
      {question.selectionMode === 'multiple' && (
        <p className="text-xs font-semibold text-slate-500">
          已选 {value.length} 项
        </p>
      )}
    </div>
  );
};
