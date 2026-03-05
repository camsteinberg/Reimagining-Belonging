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
        s.id,
        s.user_id,
        s.item_name,
        s.cost_cents,
        COALESCE(
          NULLIF(TRIM(u.username), ''),
          NULLIF(TRIM(u.email), ''),
          s.user_id::text
        ) AS display_name
      FROM fellowship_supplies s
      LEFT JOIN "User" u ON u.id::text = s.user_id
      WHERE ${userFilter ? sql`s.user_id = ${userFilter}` : sql`TRUE`}
      ORDER BY s.id DESC
    `;
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[supplies][GET] error:', { url: req.url, err });
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
    const itemName = String(body.itemName ?? '').trim();
    const costCents = Number(body.costCents ?? 0);

    const [row] = await sql`
      INSERT INTO fellowship_supplies (user_id, item_name, cost_cents)
      VALUES (${userId}, ${itemName}, ${costCents})
      RETURNING id, user_id, item_name, cost_cents
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    console.error('[supplies][POST] error:', err);
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

    const { id, itemName, costCents } = await req.json();

    const [owner] = await sql`SELECT user_id FROM fellowship_supplies WHERE id = ${id}`;
    if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (session.role !== 'admin' && owner.user_id !== session.userId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const [row] = await sql`
      UPDATE fellowship_supplies
      SET item_name = ${itemName}, cost_cents = ${costCents}
      WHERE id = ${id}
      RETURNING id, user_id, item_name, cost_cents
    `;
    return NextResponse.json(row);
  } catch (err: any) {
    console.error('[supplies][PATCH] error:', err);
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
    const [owner] = await sql`SELECT user_id FROM fellowship_supplies WHERE id = ${id}`;
    if (!owner) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (session.role !== 'admin' && owner.user_id !== session.userId)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    await sql`DELETE FROM fellowship_supplies WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[supplies][DELETE] error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
