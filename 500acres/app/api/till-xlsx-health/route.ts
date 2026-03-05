// dashboard/app/api/till-xlsx-health/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Accept comma-separated IDs via TILL_FILE_IDS, fallback to single TILL_FILE_ID
    const ids = (process.env.TILL_FILE_IDS ?? process.env.TILL_FILE_ID ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!ids.length || !email || !key) {
      return NextResponse.json(
        {
          ok: false,
          step: 'env',
          fileIdsSet: ids.length > 0,
          emailSet: !!email,
          keySet: !!key,
        },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email, private_key: key },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // Try each ID until one returns metadata successfully
    let meta: any = null;
    let lastErr: any = null;
    for (const fileId of ids) {
      try {
        const m = await drive.files.get({
          fileId,
          fields: 'id,name,mimeType,owners(emailAddress),permissions',
          supportsAllDrives: true,
        });
        meta = { id: m.data.id, name: m.data.name, mimeType: m.data.mimeType, owners: m.data.owners, permissions: m.data.permissions };
        break;
      } catch (e: any) {
        lastErr = e;
      }
    }

    if (!meta) {
      return NextResponse.json(
        {
          ok: false,
          step: 'api',
          error: String(lastErr?.message || 'All fileIds failed'),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, meta });
  } catch (err: any) {
    console.error('[till-xlsx-health] ERROR:', err?.message);
    return NextResponse.json(
      { ok: false, step: 'api', error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
