'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LessonQuiz } from '@/types/lesson';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { QuestionRenderer } from './quiz/QuestionRenderer';
import { FullScreenCelebration } from './quiz/FullScreenCelebration';
import {
  AnyQuizQuestion,
  GradeResult,
  QuizPersistState,
  ReviewRow,
  UserAnswer,
  isIELTSQuestion,
  toStableQuestionId,
} from './quiz/types';
import { useUserStore } from '@/store/useUserStore';
import {
  gradeCompletion,
  gradeLegacySingle,
  gradeMatchingFeatures,
  gradeMatchingHeadings,
  gradeMatchingInformation,
  gradeMultipleChoice,
  gradeTFNG,
} from './quiz/grading';

export interface QuizProps {
  quiz: LessonQuiz;
  persistKey: string;
  onComplete?: (score: number, total: number) => void;
}

const initialQuizProgress: QuizPersistState = {
  currentIdx: 0,
  isFinished: false,
  answers: {},
  grades: {},
};

export const Quiz: React.FC<QuizProps> = ({ quiz, persistKey, onComplete }) => {
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

  const computeTotals = useCallback(
    (qs: AnyQuizQuestion[], grades: Record<string, GradeResult>) => {
      const total = qs.reduce((acc, q, idx) => {
        const id = getQuestionId(q, idx);
        const g = grades[id];
        if (g) return acc + g.maxScore;
        if (isIELTSQuestion(q)) {
          switch (q.type) {
            case 'matching_headings':
              return acc + q.paragraphs.length;
            case 'matching_information':
              return acc + q.items.length;
            case 'matching_features':
              return acc + q.statements.length;
            case 'completion':
              return acc + q.blanks.length;
            default:
              return acc + 1;
          }
        }
        return acc + 1;
      }, 0);
      const score = Object.values(grades).reduce((acc, g) => acc + g.score, 0);
      return { score, total };
    },
    [getQuestionId]
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
    const { score, total } = computeTotals(questions, quizState.grades);
    onComplete?.(score, total);
  }, [
    computeTotals,
    onComplete,
    questions,
    quizState.grades,
    quizState.isFinished,
  ]);

  const labels = {
    completeTitle: '测验完成',
    retakeButtonLabel: '重新作答',
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
    () => computeTotals(questions, quizState.grades),
    [computeTotals, questions, quizState.grades]
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

  const reviewRows = useMemo(() => {
    return questions.map((question, idx) => {
      const id = getQuestionId(question, idx);
      const userAnswer = quizState.answers[id];
      const grade = quizState.grades[id];
      const isCorrect = grade?.isCorrect ?? false;

      if (!isIELTSQuestion(question)) {
        const selectedIndex =
          userAnswer?.type === 'legacy_single'
            ? userAnswer.payload.selectedIndex
            : null;
        const selected =
          typeof selectedIndex === 'number'
            ? question.options[selectedIndex]
            : null;
        const correctOption =
          question.options.find((option) => option.correct) ??
          question.options[0];
        return {
          questionId: id,
          questionText: question.q,
          userAnswerText: selected?.text ?? '未作答',
          correctAnswerText: correctOption?.text ?? '',
          rationale: selected?.rationale ?? correctOption?.rationale,
          isCorrect,
        } satisfies ReviewRow;
      }

      const q = question;
      switch (q.type) {
        case 'tfng': {
          const selected =
            userAnswer?.type === 'tfng' ? userAnswer.payload.selected : null;
          return {
            questionId: id,
            questionText: `${q.prompt}：${q.statement}`,
            userAnswerText: selected ?? '未作答',
            correctAnswerText: q.answer,
            rationale: q.rationale,
            isCorrect,
          } satisfies ReviewRow;
        }
        case 'multiple_choice': {
          const selectedIds =
            userAnswer?.type === 'multiple_choice'
              ? userAnswer.payload.selectedOptionIds
              : [];
          const selectedText = selectedIds
            .map((sid) => q.options.find((o) => o.id === sid)?.text ?? sid)
            .join('；');
          const correctText = q.correctOptionIds
            .map((sid) => q.options.find((o) => o.id === sid)?.text ?? sid)
            .join('；');
          return {
            questionId: id,
            questionText: q.prompt,
            userAnswerText: selectedText || '未作答',
            correctAnswerText: correctText,
            rationale: q.rationale,
            isCorrect,
          } satisfies ReviewRow;
        }
        case 'matching_headings': {
          const mapping =
            userAnswer?.type === 'matching_headings'
              ? userAnswer.payload.mapping
              : {};
          const userText = q.paragraphs
            .map((p) => `${p.label}→${mapping[p.id] ?? '∅'}`)
            .join('；');
          const correctText = q.paragraphs
            .map((p) => `${p.label}→${q.answerMap[p.id] ?? '∅'}`)
            .join('；');
          return {
            questionId: id,
            questionText: q.prompt,
            userAnswerText: userText || '未作答',
            correctAnswerText: correctText,
            rationale: q.rationale,
            isCorrect,
          } satisfies ReviewRow;
        }
        case 'matching_information': {
          const mapping =
            userAnswer?.type === 'matching_information'
              ? userAnswer.payload.mapping
              : {};
          const userText = q.items
            .map((it) => `${it.id}→${mapping[it.id] ?? '∅'}`)
            .join('；');
          const correctText = q.items
            .map((it) => {
              const correct = q.answerMap[it.id];
              const value = Array.isArray(correct)
                ? correct.join('/')
                : (correct ?? '∅');
              return `${it.id}→${value}`;
            })
            .join('；');
          return {
            questionId: id,
            questionText: q.prompt,
            userAnswerText: userText || '未作答',
            correctAnswerText: correctText,
            rationale: q.rationale,
            isCorrect,
          } satisfies ReviewRow;
        }
        case 'matching_features': {
          const mapping =
            userAnswer?.type === 'matching_features'
              ? userAnswer.payload.mapping
              : {};
          const userText = q.statements
            .map((s) => `${s.id}→${mapping[s.id] ?? '∅'}`)
            .join('；');
          const correctText = q.statements
            .map((s) => `${s.id}→${q.answerMap[s.id] ?? '∅'}`)
            .join('；');
          return {
            questionId: id,
            questionText: q.prompt,
            userAnswerText: userText || '未作答',
            correctAnswerText: correctText,
            rationale: q.rationale,
            isCorrect,
          } satisfies ReviewRow;
        }
        case 'completion': {
          const blanks =
            userAnswer?.type === 'completion' ? userAnswer.payload.blanks : {};
          const userText = q.blanks
            .map((b) => `${b.id}=${blanks[b.id] ?? '∅'}`)
            .join('；');
          const correctText = q.blanks
            .map((b) => `${b.id}=${b.acceptedAnswers.join('/')}`)
            .join('；');
          return {
            questionId: id,
            questionText: q.prompt,
            userAnswerText: userText || '未作答',
            correctAnswerText: correctText,
            rationale: q.rationale,
            isCorrect,
          } satisfies ReviewRow;
        }
      }
    });
  }, [getQuestionId, questions, quizState.answers, quizState.grades]);

  const isAnswerEmpty = (ans: UserAnswer | undefined) => {
    if (!ans) return true;
    switch (ans.type) {
      case 'legacy_single':
        return ans.payload.selectedIndex === null;
      case 'tfng':
        return ans.payload.selected === null;
      case 'multiple_choice':
        return ans.payload.selectedOptionIds.length === 0;
      case 'completion':
        return Object.values(ans.payload.blanks).every((v) => !v.trim());
      case 'matching_headings':
      case 'matching_information':
      case 'matching_features':
        return Object.keys(ans.payload.mapping).length === 0;
    }
  };

  const gradeCurrentQuestion = () => {
    const q = currentQuestion;
    const id = currentQuestionId;
    const ans = quizState.answers[id];

    if (!isIELTSQuestion(q)) {
      const selectedIndex =
        ans?.type === 'legacy_single' ? ans.payload.selectedIndex : null;
      return gradeLegacySingle(id, q, selectedIndex);
    }

    switch (q.type) {
      case 'tfng': {
        const selected = ans?.type === 'tfng' ? ans.payload.selected : null;
        return gradeTFNG(q, selected);
      }
      case 'multiple_choice': {
        const selectedOptionIds =
          ans?.type === 'multiple_choice' ? ans.payload.selectedOptionIds : [];
        return gradeMultipleChoice(q, selectedOptionIds);
      }
      case 'matching_headings': {
        const mapping =
          ans?.type === 'matching_headings' ? ans.payload.mapping : {};
        return gradeMatchingHeadings(q, mapping);
      }
      case 'matching_information': {
        const mapping =
          ans?.type === 'matching_information' ? ans.payload.mapping : {};
        return gradeMatchingInformation(q, mapping);
      }
      case 'matching_features': {
        const mapping =
          ans?.type === 'matching_features' ? ans.payload.mapping : {};
        return gradeMatchingFeatures(q, mapping);
      }
      case 'completion': {
        const blanks = ans?.type === 'completion' ? ans.payload.blanks : {};
        return gradeCompletion(q, blanks);
      }
    }
  };

  const handleSubmit = () => {
    const result = gradeCurrentQuestion();
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
