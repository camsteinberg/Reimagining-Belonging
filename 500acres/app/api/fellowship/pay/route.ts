import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';

type PayRow = {
  id: number;
  user_id: string;
  week_start: string | null;
  hours: number | null;
  rate_cents: number | null;
  total_cents: number | null;
  note: string | null;
  updated_at: string | null;
};

type LatestPayRow = {
  user_id: string;
  display_name: string;
  week_start: string | null;
  hours: number | null;
  rate_cents: number | null;
  total_cents: number | null;
  note: string | null;
  updated_at: string | null;
};

const toNumber = (raw: unknown, fallback = 0) => {
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const normalizeWeekStart = (raw: unknown) => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  // Force ISO date (YYYY-MM-DD)
  return date.toISOString().slice(0, 10);
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userFilter = searchParams.get('userId');
    const scope = searchParams.get('scope') || 'user';

    if (session.role === 'admin') {
      if (scope === 'latest') {
        const rows = (await sql`
          WITH latest AS (
            SELECT DISTINCT ON (p.user_id)
              p.user_id,
              p.week_start,
              p.hours,
              p.rate_cents,
              p.total_cents,
              p.note,
              p.updated_at
            FROM fellowship_weekly_pay_placeholders p
            ORDER BY p.user_id, p.week_start DESC NULLS LAST, p.id DESC
          )
          SELECT
            u.id::text AS user_id,
            COALESCE(
              NULLIF(TRIM(u.username), ''),
              NULLIF(TRIM(u.email), ''),
              u.id::text
            ) AS display_name,
            latest.week_start,
            latest.hours,
            latest.rate_cents,
            latest.total_cents,
            latest.note,
            latest.updated_at
          FROM "User" u
          LEFT JOIN latest ON latest.user_id = u.id::text
          WHERE u.role = 'fellow'
          ORDER BY display_name
        `) as LatestPayRow[];
        return NextResponse.json(rows);
      }

      if (userFilter) {
        const rows = (await sql`
          SELECT
            id,
            user_id,
            week_start::text AS week_start,
            hours,
            rate_cents,
            total_cents,
            note,
            updated_at::text AS updated_at
          FROM fellowship_weekly_pay_placeholders
          WHERE user_id = ${userFilter}
          ORDER BY week_start DESC NULLS LAST, id DESC
          LIMIT 52
        `) as PayRow[];
        return NextResponse.json(rows);
      }
    }

    const userId = session.role === 'admin' && userFilter ? userFilter : session.userId;
    const rows = (await sql`
      SELECT
        id,
        user_id,
        week_start::text AS week_start,
        hours,
        rate_cents,
        total_cents,
        note,
        updated_at::text AS updated_at
      FROM fellowship_weekly_pay_placeholders
      WHERE user_id = ${userId}
      ORDER BY week_start DESC NULLS LAST, id DESC
      LIMIT 12
    `) as PayRow[];
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[fellowship/pay][GET]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const userId = String(body.userId ?? '').trim();
    const weekStart = normalizeWeekStart(body.weekStart ?? body.week_start);
    if (!userId) {
      return NextResponse.json({ error: 'bad_request', detail: 'userId required' }, { status: 400 });
    }
    if (!weekStart) {
      return NextResponse.json({ error: 'bad_request', detail: 'weekStart must be a valid date' }, { status: 400 });
    }

    const hours = toNumber(body.hours, 0);
    const rateCents = Math.round(toNumber(body.rateCents ?? body.rate_cents, 0));
    const totalProvided = body.totalCents ?? body.total_cents;
    const totalCents =
      typeof totalProvided === 'number'
        ? Math.round(toNumber(totalProvided, 0))
        : Math.round(hours * rateCents);
    const note =
      body.note == null ? null : String(body.note).trim() || null;

    const [row] = (await sql`
      INSERT INTO fellowship_weekly_pay_placeholders (
        user_id, week_start, hours, rate_cents, total_cents, note
      )
      VALUES (${userId}, ${weekStart}, ${hours}, ${rateCents}, ${totalCents}, ${note})
      ON CONFLICT (user_id, week_start) DO UPDATE SET
        hours = ${hours},
        rate_cents = ${rateCents},
        total_cents = ${totalCents},
        note = ${note},
        updated_at = NOW()
      RETURNING
        id,
        user_id,
        week_start::text AS week_start,
        hours,
        rate_cents,
        total_cents,
        note,
        updated_at::text AS updated_at
    `) as PayRow[];

    return NextResponse.json(row);
  } catch (err) {
    console.error('[fellowship/pay][PUT]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const weekStart = normalizeWeekStart(searchParams.get('weekStart'));

    if (!userId || !weekStart) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'userId and weekStart are required' },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM fellowship_weekly_pay_placeholders
      WHERE user_id = ${userId} AND week_start = ${weekStart}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[fellowship/pay][DELETE]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
