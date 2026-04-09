/**
 * @author SaltedFish-No1
 * @description AI 中间件 — 为所有 AI 调用添加日志、耗时追踪、token 用量监控，
 *   并在设置用量上下文时自动记录 token 消耗到数据库。
 */

import { type LanguageModelMiddleware } from 'ai';
import { recordUsage } from '@/lib/usage';

// ---------------------------------------------------------------------------
// 用量上下文 — 由 API 路由在鉴权后设置，中间件在 AI 调用完成时自动记录
// ---------------------------------------------------------------------------

let _currentUsageCtx: { userId: string; routeKey: string } | null = null;

/** 设置当前请求的用量追踪上下文（在 AI 调用前设置） */
export function setUsageContext(userId: string, routeKey: string): void {
  _currentUsageCtx = { userId, routeKey };
}

/** 清除用量追踪上下文（在错误处理或请求结束时调用） */
export function clearUsageContext(): void {
  _currentUsageCtx = null;
}

/** 内部：消费上下文并记录 token 用量 */
function flushUsageContext(inTok: number | string, outTok: number | string) {
  if (!_currentUsageCtx) return;
  const ctx = _currentUsageCtx;
  _currentUsageCtx = null;

  const inputTokens = typeof inTok === 'number' ? inTok : 0;
  const outputTokens = typeof outTok === 'number' ? outTok : 0;
  if (inputTokens > 0 || outputTokens > 0) {
    recordUsage(ctx.userId, ctx.routeKey, inputTokens, outputTokens);
  }
}

// ---------------------------------------------------------------------------
// 日志 + 用量追踪中间件
// ---------------------------------------------------------------------------

export const loggingMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',

  wrapGenerate({ doGenerate, model }) {
    const start = Date.now();
    return doGenerate().then((result) => {
      const ms = Date.now() - start;
      const inTok = result.usage?.inputTokens?.total ?? '?';
      const outTok = result.usage?.outputTokens?.total ?? '?';
      console.log(
        `[AI] model=${model.modelId} elapsed=${ms}ms in=${inTok} out=${outTok}`
      );
      flushUsageContext(inTok, outTok);
      return result;
    });
  },

  wrapStream({ doStream, model }) {
    const start = Date.now();
    return doStream().then((result) => {
      const originalStream = result.stream;
      let inTok: number | string = '?';
      let outTok: number | string = '?';
      const loggingStream = originalStream.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            if (chunk.type === 'finish' && chunk.usage) {
              inTok = chunk.usage.inputTokens?.total ?? '?';
              outTok = chunk.usage.outputTokens?.total ?? '?';
            }
            controller.enqueue(chunk);
          },
          flush() {
            const ms = Date.now() - start;
            console.log(
              `[AI] stream model=${model.modelId} elapsed=${ms}ms in=${inTok} out=${outTok}`
            );
            flushUsageContext(inTok, outTok);
          },
        })
      );
      return { ...result, stream: loggingStream };
    });
  },
};
