/**
 * @author SaltedFish-No1
 * @description 测验纯函数工具：总分计算、空答案检测与评分分发。
 */

import {
  AnyQuizQuestion,
  GradeResult,
  UserAnswer,
  isIELTSQuestion,
} from './types';
import {
  gradeCompletion,
  gradeLegacySingle,
  gradeMatchingFeatures,
  gradeMatchingHeadings,
  gradeMatchingInformation,
  gradeMultipleChoice,
  gradeTFNG,
} from './grading';

// 计算总分与得分。IELTS 题型按子项数动态计分（如匹配题按段落数），
// 旧版题固定 1 分。若已有评分结果则直接取 maxScore，避免重复计算。
export const computeTotals = (
  questions: AnyQuizQuestion[],
  grades: Record<string, GradeResult>,
  getQuestionId: (question: AnyQuizQuestion, idx: number) => string
): { score: number; total: number } => {
  const total = questions.reduce((acc, q, idx) => {
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
};

// 防止提交空答案——各 answer 变体的空判定逻辑各不相同。
export const isAnswerEmpty = (ans: UserAnswer | undefined): boolean => {
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

// 从 UserAnswer 联合体提取题型载荷后分发到对应评分函数。
export const gradeQuestion = (
  question: AnyQuizQuestion,
  questionId: string,
  answer: UserAnswer | undefined
): GradeResult => {
  if (!isIELTSQuestion(question)) {
    const selectedIndex =
      answer?.type === 'legacy_single' ? answer.payload.selectedIndex : null;
    return gradeLegacySingle(questionId, question, selectedIndex);
  }

  switch (question.type) {
    case 'tfng': {
      const selected = answer?.type === 'tfng' ? answer.payload.selected : null;
      return gradeTFNG(question, selected);
    }
    case 'multiple_choice': {
      const selectedOptionIds =
        answer?.type === 'multiple_choice'
          ? answer.payload.selectedOptionIds
          : [];
      return gradeMultipleChoice(question, selectedOptionIds);
    }
    case 'matching_headings': {
      const mapping =
        answer?.type === 'matching_headings' ? answer.payload.mapping : {};
      return gradeMatchingHeadings(question, mapping);
    }
    case 'matching_information': {
      const mapping =
        answer?.type === 'matching_information' ? answer.payload.mapping : {};
      return gradeMatchingInformation(question, mapping);
    }
    case 'matching_features': {
      const mapping =
        answer?.type === 'matching_features' ? answer.payload.mapping : {};
      return gradeMatchingFeatures(question, mapping);
    }
    case 'completion': {
      const blanks = answer?.type === 'completion' ? answer.payload.blanks : {};
      return gradeCompletion(question, blanks);
    }
  }
};
