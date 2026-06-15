import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.qq.com',
  port: Number(process.env.MAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

interface FeedbackMailData {
  category: string;
  content: string;
  contact: string;
  time: string;
}

export async function sendFeedbackNotification(data: FeedbackMailData): Promise<boolean> {
  const to = process.env.MAIL_TO || process.env.MAIL_USER;
  if (!to) {
    console.warn('[Mail] MAIL_TO not configured, skip sending');
    return false;
  }

  const categoryEmoji: Record<string, string> = {
    '功能建议': '💡',
    '问题反馈': '🐛',
    '体验优化': '✨',
    '其他': '📋',
  };

  const emoji = categoryEmoji[data.category] || '📋';

  try {
    const info = await transporter.sendMail({
      from: `"Luna 经期助手" <${process.env.MAIL_USER}>`,
      to,
      subject: `${emoji} 新反馈：${data.category} - Luna`,
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a2027;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#e07a5f,#d4a574);padding:24px 28px;">
            <h1 style="margin:0;color:#0f1419;font-size:20px;font-weight:600;">🌙 Luna 经期助手</h1>
            <p style="margin:6px 0 0;color:rgba(15,20,25,0.7);font-size:13px;">收到一条新的用户反馈</p>
          </div>
          <div style="padding:24px 28px;">
            <div style="margin-bottom:20px;">
              <span style="display:inline-block;background:rgba(224,122,95,0.15);color:#e07a5f;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:500;">${emoji} ${data.category}</span>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:20px;">
              <p style="margin:0;color:#f0ece4;font-size:15px;line-height:1.7;white-space:pre-wrap;">${data.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
            ${data.contact ? `
            <div style="background:rgba(129,178,154,0.1);border-radius:12px;padding:12px 16px;margin-bottom:16px;">
              <p style="margin:0;color:#81b29a;font-size:13px;">📞 联系方式：<span style="color:#f0ece4;">${data.contact.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span></p>
            </div>` : ''}
            <p style="margin:0;color:#6b7280;font-size:12px;">🕐 提交时间：${data.time}</p>
          </div>
          <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:11px;">此邮件由 Luna 经期助手自动发送，请勿直接回复</p>
          </div>
        </div>
      `,
    });

    console.log('[Mail] Feedback notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mail] Failed to send feedback notification:', error);
    return false;
  }
}
