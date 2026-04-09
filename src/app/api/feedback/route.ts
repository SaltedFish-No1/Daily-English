/**
 * @author SaltedFish-No1
 * @description 用户反馈提交 API — 校验请求后通过 Resend 将反馈邮件发送至管理员邮箱。
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resend } from '@/lib/resend';
import { serverEnv } from '@/lib/env/server';
import { buildFeedbackEmail } from '@/lib/email-templates/feedback';

const feedbackSchema = z.object({
  payload: z.object({
    type: z.enum(['bug', 'feature', 'other']),
    content: z.string().min(10, '反馈内容至少 10 个字').max(1000),
    contact: z.string().max(100).optional(),
  }),
  context: z.object({
    url: z.string(),
    userAgent: z.string(),
    userId: z.string().optional(),
    timestamp: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? '请求参数无效' },
        { status: 400 }
      );
    }

    const { payload, context } = parsed.data;

    const template = buildFeedbackEmail({
      type: payload.type,
      content: payload.content,
      contact: payload.contact,
      context,
    });

    const { error: emailError } = await resend.emails.send({
      from: serverEnv.RESEND_FROM_EMAIL,
      to: serverEnv.RESEND_FROM_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (emailError) {
      console.error('[feedback] Resend send failed:', emailError);
      return NextResponse.json(
        { error: '提交失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[feedback] Unexpected error:', err);
    return NextResponse.json(
      { error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}
