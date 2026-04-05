/**
 * @description TTS 语音生成 API：DB 缓存 → OpenAI TTS → 存入 Supabase Storage。
 *   生成的音频 URL 回填到 dictionary_cache.audio_url。
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai as openaiProvider } from '@ai-sdk/openai';
import { supabaseAdmin } from '@/lib/supabase-server';
import { normalizeDictionaryQuery } from '@/lib/dictionary';

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

  // 1. 查 dictionary_cache 是否已有音频 URL
  const { data: cached } = await supabaseAdmin
    .from('dictionary_cache')
    .select('audio_url')
    .eq('word', word)
    .single();

  if (cached?.audio_url) {
    return NextResponse.json({ audioUrl: cached.audio_url });
  }

  // 2. 调用 OpenAI TTS API
  try {
    // 使用 @ai-sdk/openai 的底层 provider 获取 OpenAI client 配置
    // 直接用 fetch 调用 OpenAI TTS，因为 Vercel AI SDK 不包装 TTS
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 }
      );
    }

    // 确保 openaiProvider 已加载（避免 tree-shaking 移除）
    void openaiProvider;

    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: word,
        voice: 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      console.error('[TTS] OpenAI API error:', ttsResponse.status);
      return NextResponse.json(
        { error: 'TTS generation failed' },
        { status: 502 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
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
