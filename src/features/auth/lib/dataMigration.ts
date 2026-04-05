/**
 * @author SaltedFish-No1
 * @description 本地 localStorage 数据迁移至 Supabase 云端：
 *   将 savedWords、history、quizProgress、wordReviewStates、
 *   preferences、writingDraft 批量 upsert。
 */

import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { usePreferenceStore } from '@/store/usePreferenceStore';
import { useWritingStore } from '@/store/useWritingStore';
import type { VocabOccurrence, LessonHistory } from '@/store/useUserStore';
import type { WordReviewState } from '@/lib/spaced-repetition';

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
  sense_def_zh: string | null;
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
        sense_def_zh: occ.senseSnapshot.defZh ?? null,
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
 * @description 将本地 wordReviewStates 迁移到 Supabase word_review_states 表。
 * @param userId 当前登录用户 ID。
 */
async function migrateWordReviewStates(userId: string) {
  const { wordReviewStates } = useUserStore.getState();
  const rows = Object.entries(wordReviewStates).map(([word, state]) => ({
    user_id: userId,
    word,
    interval_days: state.interval,
    easiness: state.easiness,
    repetition: state.repetition,
    next_review_at: state.nextReviewAt,
    last_reviewed_at: state.lastReviewedAt || null,
    total_reviews: state.totalReviews,
    total_correct: state.totalCorrect,
    status: state.status,
  }));

  if (rows.length === 0) return;

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await supabase
      .from('word_review_states')
      .upsert(batch, { onConflict: 'user_id,word' });
  }
}

/**
 * @description 将本地用户偏好迁移到 Supabase user_preferences 表。
 * @param userId 当前登录用户 ID。
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
 * @description 将本地写作草稿迁移到 Supabase writing_drafts 表。
 * @param userId 当前登录用户 ID。
 */
async function migrateWritingDraft(userId: string) {
  const { currentTopicId, currentDraftText } = useWritingStore.getState();
  if (!currentTopicId && !currentDraftText) return;

  await supabase.from('writing_drafts').upsert(
    {
      user_id: userId,
      topic_id: currentTopicId,
      draft_text: currentDraftText,
      updated_at: Date.now(),
    },
    { onConflict: 'user_id' }
  );
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
    migrateWordReviewStates(userId),
    migratePreferences(userId),
    migrateWritingDraft(userId),
  ]);
}

/**
 * @author SaltedFish-No1
 * @description 从 Supabase 拉取云端数据并合并到本地 store。
 * @param userId 当前登录用户 ID。
 */
export async function pullCloudDataToLocal(userId: string) {
  const [wordsRes, historyRes, quizRes, reviewRes, prefsRes, draftRes] =
    await Promise.all([
      supabase.from('saved_words').select('*').eq('user_id', userId),
      supabase.from('lesson_history').select('*').eq('user_id', userId),
      supabase.from('quiz_progress').select('*').eq('user_id', userId),
      supabase.from('word_review_states').select('*').eq('user_id', userId),
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('writing_drafts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
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
          defZh: row.sense_def_zh ?? undefined,
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

  // 合并 wordReviewStates：lastReviewedAt 更晚者胜出，相同则 repetition 高者胜出
  if (reviewRes.data) {
    for (const row of reviewRes.data) {
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

      const local = store.wordReviewStates[row.word];
      if (!local) {
        // 云端有、本地无：直接采用云端
        useUserStore.setState((state) => ({
          wordReviewStates: {
            ...state.wordReviewStates,
            [row.word]: cloudState,
          },
        }));
      } else {
        // 冲突解决：lastReviewedAt 更晚者胜出，相同则 repetition 高者胜出
        const cloudWins =
          cloudState.lastReviewedAt > local.lastReviewedAt ||
          (cloudState.lastReviewedAt === local.lastReviewedAt &&
            cloudState.repetition > local.repetition);
        if (cloudWins) {
          useUserStore.setState((state) => ({
            wordReviewStates: {
              ...state.wordReviewStates,
              [row.word]: cloudState,
            },
          }));
        }
      }
    }
  }

  // 合并 preferences：本地为默认值时采用云端
  if (prefsRes.data) {
    const cloud = prefsRes.data;
    const local = usePreferenceStore.getState();
    const localIsDefault =
      local.avatarUrl === '' &&
      local.nickname === '薄荷学员' &&
      local.examGoal === 'ielts' &&
      local.dailyGoal === 1 &&
      local.difficultyPref === 'auto';

    if (localIsDefault && cloud.updated_at > 0) {
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

  // 合并 writingDraft：本地为空时采用云端
  if (draftRes.data) {
    const cloud = draftRes.data;
    const local = useWritingStore.getState();
    const localIsEmpty = !local.currentTopicId && !local.currentDraftText;

    if (localIsEmpty && (cloud.topic_id || cloud.draft_text)) {
      useWritingStore.setState({
        currentTopicId: cloud.topic_id ?? null,
        currentDraftText: cloud.draft_text ?? '',
      });
    }
  }
}
