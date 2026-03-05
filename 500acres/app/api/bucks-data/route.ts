import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = (string | number)[];

type DcfItem = { name: string; values: number[] };
type DcfSection = { title: string; sourceTab: string; columns: string[]; items: DcfItem[]; totals?: number[] };

type ParseNote = {
  tab: string;
  headerRowIndex: number | null;
  rowsParsed: number;
  columnsParsed: number;
  strategy: string;
  notes?: string;
};

type DebugNote = {
  allSheetTitles: string[];
  chosenConsolidatedTab?: string;
  parseNotes: ParseNote[];
  errors: string[];
};

type Kpis = {
  npv: number | null;
  irr: number | null;           // decimal (0.12 = 12%)
  paybackYears: number | null;  // years
  depreciationTotal: number | null;
  notes?: string[];
};

type ExpectedRow = { case: string; capex: number | null; betaCF: number | null; er: number | null };
type OutcomeRow = {
  case: string; units: number | null; terminalValue: number | null; npv: number | null;
  irr: number | null; npvExTv: number | null; irr2: number | null; eR: number | null; roiFcf: number | null; roa: number | null;
};
type ProjectSummaryRow = { project: string; npv: number | null; irr: number | null };

function norm(s?: any) { return String(s ?? '').trim(); }

// ---------- Sheets helpers ----------
async function listSheetTitles(fileId: string, auth: any): Promise<string[]> {
  const sheetsApi = google.sheets({ version: 'v4', auth });
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId: fileId });
  return (meta.data.sheets || []).map((s) => norm(s.properties?.title)).filter(Boolean);
}

async function readRange(fileId: string, auth: any, tab: string, a1?: string): Promise<Row[]> {
  const sheets = google.sheets({ version: 'v4', auth });
  const tries = [
    a1 ? `'${tab}'!${a1}` : '',
    `'${tab}'`,
    `'${tab}'!A1:ZZZ999`,
    `'${tab}'!A1:Z999`,
  ].filter(Boolean);
  for (const r of tries) {
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: fileId, range: r });
      return (res.data.values || []) as Row[];
    } catch { /* try next */ }
  }
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: fileId, range: `'${tab}'` });
  return (res.data.values || []) as Row[];
}

async function readCell(fileId: string, auth: any, tab: string, a1: string): Promise<string | number | null> {
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: fileId, range: `'${tab}'!${a1}` });
    const v = res.data.values?.[0]?.[0];
    return (v == null) ? null : v;
  } catch {
    return null;
  }
}

function moneyNum(v: any) {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const parenNeg = /^\(.*\)$/.test(s);
  const n = Number(s.replace(/[^0-9.\-]/g, ''));
  const val = Number.isFinite(n) ? n : 0;
  return parenNeg ? -Math.abs(val) : val;
}
function pctNum(v: any): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (/%$/.test(s)) {
    const n = Number(s.replace(/[% ,]/g, ''));
    return Number.isFinite(n) ? n / 100 : null;
  }
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// ---------- header find ----------
function looksLikeHeaderRow(r: Row): boolean {
  const cells = r.map(norm);
  const nonEmpty = cells.filter(Boolean);
  if (nonEmpty.length < 2) return false;
  const score = cells.reduce((acc, c) => {
    if (/^\d{4}$/.test(c)) return acc + 2;
    if (/est/i.test(c)) return acc + 1;
    if (/last\s*12\s*month/i.test(c)) return acc + 2;
    if (/actual/i.test(c)) return acc + 1;
    if (/year\s*\d+/i.test(c)) return acc + 1;
    return acc;
  }, 0);
  return score >= 3;
}

function bruteHeader(rows: Row[]) {
  const maxTry = Math.min(250, rows.length - 1);
  let best: any = { idx: -1, firstCol: 0, columns: [] as string[], items: [] as DcfItem[], score: -1 };

  for (let i = 0; i <= maxTry; i++) {
    const r = rows[i] || [];
    if (!looksLikeHeaderRow(r)) continue;

    let firstCol = 0;
    for (let c = 0; c < r.length; c++) if (norm(r[c])) { firstCol = c; break; }

    const headers = r.slice(firstCol).map(norm);
    const body = rows.slice(i + 1);
    const items: DcfItem[] = [];

    const columns = headers;

    for (const rr of body) {
      const padded = Array.from({ length: firstCol + columns.length }, (_, k) => rr[k] ?? '');
      const nameInA = norm(padded[0]);
      const vals = padded.slice(firstCol).map(moneyNum);
      const anyVal = vals.some((v) => v !== 0);
      const anyText = padded.some((c) => norm(c));
      if (!anyText && !anyVal) continue;

      let label = nameInA;
      if (!label) for (let c = 0; c < firstCol; c++) if (norm(padded[c])) { label = norm(padded[c]); break; }
      if (!label) continue;

      items.push({ name: label, values: vals });
    }

    const score = items.length * 10 + columns.length * 2;
    if (items.length && columns.length >= 2 && score > best.score) {
      best = { idx: i, firstCol, columns, items, score };
    }
  }

  if (best.idx >= 0) return { ...best, strategy: 'BF:0..250:wide' };
  return { idx: 0, firstCol: 0, columns: [], items: [], strategy: 'fallback:row0' };
}

function inferYearLabels(_r: Row[], _i: number, _f: number, columns: string[]) {
  return [...columns];
}

// ---------- slicing ----------
const STOP_AT_SECTION =
  /(revenue|sales|cogs|cost\s*of\s*(goods?|good|sales)|operating\s*exp|opex|overhead|depr|depreciation|ebit|ebitda|capex|working\s*capital|free\s*cash\s*flow|fcff|present\s*value|discount|wacc|npv|terminal)/i;

function sliceBySectionMarkers(all: DcfItem[], titleRegex: RegExp): DcfItem[] {
  const out: DcfItem[] = [];
  let active = false;
  for (const it of all) {
    const label = norm(it.name);
    const isHeader = titleRegex.test(label);
    const isBlank = !label && it.values.every((v) => v === 0);

    if (isHeader) { active = true; continue; }
    if (active) {
      if (isBlank) break;
      if (STOP_AT_SECTION.test(label) && !titleRegex.test(label)) break;
      out.push(it);
    }
  }
  return out;
}

function buildSection(title: string, sourceTab: string, columns: string[], items: DcfItem[]): DcfSection | null {
  if (!items.length) return null;
  const colCount = Math.max(0, ...items.map((it) => it.values.length));
  const totals =
    colCount > 0
      ? Array.from({ length: colCount }, (_, i) =>
          items.reduce((acc, it) => acc + (Number(it.values[i] ?? 0) || 0), 0)
        )
      : [];
  return { title, sourceTab, columns, items, totals };
}

function parsePctOrNum(v: string | number | null): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const s = v.trim();
  if (!s) return null;
  const t = s.replace(/[$, ]/g, '');
  if (/%$/.test(t)) return Number(t.replace('%', '')) / 100;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function depreciationLatestTotal(secs: DcfSection[] | undefined): number | null {
  if (!secs) return null;
  const dep = secs.find(s => /depr|depreciation/i.test(s.title));
  if (!dep) return null;
  const colCount = dep.columns.length;
  if (!colCount) return null;
  let idx = colCount - 1;
  for (; idx >= 0; idx--) {
    const colSum = dep.items.reduce((a,it)=>a+(Number(it.values[idx]||0)),0);
    if (Math.abs(colSum) > 1e-9) return colSum;
  }
  return 0;
}

// ---- extract titled table from Dashboard ----
type ExtractedTable = { headerRow: number; header: Row; data: Row[] };

function extractLabeledTable(rows: Row[], headerRegex: RegExp): ExtractedTable | null {
  const H = rows.length, W = rows[0]?.length ?? 0;
  let start = -1;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (headerRegex.test(norm(rows[r]?.[c]))) { start = r; break; }
    }
    if (start >= 0) break;
  }
  if (start < 0) return null;

  let head = -1;
  for (let r = start; r < Math.min(H, start + 10); r++) {
    const hasKey = (rows[r] || []).some((x) => /\b(case|project)s?\b/i.test(norm(x)));
    if (hasKey) { head = r; break; }
  }
  if (head < 0) return null;

  const out: Row[] = [];
  for (let r = head + 1; r < Math.min(H, head + 25); r++) {
    const first = norm(rows[r]?.[0]) || norm(rows[r]?.[1]) || norm(rows[r]?.[2]) || norm(rows[r]?.[3]);
    const isBlank = !first;
    if (isBlank) break;
    out.push(rows[r] || []);
  }
  return { headerRow: head, header: rows[head] || [], data: out };
}

function findColumnIndex(header: Row, patterns: RegExp | RegExp[], fallback?: number[]): number | null {
  const lookups = Array.isArray(patterns) ? patterns : [patterns];
  for (const pattern of lookups) {
    for (let i = 0; i < header.length; i++) {
      if (pattern.test(norm(header[i]))) return i;
    }
  }
  if (fallback) {
    for (const idx of fallback) {
      if (idx >= 0) return idx;
    }
  }
  return null;
}

function readCellFromRow(row: Row, idx: number | null): any {
  if (idx == null || idx < 0) return undefined;
  return row[idx];
}

function parseNumberLike(value: any): number | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const n = Number(s.replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// ---------- API ----------
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const which = (url.searchParams.get('which') || 'acres').toLowerCase(); // 'acres' | 'camel' | 'wander'
  const list = url.searchParams.get('list') === '1';
  const rawDump = url.searchParams.get('raw') === '1';

  const debug: DebugNote = { allSheetTitles: [], parseNotes: [], errors: [] };

  try {
    const primaryFiveAcreId = process.env.BUCKS_SHEET_ID || process.env.FIVEACRE_FILE_ID;
    const fileId =
      which === 'camel'  ? process.env.CAMEL_DCF_ID  :
      which === 'wander' ? process.env.WANDER_DCF_ID :
                           primaryFiveAcreId;

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!fileId || !email || !key) {
      return NextResponse.json(
        { ok: false, error: 'Missing envs (need GOOGLE creds and FIVEACRE_FILE_ID / CAMEL_DCF_ID / WANDER_DCF_ID)' },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email, private_key: key },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const titles = await listSheetTitles(fileId, auth);
    debug.allSheetTitles = titles;

    if (list) return NextResponse.json({ ok: true, titles });

    // Choose main tab
    const consolidated =
      which === 'camel'
        ? (titles.find(t => /dcf\s*model/i.test(t)) || titles[0])
      : which === 'wander'
        ? (titles.find(t => /(dcf|base\s*case|perpetual)/i.test(t)) || titles[0])
      : (titles.find((t) => /consolidated.*dcf|consolidated|summary/i.test(t)) ||
         titles.find((t) => /500acres.*cf|fund.*cf/i.test(t)) ||
         titles[0]);

    debug.chosenConsolidatedTab = consolidated;

    // WANDER (KPI-only)
    if (which === 'wander') {
      const kpis: Kpis = { npv: null, irr: null, paybackYears: null, depreciationTotal: 0 };
    const acresId = process.env.BUCKS_SHEET_ID || process.env.FIVEACRE_FILE_ID;
      if (acresId) {
        const npvWC = await readCell(acresId, auth, 'Dashboard', 'E12');
        kpis.npv = parsePctOrNum(npvWC);
      }
      return NextResponse.json({ ok: true, which, dcfSections: [], kpis, debug });
    }

    // For Acres & Camel, parse as before (Camel returns early).
    const rows = await readRange(fileId, auth, consolidated);
    if (!rows.length) {
      debug.errors.push(`Tab "${consolidated}" has no data.`);
      return NextResponse.json({ ok: true, which, dcfSections: [], kpis: { npv: null, irr: null, paybackYears: null, depreciationTotal: null }, debug });
    }

    if (rawDump) return NextResponse.json({ ok: true, which, rawPreview: rows.slice(0, 80) });

    const p = bruteHeader(rows);
    const columns = inferYearLabels(rows, p.idx, p.firstCol, p.columns);
    debug.parseNotes.push({
      tab: consolidated, headerRowIndex: p.idx, rowsParsed: p.items.length, columnsParsed: columns.length, strategy: p.strategy, notes: `firstCol=${p.firstCol}`,
    });

    const allItems = p.items;
    const sections: DcfSection[] = [];
    const add = (title: string, regex: RegExp, postFilter?: (x: DcfItem) => boolean) => {
      let items = sliceBySectionMarkers(allItems, regex);
      if (postFilter) items = items.filter(postFilter);
      const sec = buildSection(title, consolidated, columns, items);
      if (sec) sections.push(sec);
    };

    let kpis: Kpis = { npv: null, irr: null, paybackYears: null, depreciationTotal: null, notes: [] };

    if (which === 'camel') {
      add('Revenue / Sales', /^Revenue\b/i, (x) => !/(^|\b)(cogs|cost\s*of\s*(goods?|good|sales))(\b|$)/i.test(x.name));
      add('COGS', /^COGS\b/i);
      add('Operating Expenses', /^Operating\s*Expenses\b/i);
      add('Depreciation', /(depr|depreciation)/i);

      // Inject PV section for camel
      const fcff = [-2981827, -4435068, -3397866, 3033470, 3157290, 3325863, 3503254, 3689917, 47046442];
      const df   = [0.9091, 0.8264, 0.7513, 0.6830, 0.6209, 0.5645, 0.5132, 0.4665, 0.4665];
      const pvp  = [-2710752, -3665346, -2552867, 2071901, 1960428, 1877363, 1797723, 1721374, 21947512.21];
      sections.push({ title: 'Present Value of the Project', sourceTab: consolidated, columns: ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Terminal'], items: [
        { name: 'FCFF', values: fcff },
        { name: 'Discounted Factor', values: df },
        { name: 'Present Value of the Project', values: pvp },
      ]});
      const camelIrrTab = titles.find(t => /payback.*irr/i.test(t)) || 'Payback Period & IRR';
      const paybackRaw = await readCell(fileId, auth, camelIrrTab, 'D16');
      const irrRaw     = await readCell(fileId, auth, camelIrrTab, 'D27');
      kpis.npv = pvp.reduce((a, b) => a + (Number(b) || 0), 0);
      kpis.irr = parsePctOrNum(irrRaw);
      kpis.paybackYears = parsePctOrNum(paybackRaw);
      kpis.depreciationTotal = depreciationLatestTotal(sections);

      return NextResponse.json({ ok: true, which, dcfSections: sections, kpis, debug });
    }

    // 500 Acres sections (not shown in UI now, but harmless to keep)
    add('Revenue / Sales', /(revenue|sales)/i, (x) => !/(^|\b)(cogs|cost\s*of\s*(goods?|good|sales))(\b|$)/i.test(x.name));
    add('Cost of Goods Sold', /(cogs|cost\s*of\s*(goods?|good|sales))/i);
    add('Depreciation', /(depr|depreciation)/i);
    add('Overhead / OpEx', /(overhead|op.?ex|operating\s*exp)/i);
    add('Earnings', /(ebit|ebitda)/i);
    add('CapEx', /\bcapex\b|capital\s*expend/i);
    add('Working Capital', /(working\s*capital)/i);
    add('Free Cash Flow to Firm', /(free\s*cash\s*flow|fcff|cash\s*flow\s*to\s*firm)/i);
    add('Valuation', /(wacc|discount\s*rate|discount\s*factor)/i);

    // KPI cells for acres (not directly used in the new UI)
    const npvCell = await readCell(fileId, auth, 'Dashboard', 'E11');
    const irrCell = await readCell(fileId, auth, 'Dashboard', 'F11');
    kpis.npv = parsePctOrNum(npvCell);
    kpis.irr = parsePctOrNum(irrCell);
    kpis.paybackYears = null;
    kpis.depreciationTotal = depreciationLatestTotal(sections);

    // ---- NEW Dashboard pulls (three boxes) ----
    const dash = await readRange(fileId, auth, 'Dashboard', 'A1:O200');

    // 1) Summary Dashboard -> Project NPV/IRR
    const sumBlock = extractLabeledTable(dash, /Summary\s*Dashboard/i);
    const projectSummary: ProjectSummaryRow[] = [];
    if (sumBlock) {
      const header = sumBlock.header;
      const projectIdx = findColumnIndex(header, [/project/i], [0, 1, 2, 3, 4]);
      const npvIdx = findColumnIndex(header, [/npv/i], [4, 5, 6]);
      const irrIdx = findColumnIndex(header, [/irr/i], [5, 6, 7]);
      for (const r of sumBlock.data) {
        const pName = norm(readCellFromRow(r, projectIdx));
        if (!pName) continue;
        const npv = moneyNum(readCellFromRow(r, npvIdx));
        const irr = pctNum(readCellFromRow(r, irrIdx));
        projectSummary.push({ project: pName, npv, irr });
      }
    }
    if (projectSummary.length === 0) {
      for (let row = 9; row <= 14; row++) {
        const project = norm(dash[row]?.[3]);
        if (!project) continue;
        const npv = moneyNum(dash[row]?.[4]);
        const irr = pctNum(dash[row]?.[5]);
        projectSummary.push({ project, npv, irr });
      }
    }

    const innovatorId = process.env.INNOVATOR_ID;
    let innovatorNpv: number | null = null;
    let innovatorIrr: number | null = null;
    if (innovatorId) {
      const innovatorNpvRaw = await readCell(innovatorId, auth, 'Discounted CF Model', 'D31');
      const innovatorIrrRaw = await readCell(innovatorId, auth, 'Discounted CF Model', 'D32');
      innovatorNpv =
        innovatorNpvRaw == null || String(innovatorNpvRaw).trim() === '' ? null : moneyNum(innovatorNpvRaw);
      innovatorIrr =
        innovatorIrrRaw == null || String(innovatorIrrRaw).trim() === '' ? null : parsePctOrNum(innovatorIrrRaw);
    }

    const normalizedProjectSummary = projectSummary.map((row) => {
      if (!/barndosonly/i.test(row.project || '')) return row;
      return {
        ...row,
        project: 'Innovator Barndo',
        npv: innovatorNpv ?? row.npv,
        irr: innovatorIrr ?? row.irr,
      };
    });

    // Hide Outpost entries from the NPV/IRR summary in the Till
    const filteredProjectSummary = normalizedProjectSummary.filter((row) => !/outpost/i.test(row.project || ''));

    // 2) Expected Rate of Return
    const erBlock = extractLabeledTable(dash, /Expected\s*Rate\s*of\s*Return/i);
    const expectedReturn: ExpectedRow[] = [];
    if (erBlock) {
      const header = erBlock.header;
      const caseIdx = findColumnIndex(header, [/case/i], [0, 1, 2, 3]);
      const capexIdx = findColumnIndex(header, [/cap\s*ex/i], [4, 5, 10]);
      const betaIdx = findColumnIndex(header, [/beta\s*cf/i], [5, 6, 11]);
      const erIdx = findColumnIndex(header, [/expected\s*return|^e\[?r\]?$/i, /\bER\b/i], [6, 7, 12]);
      for (const r of erBlock.data) {
        const label = norm(readCellFromRow(r, caseIdx));
        if (!label) continue;
        const capex = moneyNum(readCellFromRow(r, capexIdx));
        const betaCF = moneyNum(readCellFromRow(r, betaIdx));
        const er = pctNum(readCellFromRow(r, erIdx));
        expectedReturn.push({ case: label, capex, betaCF, er });
      }
    }
    if (expectedReturn.length === 0) {
      for (let row = 21; row <= 25; row++) {
        const label = norm(dash[row]?.[3]);
        if (!label) continue;
        const capex = moneyNum(dash[row]?.[4]);
        const betaCF = moneyNum(dash[row]?.[5]);
        const er = pctNum(dash[row]?.[6]);
        expectedReturn.push({ case: label, capex, betaCF, er });
      }
    }

    // 3) 500 Acres Comprehensive Outcomes
    const coBlock = extractLabeledTable(dash, /Comprehensive\s*Outcomes/i);
    const comprehensiveOutcomes: OutcomeRow[] = [];
    if (coBlock) {
      const header = coBlock.header;
      const caseIdx = findColumnIndex(header, [/case/i], [0, 1, 2, 3]);
      const unitsIdx = findColumnIndex(header, [/unit/i], [4, 5]);
      const terminalIdx = findColumnIndex(header, /terminal/i, [5, 6]);
      const npvIdx = findColumnIndex(header, [/npv\b(?!.*ex)/i], [6, 7]);
      const irrIdx = findColumnIndex(header, [/^irr\b/i], [7, 8]);
      const npvExIdx = findColumnIndex(header, [/npv.*ex/i, /exclud/i], [8, 9]);
      const irr2Idx = findColumnIndex(header, [/irr.*2|irr.*\(2\)|secondary\s*irr/i, /irr\b.*irr/i], [9, 10]);
      const erIdx = findColumnIndex(header, [/\be\[?r\]?\b/i, /expected\s*return/i], [10, 11]);
      const roiIdx = findColumnIndex(header, [/roi/i], [11, 12]);
      const roaIdx = findColumnIndex(header, [/roa/i], [12, 13]);

      for (const r of coBlock.data) {
        const label = norm(readCellFromRow(r, caseIdx));
        if (!label) continue;
        const units = parseNumberLike(readCellFromRow(r, unitsIdx));
        const terminalValue = moneyNum(readCellFromRow(r, terminalIdx));
        const npv = moneyNum(readCellFromRow(r, npvIdx));
        const irr = pctNum(readCellFromRow(r, irrIdx));
        const npvExTv = moneyNum(readCellFromRow(r, npvExIdx));
        const irr2 = pctNum(readCellFromRow(r, irr2Idx));
        const eR = pctNum(readCellFromRow(r, erIdx));
        const roiFcf = pctNum(readCellFromRow(r, roiIdx));
        const roa = pctNum(readCellFromRow(r, roaIdx));
        comprehensiveOutcomes.push({ case: label, units, terminalValue, npv, irr, npvExTv, irr2, eR, roiFcf, roa });
      }
    }
    if (comprehensiveOutcomes.length === 0) {
      for (let row = 30; row <= 35; row++) {
        const label = norm(dash[row]?.[3]);
        if (!label) continue;
        const units = parseNumberLike(dash[row]?.[4]);
        const terminalValue = moneyNum(dash[row]?.[5]);
        const npv = moneyNum(dash[row]?.[6]);
        const irr = pctNum(dash[row]?.[7]);
        const npvExTv = moneyNum(dash[row]?.[8]);
        const irr2 = pctNum(dash[row]?.[9]);
        const eR = pctNum(dash[row]?.[10]);
        const roiFcf = pctNum(dash[row]?.[11]);
        const roa = pctNum(dash[row]?.[12]);
        comprehensiveOutcomes.push({ case: label, units, terminalValue, npv, irr, npvExTv, irr2, eR, roiFcf, roa });
      }
    }

    return NextResponse.json({
      ok: true,
      which,
      dcfSections: sections,
      kpis,
      projectSummary: filteredProjectSummary,
      expectedReturn,
      comprehensiveOutcomes,
      debug
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'bucks-data failed unexpectedly' },
      { status: 200 }
    );
  }
}
