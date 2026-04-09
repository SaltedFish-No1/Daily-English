/**
 * @description 用量管理相关类型定义 — 用户等级、API 配额、用量统计。
 */

/** 用户等级 */
export type UserTier = 'free' | 'pro';

/** 路由键名（用于用量记录与分析） */
export type RouteKey =
  | 'review-generate'
  | 'writing-grade'
  | 'writing-ocr'
  | 'writing-parse-topic-image'
  | 'writing-submit-vision'
  | 'photo-capture'
  | 'dictionary'
  | 'tts';

/** 单个等级的完整限额配置 */
export interface TierLimitConfig {
  /** 每分钟最大请求数 */
  ratePerMinute: number;
  /** 每日 AI token 总量上限（input + output） */
  dailyTokenLimit: number;
}

/** 限流等级配置映射 */
export type TierLimitsMap = Record<UserTier, TierLimitConfig>;

/** 速率限制检查结果 */
export interface RateLimitResult {
  allowed: boolean;
  /** 被拒绝时，建议等待的毫秒数 */
  retryAfterMs?: number;
  /** 当前窗口内剩余可用次数 */
  remaining: number;
}

/** 每日配额检查结果（仅基于 token） */
export interface QuotaCheckResult {
  allowed: boolean;
  currentTokens: number;
  maxTokens: number;
}

/** 单个路由的用量摘要（仅记录调用次数，用于分析） */
export interface RouteUsageSummary {
  calls: number;
}

/** GET /api/usage 响应体 */
export interface UsageResponse {
  tier: UserTier;
  today: {
    routes: Record<string, RouteUsageSummary>;
    totalTokens: number;
    maxTokens: number;
  };
}
