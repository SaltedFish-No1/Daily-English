'use client';

/**
 * @description 题型视图注册表，将 IELTS 题型映射到渲染组件。
 */

import { CompletionQuestionView } from './question-types/CompletionQuestionView';
import { MatchingFeaturesQuestionView } from './question-types/MatchingFeaturesQuestionView';
import { MatchingHeadingsQuestionView } from './question-types/MatchingHeadingsQuestionView';
import { MatchingInformationQuestionView } from './question-types/MatchingInformationQuestionView';
import { MultipleChoiceQuestionView } from './question-types/MultipleChoiceQuestionView';
import { TFNGQuestionView } from './question-types/TFNGQuestionView';

export const questionRendererRegistry = {
  tfng: TFNGQuestionView,
  matching_headings: MatchingHeadingsQuestionView,
  matching_information: MatchingInformationQuestionView,
  completion: CompletionQuestionView,
  matching_features: MatchingFeaturesQuestionView,
  multiple_choice: MultipleChoiceQuestionView,
} as const;
