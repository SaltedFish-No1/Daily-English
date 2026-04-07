/**
 * @author SaltedFish-No1
 * @description 服务端环境变量集中管理 — 定义、校验并导出所有仅服务端可用的变量。
 *   采用 Proxy 延迟校验，首次访问属性时才解析，避免构建阶段因变量缺失而报错。
 *   业务代码应从此模块读取服务端环境变量，禁止直接 process.env。
 *
 *   ⚠️ 严禁在客户端组件中导入此模块，否则可能泄露服务端密钥。
 */

import { z } from 'zod';

export { clientEnv } from './client';

/** 服务端环境变量 Zod schema */
const serverEnvSchema = z.object({
  /** Supabase service role 密钥，用于绕过 RLS */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  /** OpenAI API 密钥（@ai-sdk/openai 自动从 env 读取，此处仅做校验） */
  OPENAI_API_KEY: z.string().min(1),
  /** Resend 邮件服务 API 密钥 */
  RESEND_API_KEY: z.string().min(1),
  /** 发件人邮箱地址 */
  RESEND_FROM_EMAIL: z.string().min(1),
  /** 应用根 URL，用于邮件中的链接拼接（可选，默认 localhost） */
  APP_URL: z.string().optional(),
});

/** @description 服务端环境变量解析后的类型 */
type ServerEnvRaw = z.infer<typeof serverEnvSchema>;

/** @description serverEnv 对外暴露的类型，包含派生属性 */
type ServerEnvWithComputed = ServerEnvRaw & {
  /** 应用根 URL，缺省时回退到 http://localhost:3000 */
  appUrl: string;
};

let _cached: ServerEnvRaw | null = null;

/**
 * @description 解析并缓存服务端环境变量（仅在首次调用时执行）。
 * @returns 校验后的服务端环境变量对象
 * @throws {Error} 校验失败时抛出，附带详细错误信息
 */
function getServerEnv(): ServerEnvRaw {
  if (!_cached) {
    const raw = {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      APP_URL: process.env.APP_URL,
    };
    _cached = serverEnvSchema.parse(raw);
  }
  return _cached;
}

/**
 * @description 服务端环境变量统一入口（Proxy 延迟初始化）。
 *   首次访问任意属性时触发 Zod 校验，校验失败立即抛出错误。
 *   包含派生属性 appUrl，缺省时回退到 http://localhost:3000。
 */
export const serverEnv = new Proxy({} as ServerEnvWithComputed, {
  get(_target, prop: string) {
    if (prop === 'appUrl') {
      return getServerEnv().APP_URL || 'http://localhost:3000';
    }
    return getServerEnv()[prop as keyof ServerEnvRaw];
  },
});
