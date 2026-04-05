/**
 * One-time script: merge metadata from data/lessons.json into each daily
 * lesson file's `meta` object and bump schemaVersion to 2.2.
 *
 * Usage: npx tsx scripts/merge-meta.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface LessonListItem {
  date: string;
  path: string;
  title: string;
  category: string;
  teaser: string;
  published: boolean;
  featured: boolean;
  tag: string;
  difficulty: string;
}

const dataDir = path.resolve(__dirname, '..', 'data');
const lessonsJsonPath = path.join(dataDir, 'lessons.json');
const lessonsDirPath = path.join(dataDir, 'lessons');

const lessonsIndex: { lessons: LessonListItem[] } = JSON.parse(
  fs.readFileSync(lessonsJsonPath, 'utf8')
);

const metaByDate = new Map<string, LessonListItem>();
for (const item of lessonsIndex.lessons) {
  metaByDate.set(item.date, item);
}

const files = fs.readdirSync(lessonsDirPath).filter((f) => f.endsWith('.json'));

let updated = 0;
for (const file of files) {
  const date = file.replace('.json', '');
  const filePath = path.join(lessonsDirPath, file);
  const lesson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const meta = metaByDate.get(date);
  if (!meta) {
    console.warn(`[SKIP] No metadata found in lessons.json for ${date}`);
    continue;
  }

  lesson.schemaVersion = '2.2';
  lesson.meta = {
    id: crypto.randomUUID(),
    title: lesson.meta?.title ?? meta.title,
    date: meta.date,
    category: meta.category,
    teaser: meta.teaser,
    published: meta.published,
    featured: meta.featured,
    tag: meta.tag,
    difficulty: meta.difficulty,
  };

  fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n', 'utf8');
  console.log(`[OK] ${file} → meta merged (id: ${lesson.meta.id})`);
  updated++;
}

console.log(`\nDone. Updated ${updated}/${files.length} files.`);
