/**
 * @description TTS 语音生成 API：DB 缓存 → AI SDK TTS → 存入 Supabase Storage。
 *   生成的音频 URL 回填到 dictionary_cache.audio_url。
 */

import { NextRequest, NextResponse } from 'next/server';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { normalizeDictionaryQuery } from '@/lib/dictionary';
import { modelSpeech } from '@/lib/ai';
import { requireApiAuth } from '@/lib/api-auth';

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

  // 1. 查 dictionary_cache 是否已有音频 URL
  const { data: cached } = await supabaseAdmin
    .from('dictionary_cache')
    .select('audio_url')
    .eq('word', word)
    .single();

  if (cached?.audio_url) {
    return NextResponse.json({ audioUrl: cached.audio_url });
  }

  // 2. 通过 Vercel AI SDK 调用 TTS
  try {
    const { audio } = await generateSpeech({
      model: modelSpeech,
      text: word,
      voice: 'alloy',
    });

    const audioBuffer = audio.uint8Array;
    const fileName = `${word}.mp3`;

    // 3. 上传到 Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('tts-audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[TTS] Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Audio storage failed' },
        { status: 502 }
      );
    }

    // 4. 获取公共 URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('tts-audio').getPublicUrl(fileName);

    // 5. 回填 dictionary_cache.audio_url
    void supabaseAdmin
      .from('dictionary_cache')
      .update({ audio_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('word', word);

    return NextResponse.json({ audioUrl: publicUrl });
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      { error: 'TTS generation failed' },
      { status: 502 }
    );
  }
}
