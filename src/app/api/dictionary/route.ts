/**
 * @description 统一词典查询 API：DB 缓存 → dictionaryapi.dev → AI 生成。
 *   所有成功结果写入 Supabase dictionary_cache，下次直接返回。
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { modelFast } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  fetchDictionaryEntries,
  normalizeDictionaryQuery,
} from '@/lib/dictionary';
import { isDictionaryEntryComplete } from '@/lib/dictionary-quality';
import { DictionaryEntry } from '@/types/dictionary';

const DictionaryDefinitionSchema = z.object({
  definition: z.string(),
  example: z.string().nullable(),
  synonyms: z.array(z.string()),
  antonyms: z.array(z.string()),
});

const DictionaryMeaningSchema = z.object({
  partOfSpeech: z.string().nullable(),
  definitions: z.array(DictionaryDefinitionSchema),
  synonyms: z.array(z.string()),
  antonyms: z.array(z.string()),
});

const DictionaryEntrySchema = z.object({
  word: z.string(),
  phonetic: z.string().nullable(),
  phonetics: z.array(
    z.object({
      text: z.string().nullable(),
      audio: z.string().nullable(),
      sourceUrl: z.string().nullable(),
    })
  ),
  meanings: z.array(DictionaryMeaningSchema),
  sourceUrls: z.array(z.string()),
});

const AIResponseSchema = z.object({
  entries: z.array(DictionaryEntrySchema),
});

function extractAudioUrl(entries: DictionaryEntry[]): string | null {
  for (const entry of entries) {
    if (entry.audio) return entry.audio;
    for (const phonetic of entry.phonetics) {
      if (phonetic.audio) return phonetic.audio;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: { word?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const word = normalizeDictionaryQuery(body.word ?? '');
  if (!word) {
    return NextResponse.json({ error: 'Missing word' }, { status: 400 });
  }

  // 1. 查 Supabase 缓存
  const { data: cached } = await supabaseAdmin
    .from('dictionary_cache')
    .select('data, audio_url, source')
    .eq('word', word)
    .single();

  if (cached?.data) {
    return NextResponse.json({
      data: cached.data,
      source: 'cache',
      audioUrl: cached.audio_url,
    });
  }

  // 2. 请求 dictionaryapi.dev
  const apiResult = await fetchDictionaryEntries(word);

  if (
    apiResult.status === 'success' &&
    isDictionaryEntryComplete(apiResult.data)
  ) {
    const audioUrl = extractAudioUrl(apiResult.data!);

    // 写入缓存（后台，不阻塞响应）
    void supabaseAdmin.from('dictionary_cache').upsert(
      {
        word,
        data: apiResult.data,
        audio_url: audioUrl,
        source: 'dictionaryapi',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'word' }
    );

    return NextResponse.json({
      data: apiResult.data,
      source: 'dictionaryapi',
      audioUrl,
    });
  }

  // 3. AI Fallback
  try {
    const { object } = await generateObject({
      model: modelFast,
      schema: AIResponseSchema,
      prompt: `You are a professional English dictionary. Generate a complete dictionary entry for the word "${word}".

Include:
- Accurate IPA phonetic transcription
- All common parts of speech with definitions
- Example sentences for each definition
- Synonyms and antonyms where applicable

Return the data as a JSON object with an "entries" array. Each entry should have: word, phonetic (IPA), phonetics (array with text), meanings (array of objects with partOfSpeech, definitions, synonyms, antonyms), and sourceUrls (empty array).`,
    });

    const aiEntries: DictionaryEntry[] = object.entries.map((entry) => ({
      word: entry.word,
      phonetic: entry.phonetic ?? undefined,
      audio: undefined,
      phonetics: entry.phonetics.map((p) => ({
        text: p.text ?? undefined,
        audio: p.audio ?? undefined,
        sourceUrl: p.sourceUrl ?? undefined,
      })),
      meanings: entry.meanings.map((m) => ({
        partOfSpeech: m.partOfSpeech ?? undefined,
        definitions: m.definitions.map((d) => ({
          definition: d.definition,
          example: d.example ?? undefined,
          synonyms: d.synonyms,
          antonyms: d.antonyms,
        })),
        synonyms: m.synonyms,
        antonyms: m.antonyms,
      })),
      sourceUrls: entry.sourceUrls,
    }));

    if (aiEntries.length === 0) {
      return NextResponse.json(
        { data: null, source: 'ai_generated' },
        { status: 404 }
      );
    }

    // 写入缓存
    void supabaseAdmin.from('dictionary_cache').upsert(
      {
        word,
        data: aiEntries,
        audio_url: null,
        source: 'ai_generated',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'word' }
    );

    return NextResponse.json({
      data: aiEntries,
      source: 'ai_generated',
      audioUrl: null,
    });
  } catch (error) {
    console.error('[Dictionary AI Fallback] Error:', error);

    // 如果 dictionaryapi 有部分数据，仍然返回
    if (apiResult.data && apiResult.data.length > 0) {
      return NextResponse.json({
        data: apiResult.data,
        source: 'dictionaryapi',
        audioUrl: extractAudioUrl(apiResult.data),
      });
    }

    return NextResponse.json(
      { error: 'All dictionary sources failed' },
      { status: 502 }
    );
  }
}
