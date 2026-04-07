/**
 * @author SaltedFish-No1
 * @description 客户端环境变量集中管理 — 定义、校验并导出所有 NEXT_PUBLIC_* 变量。
 *   Next.js 在构建时将 NEXT_PUBLIC_* 内联为字面量，因此可立即解析。
 *   业务代码应从此模块读取客户端环境变量，禁止直接 process.env。
 */

import { z } from 'zod';

/** 客户端环境变量 Zod schema */
const clientEnvSchema = z.object({
  /** Supabase 项目 URL */
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  /** Supabase 匿名密钥（回退键） */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  /** Supabase 新版公开密钥（优先使用，可选） */
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().optional(),
  /** Sentry DSN（可选，仅 production 启用） */
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

/** @description 客户端环境变量解析后的类型 */
type ClientEnvRaw = z.infer<typeof clientEnvSchema>;

/**
 * @description 解析客户端环境变量，非 production 环境校验失败时回退到占位值。
 * @returns 校验后的客户端环境变量对象
 */
function parseClientEnv(): ClientEnvRaw {
  // NOTE(SaltedFish-No1): 必须逐个显式引用 process.env.NEXT_PUBLIC_*，
  //   Next.js 只对字面量 key 做静态替换，动态取值不会被内联。
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  const result = clientEnvSchema.safeParse(raw);
  if (result.success) return result.data;

  // next build 阶段 NODE_ENV=production 但 NEXT_PHASE 为构建标识，
  // 此时客户端变量可能尚未注入，需要回退到占位值以免阻断构建。
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    console.error(
      '[env/client] 缺少必需的客户端环境变量:',
      result.error.format()
    );
    throw new Error('Missing required client environment variables');
  }

  console.warn('[env/client] 校验失败，使用占位值:', result.error.format());
  return {
    NEXT_PUBLIC_SUPABASE_URL:
      raw.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      raw.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      raw.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    NEXT_PUBLIC_SENTRY_DSN: raw.NEXT_PUBLIC_SENTRY_DSN,
  };
}

const parsed = parseClientEnv();

/**
 * @description 客户端环境变量统一入口。
 *   包含原始校验值及派生的 supabaseAnonKey 便捷属性。
 */
export const clientEnv = {
  ...parsed,
  /** 优先取 PUBLISHABLE_DEFAULT_KEY，回退到 ANON_KEY */
  get supabaseAnonKey(): string {
    return (
      parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  },
};
