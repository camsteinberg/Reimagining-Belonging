// app/api/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IdRow = { id: string };

function looksLikeEmail(s: string) {
  return /\S+@\S+\.\S+/.test(s);
}

export async function POST(req: Request) {
  try {
    const { username, email, password, phone, role } = await req.json();

    const uname = (username || '').trim();
    const mail = (email || '').trim().toLowerCase();
    const phoneNorm = normalizePhone(phone);
    const roleValue = String(role ?? '').trim().toLowerCase();
    const isAdmin = roleValue === 'admin';
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
    if (!isAdmin && !isFellow) {
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
    const roleToSave = isAdmin ? 'admin' : 'fellow';

    const rows = (await sql`
      INSERT INTO "User" (username, email, phone, password, role, "createdAt")
      VALUES (${uname}, ${mail}, ${phoneNorm}, ${hash}, ${roleToSave}, NOW())
      RETURNING id
    `) as IdRow[];

    return NextResponse.json({ success: true, message: 'Registered! You can sign in now.', userId: rows[0].id });
  } catch (err: any) {
    // If you have unique indexes (recommended), catch race-condition duplicates:
    if (err?.code === '23505') {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 409 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
