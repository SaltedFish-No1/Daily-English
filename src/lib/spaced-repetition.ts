/**
 * @description 间隔重复算法（简化版 SM-2），适配"阅读复习"场景。
 *
 * 核心流程：
 *   收藏生词 → initReviewState() → 每次 Quiz 答题 → calculateNextReview(quality, state)
 *   → nextReviewAt 到期 → getWordsForReview() 选词 → AI 生成文章 → 循环
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WordReviewState {
  /** 当前间隔（天），初始值 1 */
  interval: number;
  /** 难度因子，初始值 2.5，最低 1.3 */
  easiness: number;
  /** 连续正确次数，初始值 0 */
  repetition: number;
  /** 下次复习时间戳（ms） */
  nextReviewAt: number;
  /** 上次复习时间戳（ms），0 表示从未复习 */
  lastReviewedAt: number;
  /** 总复习次数 */
  totalReviews: number;
  /** 总答对次数 */
  totalCorrect: number;
  /** 当前学习阶段 */
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_EASINESS = 1.3;
const INITIAL_EASINESS = 2.5;
const INITIAL_INTERVAL_DAYS = 1;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 连续正确次数达到此值且 interval ≥ 30 天时，状态升级为 mastered */
const MASTERY_REPETITIONS = 5;
const MASTERY_INTERVAL_DAYS = 30;

/** 一篇复习文章的目标词数 */
const DEFAULT_REVIEW_LIMIT = 12;

// ---------------------------------------------------------------------------
// Core Algorithm
// ---------------------------------------------------------------------------

/**
 * 创建一个新词的初始复习状态。
 * 收藏生词时调用，nextReviewAt 设为 1 天后。
 */
export function initReviewState(now: number = Date.now()): WordReviewState {
  return {
    interval: INITIAL_INTERVAL_DAYS,
    easiness: INITIAL_EASINESS,
    repetition: 0,
    nextReviewAt: now + INITIAL_INTERVAL_DAYS * MS_PER_DAY,
    lastReviewedAt: 0,
    totalReviews: 0,
    totalCorrect: 0,
    status: 'new',
  };
}

/**
 * SM-2 核心：根据答题质量更新复习状态。
 *
 * @param quality 答题质量评分 0-5：
 *   5 = 完美（答对且快速）
 *   4 = 正确（答对但有犹豫）
 *   3 = 勉强记住（答对但用了提示/被动复习）
 *   2 = 模糊记忆（答错但选了近义项）
 *   1 = 遗忘（完全答错）
 *   0 = 完全空白
 * @param state 当前复习状态
 * @param now 当前时间戳（便于测试注入）
 */
export function calculateNextReview(
  quality: number,
  state: WordReviewState,
  now: number = Date.now()
): WordReviewState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  // 更新 easiness factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEasiness = Math.max(
    MIN_EASINESS,
    state.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  const isCorrect = q >= 3;
  const totalReviews = state.totalReviews + 1;
  const totalCorrect = state.totalCorrect + (isCorrect ? 1 : 0);

  let newInterval: number;
  let newRepetition: number;

  if (isCorrect) {
    // 答对：递增间隔
    newRepetition = state.repetition + 1;

    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(state.interval * newEasiness);
    }
  } else {
    // 答错：重置间隔
    newRepetition = 0;
    newInterval = 1;
  }

  // 计算学习阶段
  let newStatus: WordReviewState['status'];
  if (
    newRepetition >= MASTERY_REPETITIONS &&
    newInterval >= MASTERY_INTERVAL_DAYS
  ) {
    newStatus = 'mastered';
  } else if (newInterval >= 7) {
    newStatus = 'reviewing';
  } else {
    newStatus = 'learning';
  }

  return {
    interval: newInterval,
    easiness: newEasiness,
    repetition: newRepetition,
    nextReviewAt: now + newInterval * MS_PER_DAY,
    lastReviewedAt: now,
    totalReviews,
    totalCorrect,
    status: newStatus,
  };
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * 判断一个词是否属于"待背"：
 *   1. 今日新加的词（status='new'，不论 nextReviewAt）
 *   2. 记忆曲线到期的历史词（nextReviewAt <= now，排除 mastered）
 */
function isDue(state: WordReviewState, now: number): boolean {
  if (state.status === 'mastered') return false;
  if (state.status === 'new') return true;
  return state.nextReviewAt <= now;
}

/**
 * 从所有词汇的复习状态中，筛选出待背的词。
 * 排序：新词优先，然后按过期紧急度排序（过期最久的优先），限制返回数量。
 */
export function getWordsForReview(
  states: Record<string, WordReviewState>,
  limit: number = DEFAULT_REVIEW_LIMIT,
  now: number = Date.now()
): string[] {
  return Object.entries(states)
    .filter(([, state]) => isDue(state, now))
    .sort((a, b) => {
      // 新词排在前面
      const aNew = a[1].status === 'new' ? 0 : 1;
      const bNew = b[1].status === 'new' ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew;
      // 同类按 nextReviewAt 升序（最紧急的优先）
      return a[1].nextReviewAt - b[1].nextReviewAt;
    })
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * 计算待背词总数（用于 UI 徽标显示）。
 */
export function countDueWords(
  states: Record<string, WordReviewState>,
  now: number = Date.now()
): number {
  return Object.values(states).filter((state) => isDue(state, now)).length;
}

/**
 * 计算词汇的"记忆强度"百分比（0-100），用于 UI 进度条。
 *
 * 基于 interval 和 repetition 的综合评估：
 * - new: 0%
 * - learning (interval 1-6): 10-40%
 * - reviewing (interval 7-29): 40-80%
 * - mastered: 100%
 */
export function getMemoryStrength(state: WordReviewState): number {
  if (state.status === 'mastered') return 100;
  if (state.status === 'new') return 0;

  // 基于 interval 的线性映射，上限 80%（mastered 才给 100%）
  const maxInterval = MASTERY_INTERVAL_DAYS;
  const intervalScore = Math.min(state.interval / maxInterval, 1) * 60;

  // 基于 repetition 的加成，最多 20%
  const repScore = Math.min(state.repetition / MASTERY_REPETITIONS, 1) * 20;

  return Math.round(Math.max(5, Math.min(80, intervalScore + repScore)));
}
