import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/getSession';

type DocRow = {
  id: number;
  grant_id: number;
  file_name: string | null;
  file_data_base64: string | null;
  created_at: string;
};

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

const toErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const grantId = Number(id);
    if (!Number.isFinite(grantId) || grantId <= 0) {
      return NextResponse.json({ error: 'bad_request', detail: 'invalid id' }, { status: 400 });
    }

    await ensureSupportingDocsTable();

    const rows = (await sql`
      SELECT
        id,
        grant_id,
        file_name,
        file_data_base64,
        created_at::text AS created_at
      FROM fellowship_grant_supporting_docs
      WHERE grant_id = ${grantId}
      ORDER BY id ASC
    `) as DocRow[];

    return NextResponse.json(rows);
  } catch (err) {
    console.error('[fellowship/grants/supporting-docs][GET]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const grantId = Number(id);
    if (!Number.isFinite(grantId) || grantId <= 0) {
      return NextResponse.json({ error: 'bad_request', detail: 'invalid id' }, { status: 400 });
    }

    const body = await req.json();
    const fileName =
      typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : null;
    const fileDataBase64 = typeof body.fileDataBase64 === 'string' ? body.fileDataBase64 : null;

    if (!fileDataBase64) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'fileDataBase64 is required' },
        { status: 400 }
      );
    }

    await ensureSupportingDocsTable();

    // Verify ownership
    const [owner] = (await sql`
      SELECT fellow_id::text AS fellow_id FROM fellowship_grants WHERE id = ${grantId}
    `) as { fellow_id: string }[];

    if (!owner) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (session.role !== 'admin' && owner.fellow_id !== session.userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const [row] = (await sql`
      INSERT INTO fellowship_grant_supporting_docs (grant_id, file_name, file_data_base64)
      VALUES (${grantId}, ${fileName}, ${fileDataBase64})
      RETURNING
        id,
        grant_id,
        file_name,
        file_data_base64,
        created_at::text AS created_at
    `) as DocRow[];

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('[fellowship/grants/supporting-docs][POST]', err);
    return NextResponse.json(
      { error: 'internal_error', detail: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
