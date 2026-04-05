/**
 * @author SaltedFish-No1
 * @description 发送邮箱验证码 API：生成 OTP → 哈希存入 email_verifications 表 → 通过 Resend 发送邮件。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';
import { generateOtp, hashOtp } from '@/lib/otp';
import { buildVerificationEmail } from '@/lib/email-templates/verification';
import { buildPasswordResetEmail } from '@/lib/email-templates/password-reset';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();
    const purpose = (body.purpose as string) || 'verification';

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 生成 OTP 并哈希
    const code = generateOtp();
    const hashedCode = hashOtp(code);
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // 存入数据库
    const { error: dbError } = await supabaseAdmin
      .from('email_verifications')
      .insert({ email, code: hashedCode, expires_at: expiresAt });

    if (dbError) {
      console.error('[send-otp] DB insert failed:', dbError);
      return NextResponse.json(
        { error: '发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 发送邮件
    const template =
      purpose === 'password-reset'
        ? buildPasswordResetEmail(code)
        : buildVerificationEmail(code);
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (emailError) {
      console.error('[send-otp] Resend send failed:', emailError);
      return NextResponse.json(
        { error: '邮件发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
