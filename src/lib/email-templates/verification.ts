/**
 * @author SaltedFish-No1
 * @description 验证码邮件 HTML 模板，使用与应用一致的 emerald green 品牌色。
 */

export function buildVerificationEmail(code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const digits = code.split('');

  return {
    subject: `${code} — 薄荷外语验证码`,
    text: `你的薄荷外语验证码是：${code}\n\n该验证码将在 10 分钟后过期。\n\n如果你没有请求此验证码，请忽略此邮件。`,
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
              你的验证码是：
            </p>
            <!-- OTP digits -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                ${digits
                  .map(
                    (d) =>
                      `<td style="width:44px;height:52px;text-align:center;font-size:26px;font-weight:700;color:#059669;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:0 4px;font-family:'Courier New',monospace;">${d}</td>`
                  )
                  .join('<td style="width:8px;"></td>')}
              </tr>
            </table>
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;text-align:center;">
              验证码将在 <strong>10 分钟</strong>后过期
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.5;">
              如果你没有请求此验证码，请忽略此邮件。
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
