import nodemailer from 'nodemailer';

const devMode = !process.env.SMTP_HOST;

let transporter: nodemailer.Transporter | null = null;
if (!devMode) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function buildMagicLinkUrl(token: string): string {
  const base = process.env.APP_URL || 'http://localhost:4200';
  return `${base}/auth/verify?token=${token}`;
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const url = buildMagicLinkUrl(token);

  if (devMode) {
    console.log(`\n[auth] ========== MAGIC LINK ==========`);
    console.log(`[auth] Email: ${email}`);
    console.log(`[auth] Link:  ${url}`);
    console.log(`[auth] ====================================\n`);
    return;
  }

  await transporter!.sendMail({
    from: process.env.SMTP_FROM || 'BJJ Coach <coach@bjjcoach.app>',
    to: email,
    subject: 'Sign in to BJJ Coach',
    html: [
      '<p>Click the link below to sign in to BJJ Coach:</p>',
      `<p><a href="${url}" style="display:inline-block;padding:10px 24px;background:#f5a623;color:#1a1a1a;text-decoration:none;border-radius:6px;font-weight:600;">Sign in to BJJ Coach</a></p>`,
      '<p>This link expires in 15 minutes.</p>',
      '<p style="color:#9b9589;font-size:12px;">If you didn\'t request this, you can safely ignore this email.</p>',
    ].join('\n'),
    text: `Sign in to BJJ Coach: ${url}\n\nThis link expires in 15 minutes.`,
  });
}
