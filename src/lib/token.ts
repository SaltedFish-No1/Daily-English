/**
 * @author SaltedFish-No1
 * @description Token 工具函数：生成安全随机 token、哈希、timing-safe 比较。
 *   用于邮件链接验证（如密码重置）。
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/** 生成 32 字节随机 token（64 位十六进制字符串）。 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/** 返回给定 token 的 SHA-256 十六进制摘要。 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** timing-safe 比较明文 token 与存储的哈希值。 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  const tokenHash = Buffer.from(hashToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (tokenHash.length !== stored.length) return false;
  return timingSafeEqual(tokenHash, stored);
}
