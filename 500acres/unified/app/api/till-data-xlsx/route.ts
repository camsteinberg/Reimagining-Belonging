// dashboard/app/api/till-data-xlsx/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSession } from '@/lib/getSession';

import {
  Row,
  S_BALANCE,
  S_IS,
  S_CFS,
  S_DI,
  wsToRows,
  parseBalanceSheet,
  parseIncomeStatement,
  parseCashflow,
  parseDetailedIncome,
  combineRowSets,
} from '@/lib/till-xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Accept comma-separated IDs via TILL_FILE_IDS, fallback to single TILL_FILE_ID
    const ids = (process.env.TILL_FILE_IDS ?? process.env.TILL_FILE_ID ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!ids.length || !email || !key) {
      return NextResponse.json(
        { error: 'Missing env: TILL_FILE_IDS/TILL_FILE_ID or GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY' },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email, private_key: key },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // Try each ID; collect all successfully downloaded workbooks
    const workbooks: XLSX.WorkBook[] = [];
    let lastErr: any = null;

    for (const fileId of ids) {
      try {
        const fileRes = await drive.files.get(
          { fileId, alt: 'media', supportsAllDrives: true },
          { responseType: 'arraybuffer' }
        );
        const wb = XLSX.read(Buffer.from(fileRes.data as ArrayBuffer), { type: 'buffer' });
        workbooks.push(wb);
      } catch (e: any) {
        lastErr = e;
      }
    }

    if (!workbooks.length) {
      return NextResponse.json(
        { error: String(lastErr?.message || 'Failed to read any Till workbook from provided IDs') },
        { status: 500 }
      );
    }

    // Pull sheet rows from all successful workbooks
    const bsRowSets: Row[][] = [];
    const isRowSets: Row[][] = [];
    const cfsRowSets: Row[][] = [];
    const diRowSets: Row[][] = [];

    for (const wb of workbooks) {
      const bs = wb.Sheets[S_BALANCE];
      if (bs) bsRowSets.push(wsToRows(bs));

      const is = wb.Sheets[S_IS];
      if (is) isRowSets.push(wsToRows(is));

      const cfs = wb.Sheets[S_CFS];
      if (cfs) cfsRowSets.push(wsToRows(cfs));

      const di = wb.Sheets[S_DI];
      if (di) diRowSets.push(wsToRows(di));
    }

    const latestBsRows = bsRowSets[bsRowSets.length - 1];

    if (!latestBsRows || !isRowSets.length || !cfsRowSets.length || !diRowSets.length) {
      return NextResponse.json(
        {
          error:
            'Required worksheets missing in provided workbooks (need Balance Sheet, Income Statement, Cashflow Statement, Detailed Income Statement)',
        },
        { status: 500 }
      );
    }

    // Align row-sets, keeping original sheets when only one workbook exists
    const isCombined = combineRowSets(isRowSets);
    const cfsCombined = combineRowSets(cfsRowSets);
    const diCombined = combineRowSets(diRowSets);

    const bsRows = latestBsRows;
    const isRows = isCombined.rows;
    const cfsRows = cfsCombined.rows;
    const diRows = diCombined.rows;

    // Parse as usual on the merged rows
    const bs = parseBalanceSheet(bsRows);
    const isData = parseIncomeStatement(isRows, { columnPairs: isCombined.columnPairs });
    const cfsData = parseCashflow(cfsRows, { columnPairs: cfsCombined.columnPairs });
    const diData = parseDetailedIncome(diRows, { columnPairs: diCombined.columnPairs });

    return NextResponse.json({
      asOf: bs.asOf,
      cards: {
        assets: bs.totals.totalAssets,
        liabilities: bs.totals.totalLiabilities,
        netAssets: bs.totals.netAssets,
        revenueYTD: isData.revenueYTD,
        expensesYTD: isData.expensesYTD,
        netIncomeYTD: isData.netIncomeYTD,
        netCashOps: cfsData.latest.operating,
        accumulatedDep: bs.accumulatedDep || 0,
      },
      liabilitiesBreakdown: bs.liabilitiesBreakdown,
      is: { rows: isRows, monthly: isData.monthly, variance: isData.variance },
      cfs: { rows: cfsRows, monthly: cfsData.monthly, latest: cfsData.latest },
      isDetail: { rows: diRows, byCategory: diData.byCategory, byPeriod: diData.byPeriod },
      bs: { rows: bsRows },
    });
  } catch (err: any) {
    console.error('[till-data-xlsx] ERROR:', err?.message);
    return NextResponse.json({ error: err?.message || 'Failed to read Till data' }, { status: 500 });
  }
}
