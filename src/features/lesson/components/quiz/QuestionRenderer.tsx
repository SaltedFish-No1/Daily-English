'use client';

import React from 'react';
import { questionRendererRegistry } from './registry';
import {
  AnyQuizQuestion,
  CompletionQuestion,
  IELTSQuestion,
  MatchingFeaturesQuestion,
  MatchingHeadingsQuestion,
  MatchingInformationQuestion,
  MultipleChoiceQuestion,
  TFNGQuestion,
  UserAnswer,
  isIELTSQuestion,
} from './types';

interface QuestionRendererProps {
  question: AnyQuizQuestion;
  questionId: string;
  answer: UserAnswer | undefined;
  disabled?: boolean;
  onAnswerChange: (next: UserAnswer) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionId,
  answer,
  disabled,
  onAnswerChange,
}) => {
  if (!isIELTSQuestion(question)) {
    const selectedIndex =
      answer?.type === 'legacy_single' ? answer.payload.selectedIndex : null;
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onAnswerChange({
                  questionId,
                  type: 'legacy_single',
                  payload: { selectedIndex: i },
                })
              }
              disabled={disabled}
              className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                selectedIndex === i
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  selectedIndex === i
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                <span className="text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 sm:text-base">
                {option.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const q: IELTSQuestion = question;
  switch (q.type) {
    case 'tfng': {
      const Component = questionRendererRegistry.tfng;
      const value = answer?.type === 'tfng' ? answer.payload.selected : null;
      return (
        <Component
          question={q as TFNGQuestion}
          value={value}
          disabled={disabled}
          onChange={(selected) =>
            onAnswerChange({
              questionId,
              type: 'tfng',
              payload: { selected },
            })
          }
        />
      );
    }
    case 'multiple_choice': {
      const Component = questionRendererRegistry.multiple_choice;
      const value =
        answer?.type === 'multiple_choice'
          ? answer.payload.selectedOptionIds
          : [];
      return (
        <Component
          question={q as MultipleChoiceQuestion}
          value={value}
          disabled={disabled}
          onChange={(selectedOptionIds) =>
            onAnswerChange({
              questionId,
              type: 'multiple_choice',
              payload: { selectedOptionIds },
            })
          }
        />
      );
    }
    case 'matching_headings': {
      const Component = questionRendererRegistry.matching_headings;
      const value =
        answer?.type === 'matching_headings' ? answer.payload.mapping : {};
      return (
        <Component
          question={q as MatchingHeadingsQuestion}
          value={value}
          disabled={disabled}
          onChange={(mapping) =>
            onAnswerChange({
              questionId,
              type: 'matching_headings',
              payload: { mapping },
            })
          }
        />
      );
    }
    case 'matching_information': {
      const Component = questionRendererRegistry.matching_information;
      const value =
        answer?.type === 'matching_information' ? answer.payload.mapping : {};
      return (
        <Component
          question={q as MatchingInformationQuestion}
          value={value}
          disabled={disabled}
          onChange={(mapping) =>
            onAnswerChange({
              questionId,
              type: 'matching_information',
              payload: { mapping },
            })
          }
        />
      );
    }
    case 'matching_features': {
      const Component = questionRendererRegistry.matching_features;
      const value =
        answer?.type === 'matching_features' ? answer.payload.mapping : {};
      return (
        <Component
          question={q as MatchingFeaturesQuestion}
          value={value}
          disabled={disabled}
          onChange={(mapping) =>
            onAnswerChange({
              questionId,
              type: 'matching_features',
              payload: { mapping },
            })
          }
        />
      );
    }
    case 'completion': {
      const Component = questionRendererRegistry.completion;
      const value = answer?.type === 'completion' ? answer.payload.blanks : {};
      return (
        <Component
          question={q as CompletionQuestion}
          value={value}
          disabled={disabled}
          onChange={(blanks) =>
            onAnswerChange({
              questionId,
              type: 'completion',
              payload: { blanks },
            })
          }
        />
      );
    }
  }
};
