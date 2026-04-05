/**
 * @author SaltedFish-No1
 * @description 密码重置邮件 HTML 模板，包含重置链接按钮，使用与应用一致的 emerald green 品牌色。
 */

export function buildPasswordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: '薄荷外语 — 重置密码',
    text: `你好！\n\n你正在重置薄荷外语的密码，请点击以下链接设置新密码：\n\n${resetUrl}\n\n该链接将在 30 分钟后过期。\n\n如果你没有请求重置密码，请忽略此邮件并确保账号安全。`,
    html: `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="420" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
              🌿 薄荷外语
            </h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 24px;">
            <p style="margin:0 0 8px;color:#334155;font-size:15px;line-height:1.6;">
              你好！
            </p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              你正在重置密码，请点击下方按钮设置新密码：
            </p>
            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td align="center" style="border-radius:10px;background-color:#059669;">
                  <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                    重置密码
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;text-align:center;">
              链接将在 <strong>30 分钟</strong>后过期
            </p>
            <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.5;word-break:break-all;">
              如果按钮无法点击，请复制以下链接到浏览器：<br/>${resetUrl}
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.5;">
              如果你没有请求重置密码，请忽略此邮件并确保账号安全。
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  };
}
