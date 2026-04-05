/**
 * @description React-Compiler-safe hook to get a "now" timestamp.
 *
 * Uses useSyncExternalStore so that Date.now() is read as an external store
 * snapshot, which the React Compiler considers pure. Refreshes every `intervalMs`.
 */

import { useSyncExternalStore } from 'react';

let cachedNow = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureInterval(ms: number) {
  if (intervalId) return;
  intervalId = setInterval(() => {
    cachedNow = Date.now();
    listeners.forEach((fn) => fn());
  }, ms);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  ensureInterval(60_000);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot() {
  return cachedNow;
}

/**
 * Returns a timestamp that updates every ~60 seconds.
 * Safe for use in render and useMemo deps.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
