/**
 * @author SaltedFish-No1
 * @description 拍照取词共享工具 — 判断生词出处是否来自拍照取词功能。
 *   从 photo-capture feature 提升为共享代码，供 vocab 等多 feature 使用。
 */

/** 拍照取词课程标识前缀 */
export const PHOTO_CAPTURE_PREFIX = 'photo-capture-';

/**
 * @description 判断课程标识是否属于拍照取词来源。
 *
 * @param lessonSlug 课程标识字符串
 * @returns 是否为拍照取词出处
 */
export function isPhotoCaptureOccurrence(lessonSlug: string): boolean {
  return lessonSlug.startsWith(PHOTO_CAPTURE_PREFIX);
}
