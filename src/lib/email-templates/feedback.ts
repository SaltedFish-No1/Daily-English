/**
 * @author SaltedFish-No1
 * @description 用户反馈通知邮件 HTML 模板。
 */

import {
  FEEDBACK_TYPE_LABEL,
  type FeedbackType,
  type FeedbackContext,
} from '@/features/feedback/types';

interface FeedbackEmailParams {
  type: FeedbackType;
  content: string;
  contact?: string;
  context: FeedbackContext;
}

export function buildFeedbackEmail(params: FeedbackEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { type, content, contact, context } = params;
  const typeLabel = FEEDBACK_TYPE_LABEL[type];

  const textParts = [
    `【薄荷外语用户反馈】`,
    `类型：${typeLabel}`,
    `内容：${content}`,
    contact ? `联系方式：${contact}` : '',
    `---`,
    `页面：${context.url}`,
    `设备：${context.userAgent}`,
    context.userId ? `用户 ID：${context.userId}` : '用户：未登录',
    `时间：${context.timestamp}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `[${typeLabel}] 薄荷外语用户反馈`,
    text: textParts,
    html: `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">
              用户反馈 — ${typeLabel}
            </h1>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${escapeHtml(content)}</p>

            ${
              contact
                ? `<p style="margin:0 0 16px;font-size:13px;color:#64748b;">联系方式：<strong>${escapeHtml(contact)}</strong></p>`
                : ''
            }

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />

            <table style="font-size:12px;color:#94a3b8;line-height:1.8;">
              <tr><td style="padding-right:12px;">页面</td><td>${escapeHtml(context.url)}</td></tr>
              <tr><td style="padding-right:12px;">用户</td><td>${context.userId ? escapeHtml(context.userId) : '未登录'}</td></tr>
              <tr><td style="padding-right:12px;">时间</td><td>${escapeHtml(context.timestamp)}</td></tr>
              <tr><td style="padding-right:12px;">设备</td><td style="word-break:break-all;">${escapeHtml(context.userAgent)}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
