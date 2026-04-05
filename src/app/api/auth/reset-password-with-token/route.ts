/**
 * @author SaltedFish-No1
 * @description 重置密码 API：验证邮件链接 token → 通过 Supabase Admin 更新用户密码。
 *   Token 验证与密码更新在同一请求中完成，防止绕过验证。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyTokenHash } from '@/lib/token';

const MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();
    const token = (body.token as string)?.trim();
    const newPassword = body.newPassword as string;

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: '请提供邮箱、token 和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `密码至少 ${MIN_PASSWORD_LENGTH} 位` },
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
        { error: '重置链接无效或已过期，请重新发送' },
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
        { error: '重置链接已失效，尝试次数过多，请重新发送' },
        { status: 400 }
      );
    }

    // 比较 token
    if (!verifyTokenHash(token, row.code)) {
      await supabaseAdmin
        .from('email_verifications')
        .update({ attempts: row.attempts + 1 })
        .eq('id', row.id);
      return NextResponse.json(
        { error: '重置链接无效，请重新发送' },
        { status: 400 }
      );
    }

    // 标记为已使用
    await supabaseAdmin
      .from('email_verifications')
      .update({ used: true })
      .eq('id', row.id);

    // 查找用户
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('[reset-password-with-token] listUsers failed:', userError);
      return NextResponse.json(
        { error: '服务器错误，请稍后重试' },
        { status: 500 }
      );
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: '未找到该邮箱对应的账号' },
        { status: 400 }
      );
    }

    // 更新密码
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

    if (updateError) {
      console.error(
        '[reset-password-with-token] updateUserById failed:',
        updateError
      );
      return NextResponse.json(
        { error: '密码更新失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[reset-password-with-token] Unexpected error:', err);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
