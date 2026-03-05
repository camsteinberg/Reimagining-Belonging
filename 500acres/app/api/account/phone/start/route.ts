// app/api/account/phone/start/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';
import crypto from 'crypto';
import { normalizePhone } from '@/lib/phone';
import { sendPhoneVerificationCodeEmail } from '@/lib/mail';
import { createRateLimiter, getClientIp } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 3 attempts per minute per IP
const isRateLimited = createRateLimiter(3, 60_000);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false, error: 'too-many-requests' }, { status: 429 });
    }
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const { phone } = await req.json();
    const norm = normalizePhone(phone);
    if (!norm) return NextResponse.json({ ok: false, error: 'invalid-phone' }, { status: 400 });

    // ensure not in use by someone else
    const conflict = await sql`
      SELECT 1 FROM "User" WHERE phone = ${norm} AND id <> ${session.userId} LIMIT 1
    `;
    if (conflict.length) {
      return NextResponse.json({ ok: false, error: 'in-use' }, { status: 409 });
    }

    // Generate 6-digit code and store hash+expiry with pending phone
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    await sql`
      UPDATE "User"
      SET phone_pending = ${norm},
          phone_verify_code_hash = ${hash},
          phone_verify_expires = ${expires.toISOString()}
      WHERE id = ${session.userId}
    `;

    // Get account email and send the code there
    const rows = (await sql`
      SELECT email FROM "User" WHERE id = ${session.userId} LIMIT 1
    `) as { email: string }[];
    const to = rows[0]?.email;
    if (to) {
      await sendPhoneVerificationCodeEmail(to, code);
    } else {
      return NextResponse.json({ ok: false, error: 'no-email-on-file' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, via: 'email' });
  } catch (e: any) {
    console.error('phone/start error', e?.message || e);
    return NextResponse.json({ ok: false, error: 'server-error' }, { status: 500 });
  }
}
