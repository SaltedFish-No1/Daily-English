/**
 * @description 集中式 AI 模型配置 — 统一管理模型实例、中间件和 structuredOutputs。
 *
 * 所有 API 路由应从此模块导入模型，禁止直接调用 openai()。
 * 切换模型或供应商只需修改此文件。
 */

import { wrapLanguageModel } from 'ai';
import { openai } from '@ai-sdk/openai';
import { loggingMiddleware } from './ai-middleware';

/**
 * @ai-sdk/openai v3.0.50 默认启用 structuredOutputs，
 * 所有 generateObject / streamObject 调用自动使用 OpenAI 原生 JSON Schema 约束。
 *
 * 所有模型均包装了 loggingMiddleware，自动记录耗时和 token 用量。
 */

/** 快速模型 — 词典回退、简单文本提取等低复杂度场景 */
export const modelFast = wrapLanguageModel({
  model: openai('gpt-5.4-mini'),
  middleware: loggingMiddleware,
});

/** 强力模型 — 作文批改、复习文章生成、AI 对话辅导等高复杂度场景 */
export const modelPower = wrapLanguageModel({
  model: openai('gpt-5.4'),
  middleware: loggingMiddleware,
});

/** 视觉模型 — OCR、图片识别（语义别名，当前与 modelPower 同款） */
export const modelVision = wrapLanguageModel({
  model: openai('gpt-5.4'),
  middleware: loggingMiddleware,
});

/** TTS 语音模型 — 单词发音生成 */
export const modelSpeech = openai.speech('tts-1');
