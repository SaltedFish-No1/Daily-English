/**
 * @author SaltedFish-No1
 * @description 数据同步调度 Hook：监听鉴权状态变化，
 *   在用户登录后自动执行 localStorage → Supabase 数据迁移与合并。
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  migrateLocalDataToCloud,
  pullCloudDataToLocal,
} from '@/features/auth/lib/dataMigration';

/**
 * @author SaltedFish-No1
 * @description 在鉴权状态变化时自动触发数据同步。
 *   首次登录：上传本地数据到云端。
 *   非首次登录：拉取云端数据合并到本地。
 */
export function useDataSync() {
  const { user, isLoading } = useAuthStore();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) {
      syncedUserIdRef.current = null;
      return;
    }

    // 已经为该用户同步过，跳过
    if (syncedUserIdRef.current === user.id) return;
    syncedUserIdRef.current = user.id;

    const sync = async () => {
      try {
        // 先上传本地数据（upsert 不会覆盖更新的云端记录）
        await migrateLocalDataToCloud(user.id);
        // 再拉取云端数据合并到本地
        await pullCloudDataToLocal(user.id);
      } catch (err) {
        console.error('[DataSync] 数据同步失败:', err);
      }
    };

    sync();
  }, [user, isLoading]);
}
