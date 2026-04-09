/**
 * @author SaltedFish-No1
 * @description AI 中间件 — 为所有 AI 调用添加日志、耗时追踪和 token 用量监控。
 */

import { type LanguageModelMiddleware } from 'ai';

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
          },
        })
      );
      return { ...result, stream: loggingStream };
    });
  },
};
