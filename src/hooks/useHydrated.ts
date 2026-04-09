/**
 * @author SaltedFish-No1
 * @description 客户端水合检测 Hook — 使用 useSyncExternalStore 安全判断是否已在客户端渲染。
 */

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * @description 返回 true 表示当前处于客户端渲染（已完成水合），false 表示 SSR 或水合前。
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
