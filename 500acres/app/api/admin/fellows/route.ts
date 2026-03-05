import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const rows = await sql`
      SELECT
        id,
        username,
        email,
        role,
        COALESCE(
          NULLIF(TRIM(username), ''),
          NULLIF(TRIM(email), ''),
          id::text
        ) AS name
      FROM "User"
      WHERE role = 'fellow'
      ORDER BY name ASC
    `;
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[admin/fellows] error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
