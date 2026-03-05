// app/api/account/phone/verify/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = {
  phone_pending: string | null;
  phone_verify_code_hash: string | null;
  phone_verify_expires: string | null;
};

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ ok: false, error: 'bad-code' }, { status: 400 });

    const rows = (await sql`
      SELECT phone_pending, phone_verify_code_hash, phone_verify_expires
      FROM "User"
      WHERE id = ${session.userId}
      LIMIT 1
    `) as Row[];

    const row = rows[0];
    if (!row?.phone_pending || !row.phone_verify_code_hash || !row.phone_verify_expires) {
      return NextResponse.json({ ok: false, error: 'start-first' }, { status: 400 });
    }

    if (new Date(row.phone_verify_expires) < new Date()) {
      return NextResponse.json({ ok: false, error: 'expired' }, { status: 400 });
    }

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== row.phone_verify_code_hash) {
      return NextResponse.json({ ok: false, error: 'bad-code' }, { status: 400 });
    }

    // double-check uniqueness at commit time
    const conflict = await sql`
      SELECT 1 FROM "User" WHERE phone = ${row.phone_pending} AND id <> ${session.userId} LIMIT 1
    `;
    if (conflict.length) {
      return NextResponse.json({ ok: false, error: 'in-use' }, { status: 409 });
    }

    await sql`
      UPDATE "User"
      SET phone = ${row.phone_pending},
          phone_pending = NULL,
          phone_verify_code_hash = NULL,
          phone_verify_expires = NULL
      WHERE id = ${session.userId}
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('phone/verify error', e);
    return NextResponse.json({ ok: false, error: 'server-error' }, { status: 500 });
  }
}
