import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { pushExpenseToExpensify } from '@/lib/expensify';

type ReceiptRow = {
  id: number;
  grant_id: number;
  vendor: string | null;
  amount_cents: number;
  purchase_date: string | null;
  category: string | null;
  file_url: string | null;
  expensify_expense_id: string | null;
  created_at: string;
  updated_at: string;
};

async function ensureReceiptsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS fellowship_grant_receipts (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES fellowship_grants(id) ON DELETE CASCADE,
      vendor TEXT,
      amount_cents INTEGER NOT NULL,
      purchase_date DATE,
      category TEXT,
      file_url TEXT,
      expensify_expense_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

type SessionLike = { userId: string; role?: string };

async function assertGrantAccess(grantId: number, session: SessionLike) {
  const rows = (await sql`
    SELECT fellow_id::text AS fellow_id, status
    FROM fellowship_grants
    WHERE id = ${grantId}
    LIMIT 1
  `) as { fellow_id: string; status: string }[];
  const owner = rows[0]?.fellow_id;
  const status = rows[0]?.status;
  const role = session.role || 'user';
  if (!owner) return { ok: false, httpStatus: 404 as const };
  if (role !== 'admin' && owner !== session.userId) {
    return { ok: false, httpStatus: 403 as const };
  }
  return { ok: true, owner, grantStatus: status };
}

const toErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

type RouteParams = { id: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const grantId = Number(id);
    if (!Number.isFinite(grantId) || grantId <= 0) {
      return NextResponse.json({ error: 'bad_request', detail: 'invalid id' }, { status: 400 });
    }

    const access = await assertGrantAccess(grantId, session);
    if (!access.ok) return NextResponse.json({ error: 'forbidden' }, { status: access.httpStatus });

    await ensureReceiptsTable();

    const rows = (await sql`
      SELECT
        id,
        grant_id,
        vendor,
        amount_cents,
        purchase_date::text AS purchase_date,
        category,
        file_url,
        expensify_expense_id,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM fellowship_grant_receipts
      WHERE grant_id = ${grantId}
      ORDER BY created_at ASC, id ASC
    `) as ReceiptRow[];

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[grant][receipts][GET]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const grantId = Number(id);
    if (!Number.isFinite(grantId) || grantId <= 0) {
      return NextResponse.json({ error: 'bad_request', detail: 'invalid id' }, { status: 400 });
    }

    const access = await assertGrantAccess(grantId, session);
    if (!access.ok) return NextResponse.json({ error: 'forbidden' }, { status: access.httpStatus });
    const grantStatus = (access.grantStatus || '').toLowerCase();

    const body = await req.json();
    const vendor =
      typeof body.vendor === 'string' && body.vendor.trim() ? body.vendor.trim() : null;
    const amountCents = Number(body.amountCents ?? 0);
    const purchaseDate = body.purchaseDate ? String(body.purchaseDate).slice(0, 10) : null;
    const category =
      typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'program';
    const fileUrl =
      typeof body.fileUrl === 'string' && body.fileUrl.trim() ? body.fileUrl.trim() : null;

    if (!vendor) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'vendor is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'amountCents must be > 0' },
        { status: 400 }
      );
    }
    if (!purchaseDate) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'purchaseDate is required' },
        { status: 400 }
      );
    }

    await ensureReceiptsTable();

    let [receipt] = (await sql`
      INSERT INTO fellowship_grant_receipts (
        grant_id,
        vendor,
        amount_cents,
        purchase_date,
        category,
        file_url
      )
      VALUES (
        ${grantId},
        ${vendor},
        ${Math.round(amountCents)},
        ${purchaseDate},
        ${category},
        ${fileUrl}
      )
      RETURNING
        id,
        grant_id,
        vendor,
        amount_cents,
        purchase_date::text AS purchase_date,
        category,
        file_url,
        expensify_expense_id,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `) as ReceiptRow[];

    // Update grant spend total
    await sql`
      UPDATE fellowship_grants
      SET amount_spent_cents = COALESCE(amount_spent_cents, 0) + ${Math.round(amountCents)}
      WHERE id = ${grantId}
    `;

    const shouldPushToExpensify = ['approved', 'approved_with_modifications', 'active'].includes(
      grantStatus
    );
    if (shouldPushToExpensify) {
      try {
        const expId = await pushExpenseToExpensify({
          amountCents: Math.round(amountCents),
          merchant: vendor,
          comment: `Grant #${grantId} receipt`,
          expenseDate: purchaseDate,
          category,
          transactionId: receipt.expensify_expense_id || null,
          receiptUrl: receipt.file_url,
        });
        if (expId) {
          const [patchedReceipt] = (await sql`
            UPDATE fellowship_grant_receipts
            SET expensify_expense_id = ${expId}, updated_at = NOW()
            WHERE id = ${receipt.id}
            RETURNING
              id,
              grant_id,
              vendor,
              amount_cents,
              purchase_date::text AS purchase_date,
              category,
              file_url,
              expensify_expense_id,
              created_at::text AS created_at,
              updated_at::text AS updated_at
          `) as ReceiptRow[];
          if (patchedReceipt) {
            receipt = patchedReceipt;
          }
        }
      } catch (expErr) {
        console.error('[grant][receipts][expensify] push failed', expErr);
      }
    }

    return NextResponse.json(receipt, { status: 201 });
  } catch (err) {
    console.error('[grant][receipts][POST]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
