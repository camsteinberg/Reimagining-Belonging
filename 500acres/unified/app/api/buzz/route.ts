/*
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !key || !sheetId) {
    return NextResponse.json({ error: 'Missing Google Sheets credentials' }, { status: 500 });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'Form Responses 1'!A4:C`, // ✅ Correct sheet name + range
    });

    const rows = (data.values || []).slice(1).map((r) => ({
      timestamp: r[0] || '',
      score: Number(r[1]) || 0,
      comment: r[2] || '',
    }));

    return NextResponse.json({ rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch Google Sheet data' }, { status: 500 });
  }
}
*/
// app/api/buzz/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !key || !sheetId) {
    return NextResponse.json({ rows: [], monthly: [], error: 'Missing Google Sheets credentials' }, { status: 500 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email, private_key: key },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1) Individual NPS rows (timestamp, score, comment)
    const feedback = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'Form Responses 1'!A4:C`,
    });

    const rows = (feedback.data.values || []).slice(1).map((r) => ({
      timestamp: r[0] || '',
      score: Number(r[1]) || 0,
      comment: r[2] || '',
    }));

    // 2) Monthly NPS (D = month, E = score), starting at row 5
    const monthlyResp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'Form Responses 1'!D5:E`,
    });

    const monthly = (monthlyResp.data.values || [])
      .map((r) => ({
        month: (r[0] || '').toString().trim(),   // e.g. "2025-08"
        score: Number(r[1]) || 0,                // e.g. 35
      }))
      .filter((m) => m.month && !Number.isNaN(m.score));

    return NextResponse.json({ rows, monthly });
  } catch (err) {
    console.error('Buzz GET error:', err);
    return NextResponse.json({ rows: [], monthly: [], error: 'Failed to fetch Google Sheet data' }, { status: 500 });
  }
}

