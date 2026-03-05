// app/api/password/forgot/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/mail';
import { createRateLimiter, getClientIp } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 3 attempts per minute per IP
const isRateLimited = createRateLimiter(3, 60_000);

type UserRow = { id: string; email: string };

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      // Return ok:true even when rate limited to avoid enumeration
      return NextResponse.json({ ok: true });
    }
    const { email } = await req.json();

    // Always "ok" (no enumeration)
    if (!email) return NextResponse.json({ ok: true });

    const users = (await sql`
      SELECT id, email
      FROM "User"
      WHERE email = ${email}
      LIMIT 1
    `) as UserRow[];

    const user = users[0];

    if (user) {
      const { token, hash, expiresAt } = generateResetToken();

      await sql`
        UPDATE "User"
        SET reset_token_hash = ${hash},
            reset_token_expires = ${expiresAt.toISOString()}
        WHERE id = ${user.id}
      `;

      const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const resetUrl = `${base}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (e) {
        // don't leak mail failures
        console.error('sendPasswordResetEmail error', e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('forgot error', e);
    return NextResponse.json({ ok: true });
  }
}
