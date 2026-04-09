/**
 * @author SaltedFish-No1
 * @description 用户反馈功能类型定义。
 */

/** 反馈类型枚举 */
export type FeedbackType = 'bug' | 'feature' | 'other';

/** 反馈类型选项（中文标签） */
export const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: '问题报告' },
  { value: 'feature', label: '功能建议' },
  { value: 'other', label: '其他' },
];

/** 反馈类型 → 中文标签映射 */
export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  bug: '问题报告',
  feature: '功能建议',
  other: '其他',
};

/** 用户提交的反馈数据 */
export interface FeedbackPayload {
  type: FeedbackType;
  content: string;
  contact?: string;
}

/** 自动采集的反馈上下文 */
export interface FeedbackContext {
  url: string;
  userAgent: string;
  userId?: string;
  timestamp: string;
}
