/**
 * Seed script: read merged daily lesson JSON files and insert into
 * normalized Supabase tables (lessons, lesson_paragraphs,
 * lesson_focus_words, lesson_quiz_questions).
 *
 * Usage: npx tsx scripts/seed-lessons.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const lessonsDir = path.resolve(__dirname, '..', 'data', 'lessons');
const files = fs.readdirSync(lessonsDir).filter((f: string) => f.endsWith('.json'));

interface QuizQuestion {
  id: string;
  type: string;
  prompt: string;
  rationale?: { en: string; zh: string };
  evidenceRefs?: string[];
  [key: string]: unknown;
}

async function seed() {
  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const date = file.replace('.json', '');
    const filePath = path.join(lessonsDir, file);
    const lesson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const meta = lesson.meta;

    if (!meta?.id) {
      console.warn(`[SKIP] ${file} has no meta.id — run merge-meta first`);
      fail++;
      continue;
    }

    try {
      // --- 1. Upsert main lesson row ---
      const { error: lessonErr } = await supabase.from('lessons').upsert(
        {
          id: meta.id,
          date,
          title: meta.title,
          category: meta.category,
          teaser: meta.teaser,
          tag: meta.tag,
          difficulty: meta.difficulty,
          published: meta.published,
          featured: meta.featured,
          speech_enabled: lesson.speech?.enabled ?? true,
          article_title: lesson.article?.title ?? meta.title,
          quiz_title: lesson.quiz?.title ?? 'Knowledge Check',
        },
        { onConflict: 'date' }
      );
      if (lessonErr) throw lessonErr;

      const lessonId = meta.id;

      // --- 2. Delete old child rows (idempotent re-seed) ---
      await supabase
        .from('lesson_quiz_questions')
        .delete()
        .eq('lesson_id', lessonId);
      await supabase
        .from('lesson_focus_words')
        .delete()
        .eq('lesson_id', lessonId);
      await supabase
        .from('lesson_paragraphs')
        .delete()
        .eq('lesson_id', lessonId);

      // --- 3. Insert paragraphs ---
      const paragraphs = (lesson.article?.paragraphs ?? []).map(
        (p: { id: string; en: string; zh: string }, i: number) => ({
          lesson_id: lessonId,
          position: i,
          key: p.id,
          en: p.en,
          zh: p.zh,
        })
      );
      if (paragraphs.length > 0) {
        const { error: pErr } = await supabase
          .from('lesson_paragraphs')
          .insert(paragraphs);
        if (pErr) throw pErr;
      }

      // --- 4. Insert focus words ---
      const focusWords = (lesson.focusWords ?? []).map(
        (fw: { key: string; forms: string[] }, i: number) => ({
          lesson_id: lessonId,
          position: i,
          key: fw.key,
          forms: fw.forms,
        })
      );
      if (focusWords.length > 0) {
        const { error: fwErr } = await supabase
          .from('lesson_focus_words')
          .insert(focusWords);
        if (fwErr) throw fwErr;
      }

      // --- 5. Insert quiz questions ---
      const questions = (lesson.quiz?.questions ?? []).map(
        (q: QuizQuestion, i: number) => {
          const { id: qId, type, prompt, rationale, evidenceRefs, ...rest } = q;
          return {
            lesson_id: lessonId,
            position: i,
            question_key: qId,
            question_type: type,
            prompt,
            rationale_en: rationale?.en ?? null,
            rationale_zh: rationale?.zh ?? null,
            evidence_refs: evidenceRefs ?? [],
            payload: rest,
          };
        }
      );
      if (questions.length > 0) {
        const { error: qErr } = await supabase
          .from('lesson_quiz_questions')
          .insert(questions);
        if (qErr) throw qErr;
      }

      console.log(
        `[OK] ${file} → ${paragraphs.length} paragraphs, ${focusWords.length} words, ${questions.length} questions`
      );
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error(`[FAIL] ${file}: ${msg}`);
      fail++;
    }
  }

  console.log(
    `\nDone. ${ok} succeeded, ${fail} failed out of ${files.length}.`
  );
}

seed();
