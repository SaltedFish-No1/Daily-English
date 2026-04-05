/**
 * @description 统一词典查询 API：DB 缓存 → dictionaryapi.dev → AI 生成。
 *   所有成功结果写入 Supabase dictionary_cache，下次直接返回。
 */

import { after, NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { modelFast } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireApiAuth } from '@/lib/api-auth';
import {
  fetchDictionaryEntries,
  normalizeDictionaryQuery,
} from '@/lib/dictionary';
import { isDictionaryEntryComplete } from '@/lib/dictionary-quality';
import { DictionaryEntry } from '@/types/dictionary';

const DictionaryDefinitionSchema = z.object({
  definition: z.string(),
  definitionZh: z.string().nullable(),
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

/** 检查词典条目是否已包含中文释义 */
function hasChinese(entries: DictionaryEntry[]): boolean {
  return entries.some((e) =>
    e.meanings.some((m) => m.definitions.some((d) => Boolean(d.definitionZh)))
  );
}

/** 中文释义补全：调用 GPT 为已有英文释义生成对应中文翻译 */
const ChineseEnrichmentSchema = z.object({
  meanings: z.array(
    z.object({
      partOfSpeech: z.string(),
      definitions: z.array(
        z.object({
          original: z.string(),
          definitionZh: z.string(),
        })
      ),
    })
  ),
});

async function enrichWithChinese(
  word: string,
  entries: DictionaryEntry[]
): Promise<DictionaryEntry[]> {
  const primaryEntry = entries[0];
  if (!primaryEntry) return entries;

  try {
    const { object } = await generateObject({
      model: modelFast,
      schema: ChineseEnrichmentSchema,
      prompt: `You are a bilingual English-Chinese dictionary assistant.

Given the following English dictionary entry for the word "${word}", provide an accurate, natural Chinese translation for each definition.

${JSON.stringify(
  primaryEntry.meanings.map((m) => ({
    partOfSpeech: m.partOfSpeech,
    definitions: m.definitions.map((d) => d.definition),
  })),
  null,
  2
)}

Rules:
- Translate each definition into concise, natural Chinese (中文释义)
- Match the register and specificity of the English definition
- For technical terms, use the standard Chinese terminology
- Keep translations brief (typically 5-20 Chinese characters)
- Echo back the original English definition exactly in the "original" field so translations can be aligned
- Return one meanings array matching the structure above`,
    });

    // 按位置对齐合并中文释义，回退到文本匹配
    return entries.map((entry, entryIndex) => {
      if (entryIndex !== 0) return entry;
      return {
        ...entry,
        meanings: entry.meanings.map((meaning, mIdx) => {
          const aiMeaning = object.meanings[mIdx];
          return {
            ...meaning,
            definitions: meaning.definitions.map((def, dIdx) => {
              // 优先位置匹配
              const aiDef = aiMeaning?.definitions[dIdx];
              if (aiDef) {
                return { ...def, definitionZh: aiDef.definitionZh };
              }
              // 回退：按原文文本匹配
              const textMatch = aiMeaning?.definitions.find(
                (ad) => ad.original === def.definition
              );
              if (textMatch) {
                return { ...def, definitionZh: textMatch.definitionZh };
              }
              return def;
            }),
          };
        }),
      };
    });
  } catch (error) {
    console.error('[Dictionary Chinese Enrichment] Error:', error);
    return entries;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request);
  if ('error' in auth) return auth.error;

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

  if (cached?.data && hasChinese(cached.data as DictionaryEntry[])) {
    return NextResponse.json({
      data: cached.data,
      source: 'cache',
      audioUrl: cached.audio_url,
      zhStatus: 'full',
    });
  }

  // 缓存命中但无中文释义，保留作为基础数据待补全
  const baseEntries = cached?.data as DictionaryEntry[] | null;

  // 2. 请求 dictionaryapi.dev（若无缓存基础数据）
  let entriesToEnrich: DictionaryEntry[] | null = baseEntries;
  let audioUrl: string | null = cached?.audio_url ?? null;
  let source: string = cached?.source ?? 'dictionaryapi';

  if (!entriesToEnrich) {
    const apiResult = await fetchDictionaryEntries(word);

    if (
      apiResult.status === 'success' &&
      isDictionaryEntryComplete(apiResult.data)
    ) {
      entriesToEnrich = apiResult.data;
      audioUrl = extractAudioUrl(apiResult.data!);
      source = 'dictionaryapi';
    }
  }

  // 2.5 有英文数据：立即返回，后台异步补全中文释义并写缓存
  if (entriesToEnrich && entriesToEnrich.length > 0) {
    after(async () => {
      try {
        const enriched = await enrichWithChinese(word, entriesToEnrich);
        await supabaseAdmin.from('dictionary_cache').upsert(
          {
            word,
            data: enriched,
            audio_url: audioUrl,
            source,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'word' }
        );
      } catch (error) {
        console.error('[Dictionary after() enrichment] Error:', error);
        // 写入无中文版本，下次查询时重试补全
        await supabaseAdmin.from('dictionary_cache').upsert(
          {
            word,
            data: entriesToEnrich,
            audio_url: audioUrl,
            source,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'word' }
        );
      }
    });

    return NextResponse.json({
      data: entriesToEnrich,
      source,
      audioUrl,
      zhStatus: 'pending',
    });
  }

  // 3. AI Fallback
  try {
    const { object } = await generateObject({
      model: modelFast,
      schema: AIResponseSchema,
      prompt: `You are a professional bilingual English-Chinese dictionary. Generate a complete dictionary entry for the word "${word}".

Include:
- Accurate IPA phonetic transcription
- All common parts of speech with definitions
- Example sentences for each definition
- Synonyms and antonyms where applicable
- For each definition, also provide a concise Chinese translation in the "definitionZh" field (typically 5-20 Chinese characters, natural and accurate)

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
          definitionZh: d.definitionZh ?? undefined,
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
      zhStatus: 'full',
    });
  } catch (error) {
    console.error('[Dictionary AI Fallback] Error:', error);

    // 如果 dictionaryapi 有部分数据，仍然返回（无中文）
    if (entriesToEnrich && entriesToEnrich.length > 0) {
      return NextResponse.json({
        data: entriesToEnrich,
        source,
        audioUrl,
        zhStatus: 'none',
      });
    }

    return NextResponse.json(
      { error: 'All dictionary sources failed' },
      { status: 502 }
    );
  }
}
