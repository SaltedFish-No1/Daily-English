'use client';

import React, { useEffect, useState } from 'react';
import { LessonQuiz } from '@/types/lesson';
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface QuizProps {
  quiz: LessonQuiz;
  persistKey: string;
  onComplete?: (score: number) => void;
}

interface QuizProgressState {
  currentIdx: number;
  selectedOption: number | null;
  score: number;
  isFinished: boolean;
}

const initialQuizProgress: QuizProgressState = {
  currentIdx: 0,
  selectedOption: null,
  score: 0,
  isFinished: false,
};

export const Quiz: React.FC<QuizProps> = ({ quiz, persistKey }) => {
  const questions = quiz.questions;
  const storageKey = `daily-english:quiz-progress:${persistKey}`;

  const getInitialProgress = (): QuizProgressState => {
    if (typeof window === 'undefined') return initialQuizProgress;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return initialQuizProgress;
    try {
      const parsed = JSON.parse(raw) as QuizProgressState;
      if (
        typeof parsed.currentIdx !== 'number' ||
        typeof parsed.score !== 'number' ||
        typeof parsed.isFinished !== 'boolean'
      ) {
        return initialQuizProgress;
      }
      return {
        currentIdx: Math.min(
          Math.max(parsed.currentIdx, 0),
          Math.max(questions.length - 1, 0)
        ),
        selectedOption:
          typeof parsed.selectedOption === 'number'
            ? parsed.selectedOption
            : null,
        score: parsed.score,
        isFinished: parsed.isFinished,
      };
    } catch {
      window.localStorage.removeItem(storageKey);
      return initialQuizProgress;
    }
  };

  const [quizState, setQuizState] =
    useState<QuizProgressState>(getInitialProgress);
  const safeCurrentIdx = Math.min(
    quizState.currentIdx,
    Math.max(questions.length - 1, 0)
  );
  const currentQuestion = questions[safeCurrentIdx];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: QuizProgressState = {
      currentIdx: quizState.currentIdx,
      selectedOption: quizState.selectedOption,
      score: quizState.score,
      isFinished: quizState.isFinished,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [quizState, storageKey]);

  const labels = {
    completeTitle: quiz.completeTitle || 'Quiz Complete!',
    retakeButtonLabel: quiz.retakeButtonLabel || 'Restart Quiz',
    resultPrefix: quiz.resultPrefix || 'You scored',
    resultSuffix: quiz.resultSuffix || 'out of',
    scoreLabel: quiz.scoreLabel || 'Score',
    correctLabel: quiz.correctLabel || 'Correct!',
    incorrectLabel: quiz.incorrectLabel || 'Incorrect',
    nextButtonLabel: quiz.nextButtonLabel || 'Next Question',
    viewResultsButtonLabel: quiz.viewResultsButtonLabel || 'View Results',
  };

  const handleOptionClick = (idx: number) => {
    if (quizState.selectedOption !== null) return;
    const isCorrect = questions[safeCurrentIdx].options[idx].correct;
    setQuizState((prev) => ({
      ...prev,
      selectedOption: idx,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const handleNext = () => {
    if (safeCurrentIdx < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentIdx: prev.currentIdx + 1,
        selectedOption: null,
      }));
    } else {
      setQuizState((prev) => ({ ...prev, isFinished: true }));
    }
  };

  const handleRestart = () => {
    setQuizState(initialQuizProgress);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  };

  if (quizState.isFinished) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center border-gray-100 bg-white p-8 text-center sm:rounded-xl sm:border sm:shadow-sm">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50">
          <span className="text-4xl font-bold text-emerald-600">
            {quizState.score}/{questions.length}
          </span>
        </div>
        <h2 className="mb-2 text-3xl font-bold text-slate-900">
          {labels.completeTitle}
        </h2>
        <p className="mb-8 max-w-sm text-slate-500">
          {labels.resultPrefix} {quizState.score} {labels.resultSuffix}{' '}
          {questions.length}.
          {quizState.score === questions.length
            ? ' Perfect score!'
            : ' Keep practicing to improve!'}
        </p>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
        >
          <RotateCcw size={20} />
          {labels.retakeButtonLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] border-gray-100 bg-white p-5 sm:min-h-0 sm:rounded-xl sm:border sm:p-8 sm:shadow-sm">
      <div className="mb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-widest text-emerald-700 uppercase">
              Question {safeCurrentIdx + 1} of {questions.length}
            </span>
            <h2 className="text-xl leading-snug font-bold text-slate-900 sm:text-2xl">
              {quiz.title}
            </h2>
          </div>
          <div className="text-sm font-bold text-emerald-600">
            {labels.scoreLabel}: {quizState.score}
          </div>
        </div>
        <p className="text-sm text-slate-500 sm:text-base">
          {currentQuestion.q}
        </p>
      </div>

      <div className="mb-8 space-y-4">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(i)}
            disabled={quizState.selectedOption !== null}
            className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
              quizState.selectedOption === null
                ? 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50'
                : i === quizState.selectedOption
                  ? option.correct
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-red-500 bg-red-50'
                  : option.correct
                    ? 'border-emerald-500 bg-emerald-50 opacity-60'
                    : 'border-slate-100 opacity-40'
            }`}
          >
            <div
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                quizState.selectedOption === null
                  ? 'border-slate-300'
                  : i === quizState.selectedOption
                    ? option.correct
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-red-500 bg-red-500 text-white'
                    : option.correct
                      ? 'border-emerald-500 text-emerald-500'
                      : 'border-slate-200'
              }`}
            >
              {quizState.selectedOption !== null && option.correct ? (
                <CheckCircle size={14} />
              ) : null}
              {quizState.selectedOption === i && !option.correct ? (
                <XCircle size={14} />
              ) : null}
              {quizState.selectedOption === null ? (
                <span className="text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
              ) : null}
            </div>
            <span
              className={`text-sm font-medium sm:text-base ${
                quizState.selectedOption === i
                  ? option.correct
                    ? 'text-emerald-900'
                    : 'text-red-900'
                  : 'text-slate-700'
              }`}
            >
              {option.text}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {quizState.selectedOption !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 rounded-2xl p-6 ${
              currentQuestion.options[quizState.selectedOption].correct
                ? 'border border-emerald-100 bg-emerald-50 text-emerald-800'
                : 'border border-red-100 bg-red-50 text-red-800'
            }`}
          >
            <h4 className="mb-1 flex items-center gap-2 font-bold">
              {currentQuestion.options[quizState.selectedOption].correct
                ? `✅ ${labels.correctLabel}`
                : `❌ ${labels.incorrectLabel}`}
            </h4>
            <p className="text-sm leading-relaxed italic opacity-90">
              {currentQuestion.options[quizState.selectedOption].rationale}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={quizState.selectedOption === null}
          className={`flex items-center gap-2 rounded-xl px-8 py-3 font-bold transition-all ${
            quizState.selectedOption === null
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
          }`}
        >
          {safeCurrentIdx === questions.length - 1
            ? labels.viewResultsButtonLabel
            : labels.nextButtonLabel}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
