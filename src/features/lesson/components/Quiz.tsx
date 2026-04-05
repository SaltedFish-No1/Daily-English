'use client';

/**
 * @description 测验引擎组件，管理答题流程、评分与成绩回顾。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LessonQuiz } from '@/types/lesson';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { QuestionRenderer } from './quiz/QuestionRenderer';
import { FullScreenCelebration } from './quiz/FullScreenCelebration';
import {
  AnyQuizQuestion,
  QuizPersistState,
  isIELTSQuestion,
  toStableQuestionId,
} from './quiz/types';
import { useUserStore } from '@/store/useUserStore';
import { buildReviewRows } from './quiz/buildReviewRows';
import {
  computeTotals,
  gradeQuestion,
  isAnswerEmpty,
} from './quiz/quizHelpers';

export interface QuizProps {
  quiz: LessonQuiz;
  persistKey: string;
  onComplete?: (score: number, total: number) => void;
  /** 复习课程的目标词列表（非空时显示复习成果小结） */
  reviewWords?: string[];
}

const initialQuizProgress: QuizPersistState = {
  currentIdx: 0,
  isFinished: false,
  answers: {},
  grades: {},
};

export const Quiz: React.FC<QuizProps> = ({
  quiz,
  persistKey,
  onComplete,
  reviewWords,
}) => {
  const questions = quiz.questions;
  const [showReview, setShowReview] = useState(false);
  const [rationaleLang, setRationaleLang] = useState<'en' | 'zh'>('en');
  const setQuizProgress = useUserStore((s) => s.setQuizProgress);
  const clearQuizProgress = useUserStore((s) => s.clearQuizProgress);

  const getQuestionId = useCallback(
    (question: AnyQuizQuestion, idx: number) => {
      if (isIELTSQuestion(question)) return question.id;
      return toStableQuestionId(idx);
    },
    []
  );

  const [quizState, setQuizState] = useState<QuizPersistState>(() => {
    const saved = useUserStore.getState().quizProgress[persistKey];
    if (
      !saved ||
      typeof saved.currentIdx !== 'number' ||
      typeof saved.isFinished !== 'boolean'
    ) {
      return initialQuizProgress;
    }
    return {
      currentIdx: Math.min(
        Math.max(saved.currentIdx, 0),
        Math.max(questions.length - 1, 0)
      ),
      isFinished: saved.isFinished,
      answers:
        saved.answers && typeof saved.answers === 'object' ? saved.answers : {},
      grades:
        saved.grades && typeof saved.grades === 'object' ? saved.grades : {},
    };
  });
  const safeCurrentIdx = Math.min(
    quizState.currentIdx,
    Math.max(questions.length - 1, 0)
  );
  const currentQuestion = questions[safeCurrentIdx];
  const currentQuestionId = getQuestionId(currentQuestion, safeCurrentIdx);
  const currentAnswer = quizState.answers[currentQuestionId];
  const currentGrade = quizState.grades[currentQuestionId];

  useEffect(() => {
    setQuizProgress(persistKey, quizState);
  }, [persistKey, quizState, setQuizProgress]);

  useEffect(() => {
    if (!quizState.isFinished) return;
    const { score, total } = computeTotals(
      questions,
      quizState.grades,
      getQuestionId
    );
    onComplete?.(score, total);
  }, [
    getQuestionId,
    onComplete,
    questions,
    quizState.grades,
    quizState.isFinished,
  ]);

  const labels = {
    completeTitle: '测验完成',
    retakeButtonLabel: '重新答题',
    scoreLabel: '得分',
    correctLabel: '回答正确',
    incorrectLabel: '回答错误',
    nextButtonLabel: '下一题',
    viewResultsButtonLabel: '查看结果',
    submitButtonLabel: '提交答案',
  };

  const handleNext = () => {
    if (safeCurrentIdx < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentIdx: prev.currentIdx + 1,
      }));
    } else {
      setQuizState((prev) => ({ ...prev, isFinished: true }));
    }
  };

  const handleRestart = () => {
    setQuizState(initialQuizProgress);
    setShowReview(false);
    clearQuizProgress(persistKey);
  };

  const { score, total } = useMemo(
    () => computeTotals(questions, quizState.grades, getQuestionId),
    [getQuestionId, questions, quizState.grades]
  );
  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
  const isPerfectScore = total > 0 && score === total;
  const scoreFeedback =
    scorePercent >= 90
      ? '表现非常优秀，继续保持。'
      : scorePercent >= 70
        ? '掌握较好，再复盘错题会更稳。'
        : scorePercent >= 50
          ? '基础已建立，建议回看文章后再刷一遍。'
          : '建议先回顾文章与词汇，再重新练习。';

  const reviewRows = useMemo(
    () =>
      buildReviewRows(
        questions,
        getQuestionId,
        quizState.answers,
        quizState.grades
      ),
    [getQuestionId, questions, quizState.answers, quizState.grades]
  );

  const handleSubmit = () => {
    const result = gradeQuestion(
      currentQuestion,
      currentQuestionId,
      quizState.answers[currentQuestionId]
    );
    setQuizState((prev) => ({
      ...prev,
      grades: {
        ...prev.grades,
        [currentQuestionId]: result,
      },
    }));
  };

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
                key={row.questionId}
                className={`rounded-2xl border p-5 ${
                  row.isCorrect
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <h3 className="mb-2 text-sm font-bold text-slate-900">
                  {row.questionText}
                </h3>
                <p className="mb-1 text-sm text-slate-700">
                  你的答案：{row.userAnswerText}
                </p>
                <p className="mb-2 text-sm text-slate-700">
                  正确答案：{row.correctAnswerText}
                </p>
                {row.rationale && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <>
        {isPerfectScore ? <FullScreenCelebration /> : null}
        <div className="flex min-h-[60vh] flex-col items-center justify-center border-gray-100 bg-white p-8 text-center sm:rounded-xl sm:border sm:shadow-sm">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50">
            <span className="text-4xl font-bold text-emerald-600">
              {score}/{total}
            </span>
          </div>
          <h2 className="mb-2 text-3xl font-bold text-slate-900">
            {labels.completeTitle}
          </h2>
          <p className="mb-6 max-w-sm text-slate-500">{scoreFeedback}</p>

          {/* 复习成果小结 */}
          {reviewWords && reviewWords.length > 0 && (
            <div className="mx-auto mb-8 w-full max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-left">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                复习成果
              </h3>
              {scorePercent >= 50 ? (
                <p className="mb-2 text-sm text-emerald-700">
                  ✅ {reviewWords.length} 个词已巩固
                  {scorePercent >= 80
                    ? '（间隔将延长）'
                    : '（下次复习间隔适度延长）'}
                </p>
              ) : (
                <p className="mb-2 text-sm text-amber-700">
                  ⚠️ {reviewWords.length} 个词需要加强（明天将再次出现）
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {reviewWords.slice(0, 10).map((w) => (
                  <span
                    key={w}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      scorePercent >= 50
                        ? 'border border-emerald-200 bg-white text-emerald-700'
                        : 'border border-amber-200 bg-white text-amber-700'
                    }`}
                  >
                    {w}
                  </span>
                ))}
                {reviewWords.length > 10 && (
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    +{reviewWords.length - 10}
                  </span>
                )}
              </div>
            </div>
          )}

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
      </>
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
            {labels.scoreLabel}: {score}
          </div>
        </div>
        <p className="text-sm text-slate-500 sm:text-base">
          {isIELTSQuestion(currentQuestion)
            ? currentQuestion.prompt
            : currentQuestion.q}
        </p>
      </div>

      <div className="mb-8">
        <QuestionRenderer
          question={currentQuestion}
          questionId={currentQuestionId}
          answer={currentAnswer}
          disabled={Boolean(currentGrade)}
          onAnswerChange={(next) =>
            setQuizState((prev) => ({
              ...prev,
              answers: {
                ...prev.answers,
                [currentQuestionId]: next,
              },
            }))
          }
        />
      </div>

      {currentGrade && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 rounded-2xl p-6 ${
            currentGrade.isCorrect
              ? 'border border-emerald-100 bg-emerald-50 text-emerald-800'
              : 'border border-red-100 bg-red-50 text-red-800'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-bold">
              {currentGrade.isCorrect
                ? `✅ ${labels.correctLabel}`
                : `❌ ${labels.incorrectLabel}`}
              <span className="ml-2 text-xs font-bold text-slate-600">
                {currentGrade.score}/{currentGrade.maxScore}
              </span>
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
          {(() => {
            const row = reviewRows.find(
              (r) => r.questionId === currentQuestionId
            );
            if (!row?.rationale) return null;
            const html =
              typeof row.rationale === 'string'
                ? row.rationale
                : row.rationale[rationaleLang];
            return (
              <div
                className="text-sm leading-relaxed italic opacity-90"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          })()}
        </motion.div>
      )}

      <div className="flex justify-end">
        <button
          onClick={currentGrade ? handleNext : handleSubmit}
          disabled={!currentGrade && isAnswerEmpty(currentAnswer)}
          className={`flex items-center gap-2 rounded-xl px-8 py-3 font-bold transition-all ${
            !currentGrade && isAnswerEmpty(currentAnswer)
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
          }`}
        >
          {currentGrade
            ? safeCurrentIdx === questions.length - 1
              ? labels.viewResultsButtonLabel
              : labels.nextButtonLabel
            : labels.submitButtonLabel}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
