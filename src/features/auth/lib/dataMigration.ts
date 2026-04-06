/**
 * @author SaltedFish-No1
 * @description 本地 localStorage 数据迁移至 Supabase 云端：
 *   将 savedWords + wordReviewStates（合并为 user_words）、
 *   history、preferences 批量 upsert。
 *   quiz_progress 和 writing_drafts 仅保留在 localStorage，不再云端同步。
 */

import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { usePreferenceStore } from '@/store/usePreferenceStore';
import type { VocabOccurrence, LessonHistory } from '@/store/useUserStore';
import type { WordReviewState } from '@/lib/spaced-repetition';

/**
 * 将本地 savedWords + wordReviewStates 合并迁移到 user_words 表。
 */
async function migrateUserWords(userId: string) {
  const { savedWords, wordReviewStates } = useUserStore.getState();

  // 收集所有需要同步的单词（savedWords 和 wordReviewStates 的并集）
  const allWords = new Set([
    ...Object.keys(savedWords),
    ...Object.keys(wordReviewStates),
  ]);

  if (allWords.size === 0) return;

  // 首先确保所有单词存在于 words 表中
  const wordTexts = Array.from(allWords);
  const wordRows = wordTexts.map((w) => ({
    word: w,
    meanings: [] as unknown[],
    source: 'cache',
  }));

  // 批量 upsert words 表（忽略冲突）
  const batchSize = 500;
  for (let i = 0; i < wordRows.length; i += batchSize) {
    const batch = wordRows.slice(i, i + batchSize);
    await supabase
      .from('words')
      .upsert(batch, { onConflict: 'word', ignoreDuplicates: true });
  }

  // 获取所有 word → id 的映射
  const { data: wordsData } = await supabase
    .from('words')
    .select('id, word')
    .in('word', wordTexts);

  if (!wordsData) return;

  const wordIdMap = new Map<string, string>();
  for (const row of wordsData) {
    wordIdMap.set(row.word, row.id);
  }

  // 构建 user_words 行
  interface UserWordRow {
    user_id: string;
    word_id: string;
    occurrences: unknown[];
    interval_days: number;
    easiness: number;
    repetition: number;
    next_review_at: number;
    last_reviewed_at: number | null;
    total_reviews: number;
    total_correct: number;
    status: string;
  }

  const rows: UserWordRow[] = [];

  for (const word of allWords) {
    const wordId = wordIdMap.get(word);
    if (!wordId) continue;

    const occurrences = savedWords[word] ?? [];
    const reviewState = wordReviewStates[word];

    const occurrencesJson = occurrences.map((occ: VocabOccurrence) => ({
      lesson_slug: occ.lessonSlug,
      lesson_title: occ.lessonTitle ?? null,
      paragraph_index: occ.paragraphIndex,
      saved_at: occ.savedAt,
      surface: occ.surface ?? null,
    }));

    rows.push({
      user_id: userId,
      word_id: wordId,
      occurrences: occurrencesJson,
      interval_days: reviewState?.interval ?? 1,
      easiness: reviewState?.easiness ?? 2.5,
      repetition: reviewState?.repetition ?? 0,
      next_review_at: reviewState?.nextReviewAt ?? 0,
      last_reviewed_at: reviewState?.lastReviewedAt || null,
      total_reviews: reviewState?.totalReviews ?? 0,
      total_correct: reviewState?.totalCorrect ?? 0,
      status: reviewState?.status ?? 'new',
    });
  }

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await supabase
      .from('user_words')
      .upsert(batch, { onConflict: 'user_id,word_id' });
  }
}

/**
 * @author SaltedFish-No1
 * @description 将本地 history 迁移到 Supabase lesson_history 表。
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
 * @description 将本地用户偏好迁移到 Supabase user_preferences 表。
 */
async function migratePreferences(userId: string) {
  const prefs = usePreferenceStore.getState();
  await supabase.from('user_preferences').upsert(
    {
      user_id: userId,
      avatar_url: prefs.avatarUrl,
      nickname: prefs.nickname,
      exam_goal: prefs.examGoal,
      learning_lang: prefs.learningLang,
      daily_goal: prefs.dailyGoal,
      difficulty_pref: prefs.difficultyPref,
      updated_at: Date.now(),
    },
    { onConflict: 'user_id' }
  );
}

/**
 * @author SaltedFish-No1
 * @description 执行完整的本地数据→云端迁移流程。
 */
export async function migrateLocalDataToCloud(userId: string) {
  await Promise.all([
    migrateUserWords(userId),
    migrateHistory(userId),
    migratePreferences(userId),
  ]);
}

/**
 * @author SaltedFish-No1
 * @description 从 Supabase 拉取云端数据并合并到本地 store。
 */
export async function pullCloudDataToLocal(userId: string) {
  const [userWordsRes, historyRes, prefsRes] = await Promise.all([
    supabase
      .from('user_words')
      .select('*, words!inner(word)')
      .eq('user_id', userId),
    supabase.from('lesson_history').select('*').eq('user_id', userId),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const store = useUserStore.getState();

  // 合并 user_words → savedWords + wordReviewStates
  if (userWordsRes.data) {
    for (const row of userWordsRes.data) {
      const wordText = (row.words as { word: string }).word;
      const occurrences = (row.occurrences ?? []) as Array<{
        lesson_slug: string;
        lesson_title: string | null;
        paragraph_index: number;
        saved_at: number;
        surface: string | null;
      }>;

      // 合并 occurrences 到 savedWords
      for (const occ of occurrences) {
        const localOccs = store.savedWords[wordText] ?? [];
        const existingIdx = localOccs.findIndex(
          (o) =>
            o.lessonSlug === occ.lesson_slug &&
            o.paragraphIndex === occ.paragraph_index
        );

        if (existingIdx >= 0) {
          if (occ.saved_at > localOccs[existingIdx].savedAt) {
            store.upsertVocabOccurrence({
              word: wordText,
              lessonSlug: occ.lesson_slug,
              lessonTitle: occ.lesson_title ?? undefined,
              paragraphIndex: occ.paragraph_index,
              surface: occ.surface ?? undefined,
              senseSnapshot: {},
            });
          }
        } else {
          store.upsertVocabOccurrence({
            word: wordText,
            lessonSlug: occ.lesson_slug,
            lessonTitle: occ.lesson_title ?? undefined,
            paragraphIndex: occ.paragraph_index,
            surface: occ.surface ?? undefined,
            senseSnapshot: {},
          });
        }
      }

      // 合并 review state
      const cloudState: WordReviewState = {
        interval: row.interval_days,
        easiness: row.easiness,
        repetition: row.repetition,
        nextReviewAt: row.next_review_at,
        lastReviewedAt: row.last_reviewed_at || 0,
        totalReviews: row.total_reviews,
        totalCorrect: row.total_correct,
        status: row.status,
      };

      const local = store.wordReviewStates[wordText];
      if (!local) {
        useUserStore.setState((state) => ({
          wordReviewStates: {
            ...state.wordReviewStates,
            [wordText]: cloudState,
          },
        }));
      } else {
        const cloudWins =
          cloudState.lastReviewedAt > local.lastReviewedAt ||
          (cloudState.lastReviewedAt === local.lastReviewedAt &&
            cloudState.repetition > local.repetition);
        if (cloudWins) {
          useUserStore.setState((state) => ({
            wordReviewStates: {
              ...state.wordReviewStates,
              [wordText]: cloudState,
            },
          }));
        }
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

  // 从云端恢复 preferences
  if (prefsRes.data) {
    const cloud = prefsRes.data;
    usePreferenceStore.setState({
      avatarUrl: cloud.avatar_url ?? '',
      nickname: cloud.nickname ?? '薄荷学员',
      examGoal: cloud.exam_goal ?? 'ielts',
      learningLang: cloud.learning_lang ?? 'en',
      dailyGoal: cloud.daily_goal ?? 1,
      difficultyPref: cloud.difficulty_pref ?? 'auto',
    });
  }
}
