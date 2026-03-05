// app/api/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { normalizePhone } from '@/lib/phone';
import { createRateLimiter, getClientIp } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 3 attempts per minute per IP
const isRateLimited = createRateLimiter(3, 60_000);

type IdRow = { id: string };

function looksLikeEmail(s: string) {
  return /\S+@\S+\.\S+/.test(s);
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const { username, email, password, phone, role } = await req.json();

    const uname = (username || '').trim();
    const mail = (email || '').trim().toLowerCase();
    const phoneNorm = normalizePhone(phone);
    const roleValue = String(role ?? '').trim().toLowerCase();
    const isFellow = roleValue === 'fellow';

    if (!uname || !mail || !password || !roleValue) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    if (!looksLikeEmail(mail)) {
      return NextResponse.json({ success: false, message: 'Invalid email' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if ((phone ?? '').trim() && !phoneNorm) {
      return NextResponse.json({ success: false, message: 'Invalid phone number' }, { status: 400 });
    }
    if (!isFellow) {
      return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
    }

    // Check for existing user (email, username, or phone if provided)
    const existing = (await sql`
      SELECT id FROM "User"
      WHERE lower(email) = lower(${mail})
         OR username = ${uname}
         ${phoneNorm ? sql`OR phone = ${phoneNorm}` : sql``}
      LIMIT 1
    `) as IdRow[];

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const roleToSave = 'fellow';

    const rows = (await sql`
      INSERT INTO "User" (username, email, phone, password, role, status, "createdAt")
      VALUES (${uname}, ${mail}, ${phoneNorm}, ${hash}, ${roleToSave}, 'pending', NOW())
      RETURNING id
    `) as IdRow[];

    // Notify admins of new registration
    try {
      const { sendSystemEmail } = await import('@/lib/mail');
      const adminEmails = process.env.MONEY_TEAM_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) ?? [];
      if (adminEmails.length > 0) {
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        await sendSystemEmail(
          adminEmails,
          `New account registration: ${uname}`,
          `<p>A new account has been created and needs approval:</p>
           <ul>
             <li><strong>Username:</strong> ${esc(uname)}</li>
             <li><strong>Email:</strong> ${esc(mail)}</li>
             <li><strong>Role requested:</strong> ${esc(roleToSave)}</li>
           </ul>
           <p>Visit the dashboard to approve or reject this account.</p>`
        );
      }
    } catch (emailErr) {
      console.error('Failed to send admin notification:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! An admin will review your request. You\'ll receive an email when approved.',
      userId: rows[0].id,
    });
  } catch (err: any) {
    // If you have unique indexes (recommended), catch race-condition duplicates:
    if (err?.code === '23505') {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 409 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
