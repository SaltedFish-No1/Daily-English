/**
 * @description 内存滑动窗口速率限制器 — 按用户 ID 限制每分钟请求数。
 *   无需外部依赖（Redis 等），部署重启后自动重置。
 */

import type { RateLimitResult } from '@/types/usage';

const WINDOW_MS = 60 * 1000; // 1 分钟滑动窗口
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分钟清理过期条目

/** userId → 请求时间戳数组 */
const windows = new Map<string, number[]>();

/**
 * 检查用户是否超出速率限制。
 * @param userId 用户 ID
 * @param maxPerMinute 每分钟最大请求数
 * @returns 检查结果：是否允许、剩余次数、重试等待时间
 */
export function checkRateLimit(
  userId: string,
  maxPerMinute: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let timestamps = windows.get(userId);
  if (!timestamps) {
    timestamps = [];
    windows.set(userId, timestamps);
  }

  // 清除滑动窗口外的旧时间戳
  const firstValid = timestamps.findIndex((t) => t > windowStart);
  if (firstValid > 0) {
    timestamps.splice(0, firstValid);
  } else if (firstValid === -1 && timestamps.length > 0) {
    timestamps.length = 0;
  }

  if (timestamps.length >= maxPerMinute) {
    // 最早的请求过期后即可重试
    const retryAfterMs = timestamps[0] + WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1),
      remaining: 0,
    };
  }

  timestamps.push(now);
  return {
    allowed: true,
    remaining: maxPerMinute - timestamps.length,
  };
}

// ---------------------------------------------------------------------------
// 定期清理：防止长时间运行后内存泄漏
// ---------------------------------------------------------------------------

function cleanup() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [userId, timestamps] of windows) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      windows.delete(userId);
    } else {
      windows.set(userId, valid);
    }
  }
}

// Node.js 环境下启动定时清理（unref 避免阻止进程退出）
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  if (typeof timer === 'object' && 'unref' in timer) {
    timer.unref();
  }
}

/** 仅供测试使用：重置所有窗口数据 */
export function _resetForTest(): void {
  windows.clear();
}
