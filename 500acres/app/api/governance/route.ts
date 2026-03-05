// app/api/governance/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ----------------- helpers ----------------- */
function toA1Col(colIndex0: number) {
  let x = colIndex0 + 1;
  let s = '';
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}
function ciEq(a?: string, b?: string) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function listSheetTitles(meta: any): string[] {
  const sheets = (meta && meta.data && Array.isArray(meta.data.sheets)) ? meta.data.sheets : [];
  const titles: string[] = [];
  for (const sh of sheets) {
    const props = sh && sh.properties ? sh.properties : undefined;
    const t = props && typeof props.title === 'string' ? props.title : '';
    if (t) titles.push(t);
  }
  return titles;
}
function pickSheetTitle(meta: any, desired?: string | null): string {
  const titles = listSheetTitles(meta);
  const fallback = titles[0] || 'Sheet1';
  if (desired) {
    const hit = titles.find(t => (t || '').trim().toLowerCase() === desired.trim().toLowerCase());
    if (hit) return hit;
  }
  return fallback;
}

/* ----------------- types ----------------- */
type ConflictRow = {
  rowNumber: number;     // 2-based, matches Google row
  date: string;          // A
  name: string;          // B
  type: string;          // C
  details: string;       // D
  solution: string;      // E
  status: string;        // F
};
type ConflictsPayload = {
  sheetTitle: string;
  rows: ConflictRow[];
};

type TopQRow = { rowNumber: number; values: string[] };
type TopQPayload = {
  sheetTitle: string;
  header: string[];
  answerColIndex: number; // -1 if not found
  statusColIndex: number; // -1 if not found
  rows: TopQRow[];
};

const ALLOWED_STATUS = ['Unanswered', 'Needs Forum', 'Answered'] as const;
function normalizeStatus(input?: string): string {
  const v = (input || '').trim().toLowerCase();
  const hit = ALLOWED_STATUS.find(s => s.toLowerCase() === v);
  return hit || 'Unanswered';
}

/* ----------------- GET ----------------- */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const type = req.nextUrl.searchParams.get('type'); // 'directory' | 'conflicts' | 'topq_sheets' | 'topq' | 'questions'(legacy)
  const sheetParam = req.nextUrl.searchParams.get('sheet');

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey      = process.env.GOOGLE_PRIVATE_KEY;
  const govSheetId  = process.env.GOVERNANCE_SHEET_ID;
  const contactsSheetId = process.env.CONTACTS_ID;
  const buzzSheetId = process.env.GOOGLE_SHEET_ID; // legacy
  const topqSheetId = process.env.TOPQ_SHEET_ID;

  const missing = [
    !clientEmail && 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    !rawKey && 'GOOGLE_PRIVATE_KEY',
    type === 'directory' && !contactsSheetId && 'CONTACTS_ID',
    type === 'conflicts' && !govSheetId && 'GOVERNANCE_SHEET_ID',
    type === 'questions' && !buzzSheetId && 'GOGOLE_SHEET_ID', // typo-proofing won't hurt
    (type === 'topq' || type === 'topq_sheets') && !topqSheetId && 'TOPQ_SHEET_ID',
  ].filter(Boolean);

  if (missing.length) {
    return NextResponse.json({ error: `Missing Google credentials: ${missing.join(', ')}` }, { status: 500 });
  }

  const privateKey = rawKey!.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail!, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // ----- Directory (Employee/Board/Mentor/Fellow) -----
    if (type === 'directory') {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: contactsSheetId! });
      const sheetTitle = pickSheetTitle(meta, sheetParam || 'Employee');
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: contactsSheetId!,
        range: `'${sheetTitle}'!A1:Z`,
      });
      const values = (data.values || []) as string[][];
      const header = (values[0] || []) as string[];
      const body = values.slice(1);
      const colIndex = (labels: string[]) => header.findIndex(h => labels.some(l => ciEq(h, l)));
      const nameIdx = colIndex(['name']);
      const roleIdx = colIndex(['role']);
      const locationIdx = colIndex(['location']);
      const emailIdx = colIndex(['email']);
      const phoneIdx = colIndex(['phone', 'phone number']);

      const rows = body
        .map((row) => ({
          name: nameIdx >= 0 ? row[nameIdx] || '' : '',
          role: roleIdx >= 0 ? row[roleIdx] || '' : '',
          location: locationIdx >= 0 ? row[locationIdx] || '' : '',
          email: emailIdx >= 0 ? row[emailIdx] || '' : '',
          phone: phoneIdx >= 0 ? row[phoneIdx] || '' : '',
        }))
        .filter((row) => Object.values(row).some((val) => (val || '').trim() !== ''));

      return NextResponse.json({ sheetTitle, rows }, { status: 200 });
    }

    // ----- Conflicts: fixed A..F, row 2+ -----
    if (type === 'conflicts') {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: govSheetId! });
      const sheetTitle = pickSheetTitle(meta, 'Conflict Resolution Responses');

      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: govSheetId!,
        range: `'${sheetTitle}'!A2:F`,
      });
      const rows = (data.values || []) as string[][];
      const parsed: ConflictRow[] = rows.map((r, idx) => {
        const A = r[0] || '';
        const B = r[1] || '';
        const C = r[2] || '';
        const D = r[3] || '';
        const E = r[4] || '';
        const F = r[5] || '';
        return {
          rowNumber: idx + 2,
          date: A,
          name: B,
          type: C,
          details: D,
          solution: E,
          status: F || 'Open',
        };
      });

      const payload: ConflictsPayload = { sheetTitle, rows: parsed };
      return NextResponse.json(payload, { status: 200 });
    }

    // ----- List all TopQ sheet titles -----
    if (type === 'topq_sheets') {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: topqSheetId! });
      const titles = listSheetTitles(meta);
      return NextResponse.json(titles, { status: 200 });
    }

    // ----- Top Questions (full A:Z + Answer/Status handling) -----
    if (type === 'topq') {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: topqSheetId! });
      const sheetTitle = pickSheetTitle(meta, sheetParam);

      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: topqSheetId!,
        range: `'${sheetTitle}'!A1:Z`,
      });
      const values = data.values || [];
      if (!values.length) {
        const empty: TopQPayload = { sheetTitle, header: [], answerColIndex: -1, statusColIndex: -1, rows: [] };
        return NextResponse.json(empty, { status: 200 });
      }

      const header = values[0] as string[];
      const body = values.slice(1);
      const maxLen = header.length;

      const answerColIndex = header.findIndex(h => ciEq(h, 'Answer'));
      const statusColIndex = header.findIndex(h => ciEq(h, 'Status'));

      const rows: TopQRow[] = body.map((r, i) => {
        const normalized = Array.from({ length: maxLen }, (_, idx) => (r && r[idx] !== undefined ? r[idx] : ''));
        if (statusColIndex >= 0 && !normalized[statusColIndex]) normalized[statusColIndex] = 'Unanswered';
        return { rowNumber: i + 2, values: normalized };
      });

      const payload: TopQPayload = { sheetTitle, header, answerColIndex, statusColIndex, rows };
      return NextResponse.json(payload, { status: 200 });
    }

    // ----- Legacy common questions de-dupe -----
    if (type === 'questions') {
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: buzzSheetId!,
        range: `'Form Responses 1'!C5:C`,
      });
      const rows = (data.values || []) as string[][];
      const map: Record<string, { question: string; count: number }> = {};
      for (const r of rows) {
        const raw = (r && r[0] ? String(r[0]) : '').trim();
        if (!raw || !raw.includes('?')) continue;
        const key = raw.replace(/\s+/g, ' ').trim().toLowerCase();
        map[key] = map[key] ? { question: map[key].question, count: map[key].count + 1 } : { question: raw, count: 1 };
      }
      const result = Object.values(map).sort((a, b) => b.count - a.count || a.question.localeCompare(b.question));
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('Governance GET error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/* ----------------- PATCH (writes back) ----------------- */
/*
 body.kind: 'topq' | 'conflict'
 - kind='topq':     { sheetTitle, rowNumber, answer?, status?, module?, lead? }
 - kind='conflict': { rowNumber, solution?, status? }   // writes to GOVERNANCE_SHEET_ID, tab "Conflict Resolution Responses"
*/
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey      = process.env.GOOGLE_PRIVATE_KEY;
  const topqSheetId = process.env.TOPQ_SHEET_ID;
  const govSheetId  = process.env.GOVERNANCE_SHEET_ID;

  const missing = [
    !clientEmail && 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    !rawKey && 'GOOGLE_PRIVATE_KEY',
    !topqSheetId && 'TOPQ_SHEET_ID',
    !govSheetId && 'GOVERNANCE_SHEET_ID',
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json({ error: `Missing Google credentials: ${missing.join(', ')}` }, { status: 500 });
  }

  const privateKey = rawKey!.replace(/\\n/g, '\n');

  try {
    const body = await req.json() as any;
    const { kind } = body || {};
    if (!kind) return NextResponse.json({ error: 'Missing kind' }, { status: 400 });

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail!, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // --- Update Top Questions (Answer / Status / Module / Lead) ---
    if (kind === 'topq') {
      const sheetTitle: string = body.sheetTitle;
      const rowNumber: number = body.rowNumber;
      if (!sheetTitle || !rowNumber) {
        return NextResponse.json({ error: 'sheetTitle and rowNumber are required' }, { status: 400 });
      }

      const updates: { range: string; values: any[][] }[] = [];

      // Answer
      if (typeof body.answer === 'string') {
        const hdrResp = await sheets.spreadsheets.values.get({ spreadsheetId: topqSheetId!, range: `'${sheetTitle}'!A1:Z1` });
        const header = (hdrResp.data.values?.[0] || []) as string[];
        let idx = header.findIndex(h => ciEq(h, 'Answer'));
        if (idx < 0) {
          idx = header.length;
          const writeHeaderRange = `'${sheetTitle}'!${toA1Col(idx)}1`;
          await sheets.spreadsheets.values.update({
            spreadsheetId: topqSheetId!,
            range: writeHeaderRange,
            valueInputOption: 'RAW',
            requestBody: { values: [['Answer']] },
          });
        }
        updates.push({ range: `'${sheetTitle}'!${toA1Col(idx)}${rowNumber}`, values: [[body.answer]] });
      }

      // Status
      if (typeof body.status === 'string') {
        const hdrResp = await sheets.spreadsheets.values.get({ spreadsheetId: topqSheetId!, range: `'${sheetTitle}'!A1:Z1` });
        const header = (hdrResp.data.values?.[0] || []) as string[];
        let idx = header.findIndex(h => ciEq(h, 'Status'));
        if (idx < 0) {
          idx = header.length;
          const writeHeaderRange = `'${sheetTitle}'!${toA1Col(idx)}1`;
          await sheets.spreadsheets.values.update({
            spreadsheetId: topqSheetId!,
            range: writeHeaderRange,
            valueInputOption: 'RAW',
            requestBody: { values: [['Status']] },
          });
        }
        updates.push({ range: `'${sheetTitle}'!${toA1Col(idx)}${rowNumber}`, values: [[normalizeStatus(body.status)]] });
      }

      // Module
      if (typeof body.module === 'string') {
        const hdrResp = await sheets.spreadsheets.values.get({
          spreadsheetId: topqSheetId!,
          range: `'${sheetTitle}'!A1:Z1`,
        });
        const header = (hdrResp.data.values?.[0] || []) as string[];
        let idx = header.findIndex(h => ciEq(h, 'Module'));
        if (idx < 0) {
          idx = header.length;
          const writeHeaderRange = `'${sheetTitle}'!${toA1Col(idx)}1`;
          await sheets.spreadsheets.values.update({
            spreadsheetId: topqSheetId!,
            range: writeHeaderRange,
            valueInputOption: 'RAW',
            requestBody: { values: [['Module']] },
          });
        }
        updates.push({ range: `'${sheetTitle}'!${toA1Col(idx)}${rowNumber}`, values: [[body.module]] });
      }

      // Lead
      if (typeof body.lead === 'string') {
        const hdrResp = await sheets.spreadsheets.values.get({
          spreadsheetId: topqSheetId!,
          range: `'${sheetTitle}'!A1:Z1`,
        });
        const header = (hdrResp.data.values?.[0] || []) as string[];
        let idx = header.findIndex(h => ciEq(h, 'Lead'));
        if (idx < 0) {
          idx = header.length;
          const writeHeaderRange = `'${sheetTitle}'!${toA1Col(idx)}1`;
          await sheets.spreadsheets.values.update({
            spreadsheetId: topqSheetId!,
            range: writeHeaderRange,
            valueInputOption: 'RAW',
            requestBody: { values: [['Lead']] },
          });
        }
        updates.push({ range: `'${sheetTitle}'!${toA1Col(idx)}${rowNumber}`, values: [[body.lead]] });
      }

      if (!updates.length) return NextResponse.json({ error: 'Nothing to update (answer/status/module/lead missing)' }, { status: 400 });

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: topqSheetId!,
        requestBody: { valueInputOption: 'RAW', data: updates },
      });

      return NextResponse.json({ ok: true, sheetTitle, rowNumber }, { status: 200 });
    }

    // --- Update Conflict Resolution (Solution / Status) ---
    if (kind === 'conflict') {
      const rowNumber: number = body.rowNumber;
      if (!rowNumber) return NextResponse.json({ error: 'rowNumber is required' }, { status: 400 });

      const meta = await sheets.spreadsheets.get({ spreadsheetId: govSheetId! });
      const sheetTitle = pickSheetTitle(meta, 'Conflict Resolution Responses');

      // E = Solution, F = Status
      const writes: { range: string; values: any[][] }[] = [];
      if (typeof body.solution === 'string') {
        writes.push({ range: `'${sheetTitle}'!E${rowNumber}`, values: [[body.solution]] });
      }
      if (typeof body.status === 'string') {
        const val = (body.status || '').trim() || 'Open';
        writes.push({ range: `'${sheetTitle}'!F${rowNumber}`, values: [[val]] });
      }

      if (!writes.length) return NextResponse.json({ error: 'Nothing to update (solution/status missing)' }, { status: 400 });

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: govSheetId!,
        requestBody: { valueInputOption: 'RAW', data: writes },
      });

      return NextResponse.json({ ok: true, sheetTitle, rowNumber }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  } catch (err: any) {
    console.error('Governance PATCH error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/* ----------------- POST (add TopQ row) ----------------- */
/*
 body.kind: 'topq_add'
 body.sheetTitle: string
 body.question: string
 body.module?: string
 body.lead?: string
*/
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey      = process.env.GOOGLE_PRIVATE_KEY;
  const topqSheetId = process.env.TOPQ_SHEET_ID;

  const missing = [
    !clientEmail && 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    !rawKey && 'GOOGLE_PRIVATE_KEY',
    !topqSheetId && 'TOPQ_SHEET_ID',
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json({ error: `Missing Google credentials: ${missing.join(', ')}` }, { status: 500 });
  }
  const privateKey = rawKey!.replace(/\\n/g, '\n');

  try {
    const body = await req.json() as any;
    const { kind, sheetTitle, question, module, lead } = body || {};
    if (kind !== 'topq_add') return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    if (!sheetTitle || !question) return NextResponse.json({ error: 'sheetTitle and question are required' }, { status: 400 });

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail!, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Read header to map/create required columns
    const hdrResp = await sheets.spreadsheets.values.get({
      spreadsheetId: topqSheetId!,
      range: `'${sheetTitle}'!A1:Z1`,
    });
    let header = (hdrResp.data.values?.[0] || []) as string[];

    const ensureCol = async (label: string) => {
      let idx = header.findIndex(h => ciEq(h, label));
      if (idx < 0) {
        idx = header.length;
        const writeHeaderRange = `'${sheetTitle}'!${toA1Col(idx)}1`;
        await sheets.spreadsheets.values.update({
          spreadsheetId: topqSheetId!,
          range: writeHeaderRange,
          valueInputOption: 'RAW',
          requestBody: { values: [[label]] },
        });
        header = [...header, label];
      }
      return header.findIndex(h => ciEq(h, label));
    };

    const qIdx = header.findIndex(h => (h || '').toLowerCase().includes('question'));
    const ansIdx = await ensureCol('Answer');
    const statusIdx = await ensureCol('Status');
    const moduleIdx = await ensureCol('Module');
    const leadIdx = await ensureCol('Lead');
    let dateIdx = header.findIndex(h => (h || '').toLowerCase().includes('date'));
    if (dateIdx < 0) {
      dateIdx = await ensureCol('Date Added');
    }

    // Build row matching header length
    const row = Array.from({ length: header.length }, () => '');
    if (qIdx >= 0) row[qIdx] = String(question);
    row[ansIdx] = '';
    row[statusIdx] = 'Unanswered';
    row[moduleIdx] = module ? String(module) : '';
    row[leadIdx] = lead ? String(lead) : '';
    row[dateIdx] = new Date().toISOString().split('T')[0];

    // Append row
    const appendResp = await sheets.spreadsheets.values.append({
      spreadsheetId: topqSheetId!,
      range: `'${sheetTitle}'!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    // Extract new row number if possible
    const updates = (appendResp.data.updates as any) || {};
    const updatedRange = String(updates.updatedRange || '');
    const m = updatedRange.match(/![A-Z]+(\d+):/);
    const rowNumber = m ? Number(m[1]) : undefined;

    return NextResponse.json({ ok: true, sheetTitle, rowNumber }, { status: 200 });
  } catch (err: any) {
    console.error('Governance POST error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to add row' }, { status: 500 });
  }
}
