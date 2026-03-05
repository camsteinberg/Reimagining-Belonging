// app/api/fellowship/grants/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { sendSystemEmail } from '@/lib/mail';
import { pushExpenseToExpensify } from '@/lib/expensify';

type Action = 'approve' | 'approve_mod' | 'deny' | 'feedback' | 'review';

const MONEY_TEAM_EMAILS = (process.env.MONEY_TEAM_EMAILS || 'aidan@500acres.org')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function safeSendSystemEmail(to: string | string[], subject: string, html: string) {
  try {
    await sendSystemEmail(to, subject, html);
  } catch (err) {
    console.error('[grant-status][email] failed', err);
  }
}

async function ensureHistoryTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS fellowship_grant_status_history (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES fellowship_grants(id) ON DELETE CASCADE,
      actor_id TEXT,
      action TEXT,
      status TEXT,
      amount_approved_cents INTEGER,
      denial_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function ensureNotificationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS fellowship_notifications (
      id SERIAL PRIMARY KEY,
      audience TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      grant_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

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

async function sendNotification(
  audience: string,
  subject: string,
  body: string,
  grantId?: number
) {
  await ensureNotificationsTable();
  await sql`
    INSERT INTO fellowship_notifications (audience, subject, body, grant_id)
    VALUES (${audience}, ${subject}, ${body}, ${grantId ?? null})
  `;
}

async function getUserEmail(userId: string) {
  const rows = await sql`
    SELECT NULLIF(TRIM(email), '') AS email
    FROM "User"
    WHERE id::text = ${userId}
    LIMIT 1
  ` as { email: string | null }[];
  return rows[0]?.email || null;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function ensureGrantExpensifyColumn() {
  await sql`ALTER TABLE fellowship_grants ADD COLUMN IF NOT EXISTS expensify_expense_id TEXT`;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);
    const action = String(body.action || '').trim().toLowerCase() as Action;
    const approvedAmountCents = body.amountApprovedCents
      ? Math.round(Number(body.amountApprovedCents))
      : null;
    const denialReason = typeof body.denialReason === 'string' ? body.denialReason.trim() : '';

    // Optional editable fields (admin-only); used by "approve with edit"
    const updatedRequestedCents =
      body.amountRequestedCents != null ? Math.round(Number(body.amountRequestedCents)) : undefined;
    const updatedCategory =
      body.category != null ? String(body.category).trim() || null : undefined;
    const updatedProject =
      body.project != null ? String(body.project).trim() || null : undefined;
    const updatedPurpose =
      body.purpose != null ? String(body.purpose).trim() || null : undefined;
    const updatedRequestedByDate =
      body.requestedByDate != null
        ? String(body.requestedByDate).slice(0, 10) || null
        : undefined;

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'valid id is required' },
        { status: 400 }
      );
    }

    if (!['approve', 'approve_mod', 'deny', 'feedback', 'review'].includes(action)) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'invalid action' },
        { status: 400 }
      );
    }

    if (action === 'approve_mod' && (!approvedAmountCents || approvedAmountCents <= 0)) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'amountApprovedCents must be > 0 for approve_mod' },
        { status: 400 }
      );
    }

    if (action === 'approve_mod') {
      if (updatedRequestedCents !== undefined && updatedRequestedCents <= 0) {
        return NextResponse.json(
          { error: 'bad_request', detail: 'amountRequestedCents must be > 0 when provided' },
          { status: 400 }
        );
      }
      if (updatedPurpose !== undefined && !updatedPurpose) {
        return NextResponse.json(
          { error: 'bad_request', detail: 'purpose cannot be empty when provided' },
          { status: 400 }
        );
      }
    }

    if (action === 'deny' && !denialReason) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'denialReason is required to deny' },
        { status: 400 }
      );
    }

    if (action === 'approve_mod' && (!approvedAmountCents || approvedAmountCents <= 0)) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'amountApprovedCents must be > 0 for approve_mod' },
        { status: 400 }
      );
    }

    // Map UI actions → status values in DB
    //   - review   → 'under_review'
    //   - approve  → 'approved'
    //   - approve_mod → 'approved_with_modifications' (and set amount_approved_cents)
    //   - deny     → 'denied'
    //   - feedback → 'feedback_requested'
    let nextStatus: string;
    switch (action) {
      case 'review':
        nextStatus = 'under_review';
        break;
      case 'approve':
        nextStatus = 'approved';
        break;
      case 'approve_mod':
        nextStatus = 'approved_with_modifications';
        break;
      case 'deny':
        nextStatus = 'denied';
        break;
      case 'feedback':
      default:
        nextStatus = 'feedback_requested';
        break;
    }

    await ensureGrantExpensifyColumn();

    const [existing] = (await sql`
      SELECT
        id,
        status,
        fellow_id,
        amount_requested_cents,
        amount_approved_cents,
        category,
        project,
        purpose,
        expensify_expense_id
      FROM fellowship_grants
      WHERE id = ${id}
    `) as {
      id: number;
      status: string;
      fellow_id: string;
      amount_requested_cents: number;
      amount_approved_cents: number | null;
      category: string | null;
      project: string | null;
      purpose: string | null;
      expensify_expense_id: string | null;
    }[];

    if (!existing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const [updated] = (await sql`
      UPDATE fellowship_grants
      SET
        status = ${nextStatus},
        amount_approved_cents = COALESCE(${approvedAmountCents}, amount_approved_cents),
        amount_requested_cents = COALESCE(${updatedRequestedCents}, amount_requested_cents),
        category = COALESCE(${updatedCategory}, category),
        project = COALESCE(${updatedProject}, project),
        purpose = COALESCE(${updatedPurpose}, purpose),
        requested_by_date = COALESCE(${updatedRequestedByDate}, requested_by_date),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id,
        status,
        updated_at::text AS updated_at,
        amount_approved_cents,
        amount_requested_cents,
        category,
        project,
        purpose,
        requested_by_date
    `) as {
      id: number;
      status: string;
      updated_at: string;
      amount_approved_cents: number | null;
      amount_requested_cents: number;
      category: string;
      project: string | null;
      purpose: string;
      requested_by_date: string | null;
    }[];

    await ensureHistoryTable();
    await sql`
      INSERT INTO fellowship_grant_status_history (
        grant_id,
        actor_id,
        action,
        status,
        amount_approved_cents,
        denial_reason
      )
      VALUES (
        ${id},
        ${session.userId},
        ${action},
        ${nextStatus},
        ${approvedAmountCents},
        ${denialReason || null}
      )
    `;

    // Notifications
    const subjectBase = `Grant #${id} status update`;
    const fellowEmail = await getUserEmail(existing.fellow_id);

    switch (nextStatus) {
      case 'approved': {
        const msg = 'Your grant request has been approved.';
        await sendNotification(`user:${existing.fellow_id}`, subjectBase, msg, id);
        if (fellowEmail) await safeSendSystemEmail(fellowEmail, subjectBase, `<p>${msg}</p>`);
        break;
      }
      case 'approved_with_modifications': {
        const approvedLabel =
          approvedAmountCents != null
            ? `$${(approvedAmountCents / 100).toLocaleString()}`
            : 'a modified amount';
        const msg = `Approved with modifications for ${approvedLabel}.`;
        await sendNotification(`user:${existing.fellow_id}`, subjectBase, msg, id);
        if (fellowEmail) await safeSendSystemEmail(fellowEmail, subjectBase, `<p>${msg}</p>`);
        break;
      }
      case 'denied': {
        const msg = denialReason ? `Denied: ${denialReason}` : 'Denied.';
        await sendNotification(`user:${existing.fellow_id}`, subjectBase, msg, id);
        if (fellowEmail) await safeSendSystemEmail(fellowEmail, subjectBase, `<p>${msg}</p>`);
        break;
      }
      case 'feedback_requested': {
        const msg = 'More information was requested for your grant.';
        await sendNotification(`user:${existing.fellow_id}`, subjectBase, msg, id);
        if (fellowEmail) await safeSendSystemEmail(fellowEmail, subjectBase, `<p>${msg}</p>`);
        break;
      }
      case 'under_review': {
        const msg =
          'Grant added to Wednesday agenda. Review at 12:30 PM MST; decision due Friday 10:30 AM MST.';
        await sendNotification('group:money_team', 'Grant added to Wednesday agenda', msg, id);
        if (MONEY_TEAM_EMAILS.length) {
          await safeSendSystemEmail(
            MONEY_TEAM_EMAILS,
            'Grant added to Wednesday agenda',
            `<p>Grant #${id} moved to under_review and should be queued for Wednesday 12:30 PM MST.</p>`
          );
        }
        break;
      }
      default:
        break;
    }

    // Push approved grants to Expensify (update every approved change)
    const shouldPushToExpensify =
      nextStatus === 'approved' || nextStatus === 'approved_with_modifications';
    if (shouldPushToExpensify) {
      let receiptMerchant: string | null = null;
      try {
        await ensureReceiptsTable();
        const receiptRows = (await sql`
          SELECT NULLIF(TRIM(vendor), '') AS vendor
          FROM fellowship_grant_receipts
          WHERE grant_id = ${id}
            AND NULLIF(TRIM(vendor), '') IS NOT NULL
          ORDER BY created_at ASC, id ASC
          LIMIT 1
        `) as { vendor: string | null }[];
        receiptMerchant = receiptRows[0]?.vendor || null;
      } catch (expErr) {
        console.warn('[grant-status][expensify] receipt lookup failed', expErr);
      }

      const amountToPush =
        updated.amount_approved_cents ??
        approvedAmountCents ??
        updated.amount_requested_cents ??
        existing.amount_approved_cents ??
        existing.amount_requested_cents;
      try {
        const expId = await pushExpenseToExpensify({
          amountCents: Number(amountToPush || 0),
          comment: updated.purpose,
          merchant: receiptMerchant,
          category: updated.category || existing.category || null,
          transactionId: existing.expensify_expense_id || null,
        });
        if (expId) {
          await sql`
            UPDATE fellowship_grants
            SET expensify_expense_id = ${expId}, updated_at = NOW()
            WHERE id = ${id}
          `;
        }
      } catch (expErr) {
        console.error('[grant-status][expensify] push failed', expErr);
      }

      try {
        const receiptsToPush = (await sql`
          SELECT
            id,
            vendor,
            amount_cents,
            purchase_date::text AS purchase_date,
            category,
            file_url,
            expensify_expense_id
          FROM fellowship_grant_receipts
          WHERE grant_id = ${id}
            AND expensify_expense_id IS NULL
          ORDER BY created_at ASC, id ASC
        `) as {
          id: number;
          vendor: string | null;
          amount_cents: number;
          purchase_date: string | null;
          category: string | null;
          file_url: string | null;
          expensify_expense_id: string | null;
        }[];

        for (const receipt of receiptsToPush) {
          try {
            const expId = await pushExpenseToExpensify({
              amountCents: Number(receipt.amount_cents || 0),
              merchant: receipt.vendor,
              comment: `Grant #${id} receipt`,
              expenseDate: receipt.purchase_date,
              category: receipt.category || null,
              transactionId: receipt.expensify_expense_id || null,
              receiptUrl: receipt.file_url,
            });
            if (expId) {
              await sql`
                UPDATE fellowship_grant_receipts
                SET expensify_expense_id = ${expId}, updated_at = NOW()
                WHERE id = ${receipt.id}
              `;
            }
          } catch (receiptErr) {
            console.error('[grant-status][expensify] receipt push failed', receiptErr);
          }
        }
      } catch (expErr) {
        console.warn('[grant-status][expensify] receipt push lookup failed', expErr);
      }
    }

    return NextResponse.json({
      ok: true,
      grant: updated,
    });
  } catch (err) {
    console.error('[fellowship/grants/status][PATCH]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

// Optional: guard other methods
export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
export const POST = GET;
export const DELETE = GET;
