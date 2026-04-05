/**
 * @author SaltedFish-No1
 * @description OTP 工具函数：生成、哈希、timing-safe 比较。
 */

import { randomInt, createHash, timingSafeEqual } from 'crypto';

/** 生成 6 位数字验证码。 */
export function generateOtp(): string {
  return String(randomInt(100_000, 999_999));
}

/** 返回给定字符串的 SHA-256 十六进制摘要。 */
export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** timing-safe 比较明文验证码与存储的哈希值。 */
export function verifyOtpHash(code: string, storedHash: string): boolean {
  const codeHash = Buffer.from(hashOtp(code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (codeHash.length !== stored.length) return false;
  return timingSafeEqual(codeHash, stored);
}
