import { NextRequest, NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { getSession } from '@/lib/getSession';
import sql from '@/lib/db';

const SPREADSHEET_ID = process.env.BUDGET_ID!;
const RANGE = 'A:C'; // header: Fellow | Allocated | Actual

type Row = {
  rowIndex: number; // 1-based index in the Sheet
  fellow: string;
  allocated: number;
  actual: number;
};

function toNumber(x: unknown): number {
  if (typeof x === 'number') return x;
  if (x == null) return 0;
  // handle "$1,234.56" or "1,234.56"
  const s = String(x).replace(/[^\d.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseRows(values: any[][] = []): Row[] {
  const rows: Row[] = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i] || [];
    rows.push({
      rowIndex: i + 1, // Sheets rows are 1-based; row 1 is header
      fellow: String(r[0] ?? '').trim(),
      allocated: toNumber(r[1]),
      actual: toNumber(r[2]),
    });
  }
  return rows;
}

function normalizeLabel(value: unknown): string {
  if (typeof value !== 'string') return '';
  // lowercase + strip all non-alphanumeric to match e.g. "John Doe", "john_doe", "john.doe@gmail.com"
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      majorDimension: 'ROWS',
      valueRenderOption: 'UNFORMATTED_VALUE', // raw numbers if possible
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });

    const values = (res.data.values as any[][]) || [];
    let rows = parseRows(values);

    // --- Merge in actual spend from grants only ---
    try {
      // Grant spend per fellow (amount_spent_cents updated by receipts API)
      const grantRows: any[] = await sql`
        SELECT
          g.fellow_id AS user_id,  -- CHANGE TO g.user_id IF YOUR COLUMN IS NAMED THAT
          COALESCE(
            NULLIF(TRIM(u.username), ''),
            NULLIF(TRIM(u.email), ''),
            u.id::text
          ) AS label,
          SUM(COALESCE(g.amount_spent_cents, 0))::bigint AS total_cents
        FROM fellowship_grants g
        LEFT JOIN "User" u ON u.id::text = g.fellow_id  -- SAME NOTE AS ABOVE
        GROUP BY g.fellow_id, label
      `;

      const spendByKey = new Map<string, number>();

      const addRows = (rowsSrc: any[]) => {
        for (const r of rowsSrc) {
          const key =
            normalizeLabel(r.label ?? '') || normalizeLabel(r.user_id);
          if (!key) continue;

          const cents = Number(r.total_cents ?? 0);
          if (!Number.isFinite(cents)) continue;

          spendByKey.set(key, (spendByKey.get(key) ?? 0) + cents);
        }
      };

      addRows(grantRows);

      rows = rows.map((row) => {
        const key = normalizeLabel(row.fellow);
        if (!key) return row;

        const cents = spendByKey.get(key);
        if (cents == null) return row; // no tracked spend for this fellow yet

        const actualDollars = cents / 100;
        return {
          ...row,
          actual: actualDollars,
        };
      });
    } catch (err) {
      console.error('[budget][GET][spend_merge] error:', err);
      // If DB lookup fails, we just fall back to whatever Actual is in the sheet.
    }
    // --- End merge logic ---

    return NextResponse.json({
      headers: values[0] || ['Fellow', 'Allocated', 'Actual'],
      rows,
    });
  } catch (err: any) {
    console.error('[budget][GET]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

/**
 * PUT: update a row by rowIndex (1-based), body: { rowIndex, fellow, allocated, actual }
 * POST: append a row, body: { fellow, allocated, actual }
 * DELETE: clear a row by rowIndex (1-based), body: { rowIndex }
 *
 * Note: Actual is auto-calculated from DB at GET time, so any manual "actual" you send here
 * will effectively be overridden next time GET runs. We keep it for compatibility.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { rowIndex, fellow, allocated, actual } = await req.json();
    if (!rowIndex || rowIndex < 2) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'rowIndex must be >= 2' },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${rowIndex}:C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[String(fellow ?? ''), Number(allocated ?? 0), Number(actual ?? 0)]],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[budget][PUT]', err);
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
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { fellow, allocated, actual } = await req.json();
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:C',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[String(fellow ?? ''), Number(allocated ?? 0), Number(actual ?? 0)]],
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error('[budget][POST]', err);
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
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { rowIndex } = await req.json();
    if (!rowIndex || rowIndex < 2) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'rowIndex must be >= 2' },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${rowIndex}:C${rowIndex}`,
      requestBody: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[budget][DELETE]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
