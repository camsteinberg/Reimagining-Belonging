// app/api/fellowship/grants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';
import { sendSystemEmail } from '@/lib/mail';

type GrantRow = {
  id: number;
  fellow_id: string;
  amount_requested_cents: number;
  amount_approved_cents: number | null;
  amount_disbursed_cents: number;
  amount_spent_cents: number;
  purpose: string;
  category: string;
  project: string | null;
  linked_kpi_ids?: number[] | null;
  status: string;
  requested_by_date: string | null;
  created_at: string;
  updated_at: string;
  display_name: string;
  supporting_doc_count?: number;
};

const MONEY_TEAM_EMAILS = (process.env.MONEY_TEAM_EMAILS || 'aidan@500acres.org')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const UNDER_2K_NOTIFY_EMAIL = 'aidan@500acres.org';
const OVER_2K_NOTIFY_EMAIL = 'aidan.miller@barndosonly.com';
const TWO_K_DOLLARS_IN_CENTS = 200_000;

async function safeSendSystemEmail(to: string | string[], subject: string, html: string) {
  try {
    await sendSystemEmail(to, subject, html);
  } catch (err) {
    console.error('[grants][email] failed to send', err);
  }
}

async function ensureSupportingDocsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS fellowship_grant_supporting_docs (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES fellowship_grants(id) ON DELETE CASCADE,
      file_name TEXT,
      file_data_base64 TEXT,
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

async function getUserDisplayName(userId: string) {
  const rows = await sql`
    SELECT COALESCE(
      NULLIF(TRIM(username), ''),
      NULLIF(TRIM(email), ''),
      id::text
    ) AS display_name
    FROM "User"
    WHERE id::text = ${userId}
    LIMIT 1
  ` as { display_name: string | null }[];
  return rows[0]?.display_name || String(userId);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);

    // Fellows only see their own; admins can filter or see all
    const userFilter =
      session.role === 'admin' ? (searchParams.get('userId') || null) : session.userId;

    const statusFilter = searchParams.get('status');

    // Ensure supporting docs table exists so the count subquery works
    await ensureSupportingDocsTable();

    const rows = (await sql`
      SELECT
        g.id,
        g.fellow_id,
        g.amount_requested_cents,
        g.amount_approved_cents,
        g.amount_disbursed_cents,
        g.amount_spent_cents,
        g.purpose,
        g.category,
        g.project,
        COALESCE(g.linked_kpi_ids, '{}') AS linked_kpi_ids,
        g.status,
        g.requested_by_date,
        g.created_at,
        g.updated_at,
        (
          SELECT COUNT(*)::int
          FROM fellowship_grant_supporting_docs d
          WHERE d.grant_id = g.id
        ) AS supporting_doc_count,
        COALESCE(
          NULLIF(TRIM(u.username), ''),
          NULLIF(TRIM(u.email), ''),
          g.fellow_id::text
        ) AS display_name
      FROM fellowship_grants g
      LEFT JOIN "User" u ON u.id::text = g.fellow_id
      WHERE ${userFilter ? sql`g.fellow_id = ${userFilter}` : sql`TRUE`}
        AND ${statusFilter ? sql`g.status = ${statusFilter}` : sql`TRUE`}
      ORDER BY g.id DESC
    `) as GrantRow[];

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[grants][GET] error:', { url: req.url, err });
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

    // Admins can optionally create on behalf of a fellow, same pattern as supplies/KPIs :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}
    const fellowId = session.role === 'admin' && body.userId ? body.userId : session.userId;

    // Amount is sent in cents from the frontend (like costCents) – we still sanitize
    const amountRequestedCents = Math.round(Number(body.amountRequestedCents ?? body.amountCents ?? 0));
    const rawCategory = String(body.category ?? '').trim();
    const category = rawCategory || 'program';
    const project = String(body.project ?? '').trim() || null;
    const purpose = String(body.purpose ?? '').trim();
    const requestedByDate = body.requestedByDate ? String(body.requestedByDate).slice(0, 10) : null;
    const linkedKpiIds = Array.isArray(body.linkedKpiIds)
      ? body.linkedKpiIds.map((id: any) => Number(id)).filter((n: number) => Number.isFinite(n))
      : [];
    const supportingDocName =
      typeof body.supportingDocName === 'string' ? body.supportingDocName.trim() : '';
    const supportingDocBase64 =
      typeof body.supportingDocBase64 === 'string' ? body.supportingDocBase64 : '';

    if (!amountRequestedCents || amountRequestedCents <= 0) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'amountRequestedCents must be > 0' },
        { status: 400 }
      );
    }
    if (!purpose || purpose.length < 50) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'purpose is required (min 50 chars)' },
        { status: 400 }
      );
    }

    // IP for compliance acknowledgment
    const ip =
      req.headers.get('x-forwarded-for') ??
      req.headers.get('x-real-ip') ??
      null;

    const initialStatus =
      amountRequestedCents >= TWO_K_DOLLARS_IN_CENTS ? 'under_review' : 'submitted';

    const [grant] = await sql`
      INSERT INTO fellowship_grants (
        fellow_id,
        amount_requested_cents,
        purpose,
        category,
        project,
        status,
        linked_kpi_ids,
        requested_by_date
      )
      VALUES (
        ${fellowId},
        ${amountRequestedCents},
        ${purpose},
        ${category},
        ${project},
        ${initialStatus},
        ${linkedKpiIds},
        ${requestedByDate}
      )
      RETURNING
        id,
        fellow_id,
        amount_requested_cents,
        amount_approved_cents,
        amount_disbursed_cents,
        amount_spent_cents,
        purpose,
        category,
        project,
        COALESCE(linked_kpi_ids, '{}') AS linked_kpi_ids,
        status,
        requested_by_date,
        created_at,
        updated_at
    ` as GrantRow[];

    // Supporting docs (optional)
    if (supportingDocBase64 && grant?.id) {
      await ensureSupportingDocsTable();
      await sql`
        INSERT INTO fellowship_grant_supporting_docs (grant_id, file_name, file_data_base64)
        VALUES (${grant.id}, ${supportingDocName || null}, ${supportingDocBase64})
      `;
      grant.supporting_doc_count = 1;
    }

    // Compliance acknowledgment row
    await sql`
      INSERT INTO fellowship_compliance_acknowledgments (grant_id, fellow_id, ip_address)
      VALUES (${grant.id}, ${fellowId}, ${ip})
    `;

    // Notifications
    const amountLabel = `$${(amountRequestedCents / 100).toLocaleString()}`;
    const fellowDisplayName = await getUserDisplayName(fellowId);
    const sanitizedFellowName = fellowDisplayName ? fellowDisplayName.replace(/[<>]/g, '') : '';
    const grantEmailBody = `<p>${sanitizedFellowName} submitted a grant request for ${amountLabel}.</p><p><a href="https://www.barndosdashboard.com">www.barndosdashboard.com</a></p>`;
    await sendNotification(
      `user:${fellowId}`,
      'Grant submission received',
      `We received your grant request for ${amountLabel}. Status: ${initialStatus}.`,
      grant.id
    );
    if (amountRequestedCents < TWO_K_DOLLARS_IN_CENTS) {
      await sendNotification(
        'role:coo',
        'New grant under $2,000 needs review',
        `Grant #${grant.id} (${amountLabel}) is awaiting COO review.`,
        grant.id
      );
      const fellowEmail = await getUserEmail(fellowId);
      if (fellowEmail) {
        await safeSendSystemEmail(
          fellowEmail,
          'Grant submission received',
          grantEmailBody
        );
      }
      await safeSendSystemEmail(
        UNDER_2K_NOTIFY_EMAIL,
        'New grant request under $2,000',
        grantEmailBody
      );
      // COO email notifications (optional future env)
    } else {
      await sendNotification(
        'group:money_team',
        'New >=$2,000 grant queued for Money Team',
        `Grant #${grant.id} (${amountLabel}) requires Money Team agenda.`,
        grant.id
      );
      await sendNotification(
        'group:stakeholders',
        'Wednesday review reminder',
        `Grant #${grant.id} scheduled for Wednesday 12:30 PM MST review; decision due Friday 10:30 AM MST.`,
        grant.id
      );
      const fellowEmail = await getUserEmail(fellowId);
      if (fellowEmail) {
        await safeSendSystemEmail(
          fellowEmail,
          'Grant submission received',
          grantEmailBody
        );
      }
      await safeSendSystemEmail(
        OVER_2K_NOTIFY_EMAIL,
        'New grant request over $2,000',
        grantEmailBody
      );
      if (MONEY_TEAM_EMAILS.length) {
        await safeSendSystemEmail(
          MONEY_TEAM_EMAILS,
          'New >=$2,000 grant queued for Money Team',
          grantEmailBody
        );
      }
    }

    return NextResponse.json(grant, { status: 201 });
  } catch (err: any) {
    console.error('[grants][POST] error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
