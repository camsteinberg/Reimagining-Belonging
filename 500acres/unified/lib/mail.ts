// lib/mail.ts
let client: import('resend').Resend | null = null;

async function getResend() {
  if (!client) {
    const { Resend } = await import('resend');
    client = new Resend(process.env.RESEND_API_KEY!);
  }
  return client;
}

const FROM = process.env.EMAIL_FROM!; // e.g., '500AcresOS <auth@barndosdashboard.com>'

function htmlToText(html: string) {
  return html
    .replace(/\<\s*br\s*\/?\s*\>/gi, '\n')
    .replace(/\<\/(p|div|li|section|article)\>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = await getResend();
  const html = `
      <p>We got a request to reset your 500AcresOS password.</p>
      <p><a href="${resetUrl}">Click here to reset</a> - link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your 500AcresOS password',
    html,
    text: htmlToText(html),
  });
}

export async function sendPhoneVerificationCodeEmail(to: string, code: string) {
  const resend = await getResend();
  const html = `
      <p>Here's your code to confirm your phone number:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your 500AcresOS verification code',
    html,
    text: htmlToText(html),
  });
}

export async function sendSystemEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: { text?: string; replyTo?: string | string[] }
) {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text: options?.text ?? htmlToText(html),
    replyTo: options?.replyTo,
  });
}
  
