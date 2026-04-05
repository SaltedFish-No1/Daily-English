/**
 * @author SaltedFish-No1
 * @description 验证邮箱 OTP API：校验验证码 → 通过 Supabase Admin 生成 magic link token →
 *   返回 token_hash 供客户端建立会话。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyOtpHash } from '@/lib/otp';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();
    const code = (body.code as string)?.trim();

    if (!email || !code) {
      return NextResponse.json(
        { error: '请提供邮箱和验证码' },
        { status: 400 }
      );
    }

    // 查询最新未使用且未过期的验证记录
    const { data: row, error: queryError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError || !row) {
      return NextResponse.json(
        { error: '验证码无效或已过期，请重新发送' },
        { status: 400 }
      );
    }

    // 检查尝试次数
    if (row.attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin
        .from('email_verifications')
        .update({ used: true })
        .eq('id', row.id);
      return NextResponse.json(
        { error: '验证码已失效，尝试次数过多，请重新发送' },
        { status: 400 }
      );
    }

    // 比较验证码
    if (!verifyOtpHash(code, row.code)) {
      await supabaseAdmin
        .from('email_verifications')
        .update({ attempts: row.attempts + 1 })
        .eq('id', row.id);
      return NextResponse.json(
        { error: '验证码错误，请重新输入' },
        { status: 400 }
      );
    }

    // 标记为已使用
    await supabaseAdmin
      .from('email_verifications')
      .update({ used: true })
      .eq('id', row.id);

    // 生成 magic link token 用于建立 Supabase 会话
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

    if (linkError || !linkData) {
      console.error('[verify-otp] generateLink failed:', linkError);
      return NextResponse.json(
        { error: '验证成功但会话创建失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token_hash: linkData.properties.hashed_token,
    });
  } catch (err) {
    console.error('[verify-otp] Unexpected error:', err);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
