/**
 * Seed script: read merged daily lesson JSON files and upsert into Supabase.
 *
 * Prerequisites:
 *   - Run scripts/merge-meta.ts first so all files have schemaVersion 2.2.
 *   - The lessons table must exist (run scripts/create-lessons-table.sql).
 *   - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
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
const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));

async function seed() {
  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const slug = file.replace('.json', '');
    const filePath = path.join(lessonsDir, file);
    const lesson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const meta = lesson.meta;

    if (!meta?.id) {
      console.warn(`[SKIP] ${file} has no meta.id — run merge-meta first`);
      fail++;
      continue;
    }

    const { error } = await supabase.from('lessons').upsert(
      {
        id: meta.id,
        slug,
        title: meta.title,
        category: meta.category,
        teaser: meta.teaser,
        tag: meta.tag,
        difficulty: meta.difficulty,
        published: meta.published,
        featured: meta.featured,
        content: lesson,
      },
      { onConflict: 'slug' }
    );

    if (error) {
      console.error(`[FAIL] ${file}: ${error.message}`);
      fail++;
    } else {
      console.log(`[OK] ${file} → upserted (id: ${meta.id})`);
      ok++;
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${fail} failed out of ${files.length}.`);
}

seed();
