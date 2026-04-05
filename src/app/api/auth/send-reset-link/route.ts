/**
 * @author SaltedFish-No1
 * @description 发送密码重置链接邮件 API：生成安全 token → 哈希存入 email_verifications 表 → 通过 Resend 发送含重置链接的邮件。
 *   无论邮箱是否存在均返回成功，防止邮箱枚举攻击。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';
import { generateToken, hashToken } from '@/lib/token';
import { buildPasswordResetEmail } from '@/lib/email-templates/password-reset';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_EXPIRY_MINUTES = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查用户是否存在（不存在也返回成功，防枚举）
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = userData?.users.some((u) => u.email === email);

    if (!userExists) {
      return NextResponse.json({ success: true });
    }

    // 生成 token 并哈希
    const token = generateToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // 存入数据库
    const { error: dbError } = await supabaseAdmin
      .from('email_verifications')
      .insert({ email, code: hashedToken, expires_at: expiresAt });

    if (dbError) {
      console.error('[send-reset-link] DB insert failed:', dbError);
      return NextResponse.json(
        { error: '发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 构造重置链接
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // 发送邮件
    const template = buildPasswordResetEmail(resetUrl);
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (emailError) {
      console.error('[send-reset-link] Resend send failed:', emailError);
      return NextResponse.json(
        { error: '邮件发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-reset-link] Unexpected error:', err);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
