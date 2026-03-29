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
  selectedAnswers: Array<number | null>;
}

const initialQuizProgress: QuizProgressState = {
  currentIdx: 0,
  selectedOption: null,
  score: 0,
  isFinished: false,
  selectedAnswers: [],
};

export const Quiz: React.FC<QuizProps> = ({ quiz, persistKey, onComplete }) => {
  const questions = quiz.questions;
  const storageKey = `daily-english:quiz-progress:${persistKey}`;
  const [showReview, setShowReview] = useState(false);
  const [rationaleLang, setRationaleLang] = useState<'en' | 'zh'>('en');

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
        selectedAnswers: Array.isArray(parsed.selectedAnswers)
          ? parsed.selectedAnswers.map((item) =>
              typeof item === 'number' ? item : null
            )
          : [],
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
      selectedAnswers: quizState.selectedAnswers,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [quizState, storageKey]);

  useEffect(() => {
    if (!quizState.isFinished) return;
    onComplete?.(quizState.score);
  }, [quizState.isFinished, quizState.score, onComplete]);

  const labels = {
    completeTitle: '测验完成',
    retakeButtonLabel: '重新作答',
    scoreLabel: '得分',
    correctLabel: '回答正确',
    incorrectLabel: '回答错误',
    nextButtonLabel: '下一题',
    viewResultsButtonLabel: '查看结果',
  };

  const handleOptionClick = (idx: number) => {
    if (quizState.selectedOption !== null) return;
    const isCorrect = questions[safeCurrentIdx].options[idx].correct;
    setQuizState((prev) => ({
      ...prev,
      selectedOption: idx,
      score: isCorrect ? prev.score + 1 : prev.score,
      selectedAnswers: [
        ...prev.selectedAnswers.slice(0, safeCurrentIdx),
        idx,
        ...prev.selectedAnswers.slice(safeCurrentIdx + 1),
      ],
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
    setShowReview(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  };

  const scorePercent =
    questions.length > 0
      ? Math.round((quizState.score / questions.length) * 100)
      : 0;
  const scoreFeedback =
    scorePercent >= 90
      ? '表现非常优秀，继续保持。'
      : scorePercent >= 70
        ? '掌握较好，再复盘错题会更稳。'
        : scorePercent >= 50
          ? '基础已建立，建议回看文章后再刷一遍。'
          : '建议先回顾文章与词汇，再重新练习。';

  const reviewRows = questions.map((question, questionIndex) => {
    const selected = quizState.selectedAnswers[questionIndex];
    const selectedOption =
      typeof selected === 'number' ? question.options[selected] : null;
    const correctOption =
      question.options.find((option) => option.correct) ?? question.options[0];
    const isCorrect = selectedOption?.correct ?? false;
    return {
      questionIndex,
      questionText: question.q,
      selectedText: selectedOption?.text ?? '未作答',
      correctText: correctOption.text,
      rationale: selectedOption?.rationale ?? correctOption.rationale,
      isCorrect,
    };
  });

  if (quizState.isFinished) {
    if (showReview) {
      return (
        <div className="min-h-[80vh] border-gray-100 bg-white p-5 sm:min-h-0 sm:rounded-xl sm:border sm:p-8 sm:shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              做题记录与解析
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setRationaleLang(rationaleLang === 'en' ? 'zh' : 'en')
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                {rationaleLang === 'en' ? '中' : 'En'}
              </button>
              <button
                onClick={() => setShowReview(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                返回成绩
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {reviewRows.map((row) => (
              <div
                key={row.questionIndex}
                className={`rounded-2xl border p-5 ${
                  row.isCorrect
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <h3 className="mb-2 text-sm font-bold text-slate-900">
                  Q{row.questionIndex + 1}. {row.questionText}
                </h3>
                <p className="mb-1 text-sm text-slate-700">
                  你的答案：{row.selectedText}
                </p>
                <p className="mb-2 text-sm text-slate-700">
                  正确答案：{row.correctText}
                </p>
                <div className="mt-3 border-t border-slate-200/50 pt-3 text-sm leading-relaxed text-slate-600 italic">
                  <span className="font-bold text-slate-700 not-italic">
                    解析：
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof row.rationale === 'string'
                          ? row.rationale
                          : row.rationale[rationaleLang],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
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
        <p className="mb-8 max-w-sm text-slate-500">{scoreFeedback}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setShowReview(true)}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            查看做题记录与解析
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
          >
            <RotateCcw size={20} />
            {labels.retakeButtonLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] border-gray-100 bg-white p-5 sm:min-h-0 sm:rounded-xl sm:border sm:p-8 sm:shadow-sm">
      <div className="mb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-widest text-emerald-700 uppercase">
              第 {safeCurrentIdx + 1} 题 / 共 {questions.length} 题
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
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold">
                {currentQuestion.options[quizState.selectedOption].correct
                  ? `✅ ${labels.correctLabel}`
                  : `❌ ${labels.incorrectLabel}`}
              </h4>
              <button
                onClick={() =>
                  setRationaleLang(rationaleLang === 'en' ? 'zh' : 'en')
                }
                className="rounded bg-white/50 px-2 py-1 text-xs font-medium transition-colors hover:bg-white/80"
              >
                {rationaleLang === 'en' ? '中' : 'En'}
              </button>
            </div>
            <div
              className="text-sm leading-relaxed italic opacity-90"
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const rat =
                    currentQuestion.options[quizState.selectedOption].rationale;
                  return typeof rat === 'string' ? rat : rat[rationaleLang];
                })(),
              }}
            />
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
