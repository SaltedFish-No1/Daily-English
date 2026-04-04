/**
 * @description 将各题型的 UserAnswer 联合体序列化为中文可读的回顾行（ReviewRow）。
 */

import {
  AnyQuizQuestion,
  GradeResult,
  ReviewRow,
  UserAnswer,
  isIELTSQuestion,
} from './types';

/**
 * 为每道题构建回顾行：提取用户答案和正确答案的文本表示。
 * 每个 switch 分支处理不同答案形状（mapping / blanks / selectedIndex 等）。
 */
export const buildReviewRows = (
  questions: AnyQuizQuestion[],
  getQuestionId: (question: AnyQuizQuestion, idx: number) => string,
  answers: Record<string, UserAnswer>,
  grades: Record<string, GradeResult>
): ReviewRow[] => {
  return questions.map((question, idx) => {
    const id = getQuestionId(question, idx);
    const userAnswer = answers[id];
    const grade = grades[id];
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
};
