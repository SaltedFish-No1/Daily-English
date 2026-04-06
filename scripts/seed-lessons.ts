/**
 * Seed script: read merged daily lesson JSON files and insert into
 * Supabase lessons table (with JSONB paragraphs, focus_words, quiz_questions).
 *
 * Usage: npx tsx scripts/seed-lessons.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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
      // Build JSONB arrays
      const paragraphsJson = (lesson.article?.paragraphs ?? []).map(
        (p: { id: string; en: string; zh: string }) => ({
          key: p.id,
          en: p.en,
          zh: p.zh,
        })
      );

      const focusWordsJson = (lesson.focusWords ?? []).map(
        (fw: { key: string; forms: string[] }) => ({
          key: fw.key,
          forms: fw.forms,
        })
      );

      const quizQuestionsJson = (lesson.quiz?.questions ?? []).map(
        (q: QuizQuestion) => {
          const { id: qId, type, prompt, rationale, evidenceRefs, ...rest } = q;
          return {
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
          paragraphs: paragraphsJson,
          focus_words: focusWordsJson,
          quiz_questions: quizQuestionsJson,
        },
        { onConflict: 'date' }
      );

      if (lessonErr) throw lessonErr;

      console.log(
        `[OK] ${file} → ${paragraphsJson.length} paragraphs, ${focusWordsJson.length} words, ${quizQuestionsJson.length} questions`
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
