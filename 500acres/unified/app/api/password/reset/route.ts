// app/api/password/reset/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { hashToken } from '@/lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ResetRow = { id: string; reset_token_expires: string | null };

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    const hashed = hashToken(token);

    const rows = (await sql`
      SELECT id, reset_token_expires
      FROM "User"
      WHERE reset_token_hash = ${hashed}
      LIMIT 1
    `) as ResetRow[];

    const user = rows[0];
    const now = new Date();

    if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < now) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(password, 12);

    await sql`
      UPDATE "User"
      SET password = ${newHash},
          reset_token_hash = NULL,
          reset_token_expires = NULL
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('reset error', e);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
