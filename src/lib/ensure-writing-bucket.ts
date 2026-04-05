/**
 * @description 确保 Supabase Storage 中的 writing-images 桶存在（公开读取）。
 *   首次上传时自动创建，后续调用直接跳过。
 */

import { supabaseAdmin } from '@/lib/supabase-server';

let bucketReady = false;

export async function ensureWritingBucket(): Promise<void> {
  if (bucketReady) return;

  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === 'writing-images');

  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket('writing-images', {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024, // 20 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });
    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to create writing-images bucket: ${error.message}`);
    }
  }

  bucketReady = true;
}
