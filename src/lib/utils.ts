/**
 * @author SaltedFish-No1
 * @description 通用工具函数集合，提供 Tailwind 类名合并等基础能力。
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
