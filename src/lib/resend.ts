/**
 * @author SaltedFish-No1
 * @description Resend 邮件客户端单例，仅用于服务端 API Route Handler。
 */

import { Resend } from 'resend';

let _client: Resend | null = null;

/** 延迟初始化 Resend 客户端，避免构建阶段读取未设置的环境变量。 */
export function getResend(): Resend {
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
