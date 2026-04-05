/**
 * @author SaltedFish-No1
 * @description 本地 localStorage 数据迁移至 Supabase 云端：
 *   将 savedWords、history 和 quizProgress 批量 upsert。
 */

import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import type { VocabOccurrence, LessonHistory } from '@/store/useUserStore';

/** saved_words 表行的插入格式 */
interface SavedWordRow {
  user_id: string;
  word: string;
  lesson_slug: string;
  lesson_title: string | null;
  paragraph_index: number;
  saved_at: number;
  surface: string | null;
  sense_headword: string | null;
  sense_pos: string | null;
  sense_def: string | null;
  sense_phonetic: string | null;
  sense_audio: string | null;
}

/**
 * @author SaltedFish-No1
 * @description 将本地 savedWords 迁移到 Supabase saved_words 表。
 * @param userId 当前登录用户 ID。
 */
async function migrateSavedWords(userId: string) {
  const { savedWords } = useUserStore.getState();
  const rows: SavedWordRow[] = [];

  for (const [word, occurrences] of Object.entries(savedWords)) {
    for (const occ of occurrences) {
      rows.push({
        user_id: userId,
        word,
        lesson_slug: occ.lessonSlug,
        lesson_title: occ.lessonTitle ?? null,
        paragraph_index: occ.paragraphIndex,
        saved_at: occ.savedAt,
        surface: occ.surface ?? null,
        sense_headword: occ.senseSnapshot.headword ?? null,
        sense_pos: occ.senseSnapshot.pos ?? null,
        sense_def: occ.senseSnapshot.def ?? null,
        sense_phonetic: occ.senseSnapshot.phonetic ?? null,
        sense_audio: occ.senseSnapshot.audio ?? null,
      });
    }
  }

  if (rows.length === 0) return;

  // 每次最多 500 行，避免请求过大
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await supabase.from('saved_words').upsert(batch, {
      onConflict: 'user_id,word,lesson_slug,paragraph_index',
    });
  }
}

/**
 * @author SaltedFish-No1
 * @description 将本地 history 迁移到 Supabase lesson_history 表。
 * @param userId 当前登录用户 ID。
 */
async function migrateHistory(userId: string) {
  const { history } = useUserStore.getState();
  const rows = Object.values(history).map((h: LessonHistory) => ({
    user_id: userId,
    slug: h.slug,
    title: h.title,
    score: h.score,
    total: h.total,
    completed_at: h.completedAt,
  }));

  if (rows.length === 0) return;

  await supabase
    .from('lesson_history')
    .upsert(rows, { onConflict: 'user_id,slug' });
}

/**
 * @author SaltedFish-No1
 * @description 将本地 quizProgress 迁移到 Supabase quiz_progress 表。
 * @param userId 当前登录用户 ID。
 */
async function migrateQuizProgress(userId: string) {
  const { quizProgress } = useUserStore.getState();
  const rows = Object.entries(quizProgress).map(([key, state]) => ({
    user_id: userId,
    persist_key: key,
    state,
  }));

  if (rows.length === 0) return;

  await supabase
    .from('quiz_progress')
    .upsert(rows, { onConflict: 'user_id,persist_key' });
}

/**
 * @author SaltedFish-No1
 * @description 执行完整的本地数据→云端迁移流程。
 * @param userId 当前登录用户 ID。
 */
export async function migrateLocalDataToCloud(userId: string) {
  await Promise.all([
    migrateSavedWords(userId),
    migrateHistory(userId),
    migrateQuizProgress(userId),
  ]);
}

/**
 * @author SaltedFish-No1
 * @description 从 Supabase 拉取云端数据并合并到本地 store。
 * @param userId 当前登录用户 ID。
 */
export async function pullCloudDataToLocal(userId: string) {
  const [wordsRes, historyRes, quizRes] = await Promise.all([
    supabase.from('saved_words').select('*').eq('user_id', userId),
    supabase.from('lesson_history').select('*').eq('user_id', userId),
    supabase.from('quiz_progress').select('*').eq('user_id', userId),
  ]);

  const store = useUserStore.getState();

  // 合并 savedWords：以 savedAt 时间戳为准，保留最新
  if (wordsRes.data) {
    for (const row of wordsRes.data) {
      const occ: VocabOccurrence = {
        lessonSlug: row.lesson_slug,
        lessonTitle: row.lesson_title ?? undefined,
        paragraphIndex: row.paragraph_index,
        savedAt: row.saved_at,
        surface: row.surface ?? undefined,
        senseSnapshot: {
          headword: row.sense_headword ?? undefined,
          pos: row.sense_pos ?? undefined,
          def: row.sense_def ?? undefined,
          phonetic: row.sense_phonetic ?? undefined,
          audio: row.sense_audio ?? undefined,
        },
      };

      const key = row.word;
      const localOccs = store.savedWords[key] ?? [];
      const existingIdx = localOccs.findIndex(
        (o) =>
          o.lessonSlug === occ.lessonSlug &&
          o.paragraphIndex === occ.paragraphIndex
      );

      if (existingIdx >= 0) {
        // 保留更新的记录
        if (occ.savedAt > localOccs[existingIdx].savedAt) {
          store.upsertVocabOccurrence({
            word: key,
            lessonSlug: occ.lessonSlug,
            lessonTitle: occ.lessonTitle,
            paragraphIndex: occ.paragraphIndex,
            surface: occ.surface,
            senseSnapshot: occ.senseSnapshot,
          });
        }
      } else {
        store.upsertVocabOccurrence({
          word: key,
          lessonSlug: occ.lessonSlug,
          lessonTitle: occ.lessonTitle,
          paragraphIndex: occ.paragraphIndex,
          surface: occ.surface,
          senseSnapshot: occ.senseSnapshot,
        });
      }
    }
  }

  // 合并 history：保留最高分
  if (historyRes.data) {
    for (const row of historyRes.data) {
      const local = store.history[row.slug];
      if (!local || row.score > local.score) {
        store.saveLessonScore(row.slug, row.score, row.total, row.title);
      }
    }
  }

  // 合并 quizProgress：保留最近更新
  if (quizRes.data) {
    for (const row of quizRes.data) {
      const local = store.quizProgress[row.persist_key];
      if (!local) {
        store.setQuizProgress(row.persist_key, row.state);
      }
    }
  }
}
