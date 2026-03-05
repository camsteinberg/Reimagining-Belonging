import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userFilter =
      session.role === 'admin' ? (searchParams.get('userId') || null) : session.userId;

    const rows = await sql`
      SELECT
        k.id,
        k.user_id,
        k.title,
        k.objective,
        k.is_done,
        COALESCE(
          NULLIF(TRIM(u.username), ''),
          NULLIF(TRIM(u.email), ''),
          k.user_id::text
        ) AS display_name
      FROM fellowship_kpis k
      LEFT JOIN "User" u ON u.id::text = k.user_id
      WHERE ${userFilter ? sql`k.user_id = ${userFilter}` : sql`TRUE`}
      ORDER BY k.id DESC
    `;
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[kpis][GET] error:', { url: req.url, err });
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await req.json();
    const userId = session.role === 'admin' && body.userId ? body.userId : session.userId;
    const title = String(body.title ?? '').trim();
    const objective = String(body.objective ?? '').trim();

    const [row] = await sql`
      INSERT INTO fellowship_kpis (user_id, title, objective)
      VALUES (${userId}, ${title}, ${objective})
      RETURNING id, user_id, title, objective, is_done
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    console.error('[kpis][POST] error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id, title, objective, isDone } = await req.json();

    const [owner] = await sql`SELECT user_id FROM fellowship_kpis WHERE id = ${id}`;
    if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (session.role !== 'admin' && owner.user_id !== session.userId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const [row] = await sql`
      UPDATE fellowship_kpis
      SET title = ${title}, objective = ${objective}, is_done = ${!!isDone}
      WHERE id = ${id}
      RETURNING id, user_id, title, objective, is_done
    `;
    return NextResponse.json(row);
  } catch (err: any) {
    console.error('[kpis][PATCH] error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const id = Number(new URL(req.url).searchParams.get('id'));
    const [owner] = await sql`SELECT user_id FROM fellowship_kpis WHERE id = ${id}`;
    if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (session.role !== 'admin' && owner.user_id !== session.userId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    await sql`DELETE FROM fellowship_kpis WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[kpis][DELETE] error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
