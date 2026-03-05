// dashboard/lib/till-xlsx.ts
import * as XLSX from 'xlsx';

export type Row = (string | number | null | undefined)[];

export type PeriodColumnPair = { older?: number; newer?: number };
export type CombinedRowSet = { rows: Row[]; columnPairs: PeriodColumnPair[] };
export type PeriodAwareParseOptions = { columnPairs?: PeriodColumnPair[] };

export const S_BALANCE = 'Balance Sheet';
export const S_IS = 'Income Statement';
export const S_CFS = 'Cashflow Statement';
export const S_DI = 'Detailed Income Statement';

/** Basic numeric coercion that handles 1,234, (1,234), $1,234, etc. */
export const moneyNum = (v: any) =>
  Number(
    String(v ?? '')
      .replace(/,/g, '')
      .replace(/\(/g, '-')
      .replace(/\)/g, '')
      .replace(/[^0-9.\-]/g, '')
  ) || 0;

/** Convert a sheet to raw row arrays (strings, numbers, nulls). */
export const wsToRows = (ws: XLSX.WorkSheet): Row[] =>
  XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false }) as Row[];

/** Build a "label" string by concatenating the first N cells of a row. */
export function leftLabel(r: Row, take = 8) {
  return Array.from({ length: take }, (_, i) => String(r[i] ?? ''))
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Scan a row from right-to-left for the last numeric cell. */
export function rightmostMoney(r: Row): number {
  for (let i = r.length - 1; i >= 0; i--) {
    const n = moneyNum(r[i]);
    if (n !== 0) return n;
  }
  return 0;
}

const MIN_DATA_COLUMN = 4; // skip note/index columns on the far left

/** Heuristically detect the two columns with the most numeric entries, returning [olderIdx, newerIdx]. */
export function detectPeriodCols(rows: Row[]): number[] {
  const numericScore: Record<number, number> = {};
  for (let r = 0; r < Math.min(rows.length, 60); r++) {
    const row = rows[r] || [];
    for (let c = MIN_DATA_COLUMN; c < row.length; c++) {
      const n = moneyNum(row[c]);
      if (n !== 0) numericScore[c] = (numericScore[c] || 0) + 1;
    }
  }
  const ranked = Object.entries(numericScore)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 2)
    .map(([c]) => Number(c));

  if (ranked.length === 0) return [0, 0];
  if (ranked.length === 1) return [ranked[0], ranked[0]];

  // Older (prior period) tends to sit to the right; ensure ordering reflects that.
  const [a, b] = ranked;
  return a >= b ? [a, b] : [b, a];
}

/** Find a row by label regex and pull the numeric from a given col. */
export function readByLabel(rows: Row[], re: RegExp, colIdx?: number): number {
  if (colIdx == null || colIdx < 0) return 0;
  for (const r of rows) {
    const L = leftLabel(r, 8);
    if (re.test(L)) return moneyNum(r[colIdx]);
  }
  return 0;
}

const periodName = (idx: number) => `Q${idx + 1}`;

function deriveTimelineColumns(rows: Row[], columnPairs?: PeriodColumnPair[]): number[] {
  if (columnPairs && columnPairs.length) {
    const timeline: number[] = [];
    const first = columnPairs[0];
    const firstIdx = first.older ?? first.newer;
    if (typeof firstIdx === 'number') timeline.push(firstIdx);
    for (const pair of columnPairs) {
      const next = pair.newer ?? pair.older;
      if (typeof next === 'number') timeline.push(next);
    }
    return timeline;
  }
  return detectPeriodCols(rows);
}

/** ---------------- BALANCE SHEET ---------------- */
export function parseBalanceSheet(rows: Row[]) {
  // "As of" banner
  let asOf = '';
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const text = String((rows[i] || []).join(' '));
    if (/as\s+at|as\s+of/i.test(text)) { asOf = text.trim(); break; }
  }

  // Column helpers (based on current route)
  const COL_H = 7;   // Q2 (left block)
  const COL_I = 8;   // Q1 (left block)
  const COL_Q = 16;  // Q2 (right block)
  const COL_R = 17;  // Q1 (right block)
  const pickLeft = (r: Row) =>
    moneyNum(r[COL_H]) || moneyNum(r[COL_I]) || rightmostMoney(r);
  const pickRight = (r: Row) =>
    moneyNum(r[COL_Q]) || moneyNum(r[COL_R]) || rightmostMoney(r);

  let totalAssets = 0;
  let totalCurrentAssets = 0;
  let totalFixedAssets = 0;
  let totalLiabPlusEquity = 0;
  let totalEquity = 0;
  let accumulatedDep = 0;

  const liabilities: { name: string; amount: number }[] = [];

  type Sect = 'none' | 'liab_current' | 'liab_long' | 'equity';
  let sect: Sect = 'none';

  for (const r of rows) {
    // LEFT (assets)
    const labelLeft = String(r[2] ?? '').trim(); // col C
    if (labelLeft) {
      if (/^total\s+assets$/i.test(labelLeft)) {
        totalAssets = moneyNum(r[COL_H]) || moneyNum(r[COL_I]) || rightmostMoney(r);
      } else if (/^total\s+current\s+assets$/i.test(labelLeft)) {
        totalCurrentAssets = pickLeft(r);
      } else if (/^total\s+fixed\s+assets$/i.test(labelLeft)) {
        totalFixedAssets = pickLeft(r);
      } else if (/^accumulated\s+dep/i.test(labelLeft)) {
        accumulatedDep = pickLeft(r);
      }
    }

    // RIGHT (liabilities + equity)
    const rawRight = String(r[12] ?? r[11] ?? '').trim(); // M or L
    const labelRight = rawRight.replace(/\s+/g, ' ');
    const isHeader =
      /^(liabilities|current liabilities|long[-\s]*term liabilities|equity)\b/i.test(labelRight);
    const isTotal = /^total\b/i.test(labelRight);

    if (/^current liabilities\b/i.test(labelRight)) sect = 'liab_current';
    else if (/^long[-\s]*term liabilities\b/i.test(labelRight)) sect = 'liab_long';
    else if (/^equity\b/i.test(labelRight)) sect = 'equity';

    if (/^total\s+liabilities\s+and\s+members?\s+equity$/i.test(labelRight)) {
      totalLiabPlusEquity = pickRight(r);
    }
    if (/^total\s+equity$/i.test(labelRight)) {
      totalEquity = pickRight(r);
    }

    if ((sect === 'liab_current' || sect === 'liab_long') && labelRight && !isHeader && !isTotal) {
      const looksEquity = /\b(equity|retained\s*earnings|net\s*assets?)\b/i.test(labelRight);
      const looksAssetLeak = /\bright\s+of\s+use\s+asset|asset\b/i.test(labelRight);
      if (!looksEquity && !looksAssetLeak) {
        const amount = pickRight(r);
        if (amount) liabilities.push({ name: labelRight, amount });
      }
    }
  }

  if (!totalAssets && (totalCurrentAssets || totalFixedAssets)) {
    totalAssets = (totalCurrentAssets || 0) + (totalFixedAssets || 0);
  }

  const liabMap = new Map<string, number>();
  for (const { name, amount } of liabilities) {
    const key = name.replace(/\s+/g, ' ').trim();
    liabMap.set(key, Math.max(liabMap.get(key) ?? 0, amount));
  }
  const liabilitiesBreakdown = Array.from(liabMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  let totalLiabilities = 0;
  if (totalLiabPlusEquity && (totalEquity || totalEquity === 0)) {
    totalLiabilities = totalLiabPlusEquity - totalEquity;
  } else if (liabilitiesBreakdown.length) {
    totalLiabilities = liabilitiesBreakdown.reduce((s, x) => s + x.amount, 0);
    if (!totalEquity && totalAssets) totalEquity = totalAssets - totalLiabilities;
  }

  let netAssets = totalEquity;
  if (!netAssets && totalAssets) {
    netAssets = totalAssets - totalLiabilities;
  }

  return {
    asOf,
    totals: { totalAssets, totalLiabilities, netAssets },
    accumulatedDep,
    liabilitiesBreakdown,
    rows,
  };
}

/** ---------------- INCOME STATEMENT ---------------- */
export function parseIncomeStatement(
  rows: Row[],
  opts: PeriodAwareParseOptions = {}
) {
  const periodCols = deriveTimelineColumns(rows, opts.columnPairs);
  const get = (re: RegExp, col?: number) => readByLabel(rows, re, col);

  const monthly = periodCols.map((colIdx, idx) => {
    const revenue = get(/^total\s+receipts|^total\s+revenue/i, colIdx);
    const expensesRaw = get(/^total\s+expenses/i, colIdx);
    const expenses = Math.abs(expensesRaw);
    const netLine = get(/^(net\s+(excess|income)|surplus)/i, colIdx);
    const net = netLine || (revenue - expenses);
    return { month: periodName(idx), revenue, expenses, net };
  });

  const revenueYTD = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const expensesYTD = monthly.reduce((sum, m) => sum + m.expenses, 0);
  const netIncomeYTD = monthly.reduce((sum, m) => sum + m.net, 0);

  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const variance = {
    revenueMoM: last && prev ? last.revenue - prev.revenue : 0,
    expensesMoM: last && prev ? last.expenses - prev.expenses : 0,
    netMoM: last && prev ? last.net - prev.net : 0,
  };

  return { rows, monthly, revenueYTD, expensesYTD, netIncomeYTD, variance };
}

/** ---------------- CASHFLOW ---------------- */
export function parseCashflow(
  rows: Row[],
  opts: PeriodAwareParseOptions = {}
) {
  const periodCols = deriveTimelineColumns(rows, opts.columnPairs);
  const pick = (re: RegExp, col?: number) => readByLabel(rows, re, col);

  const monthly = periodCols.map((colIdx, idx) => ({
    month: periodName(idx),
    operating: pick(/^net\s+cash\s+flow\s+from\s+operating/i, colIdx),
    investing: pick(/^net\s+cash\s+flow\s+from\s+investing/i, colIdx),
    financing: pick(/^net\s+cash\s+flow\s+from\s+financing/i, colIdx),
  }));
  const latest = monthly[monthly.length - 1] ?? {
    month: periodName(0),
    operating: 0,
    investing: 0,
    financing: 0,
  };
  return { rows, monthly, latest };
}

/** ---------------- DETAILED INCOME ---------------- */
export function parseDetailedIncome(
  rows: Row[],
  opts: PeriodAwareParseOptions = {}
) {
  const periodCols = deriveTimelineColumns(rows, opts.columnPairs);
  const collectForCol = (colIdx?: number) => {
    const categories: { category: string; amount: number }[] = [];
    if (typeof colIdx !== 'number') return categories;
    for (const r of rows) {
      const label = leftLabel(r, 6);
      if (!label || /^total\b/i.test(label)) continue;
      const amt = moneyNum(r[colIdx]);
      if (amt) categories.push({ category: label, amount: amt });
    }
    categories.sort((a, b) => b.amount - a.amount);
    return categories;
  };

  const byPeriod = periodCols.map((colIdx, idx) => ({
    month: periodName(idx),
    categories: collectForCol(colIdx),
  }));
  const latest = byPeriod[byPeriod.length - 1]?.categories ?? collectForCol(periodCols[0]);

  return { rows, byCategory: latest, byPeriod };
}

/** Merge many row-sets by label, appending numeric columns so newer datasets end up to the right. */
export function mergeRowsByLabel(rowSets: Row[][]): CombinedRowSet {
  if (!rowSets.length) return { rows: [], columnPairs: [] };

  // Build label index from union of all datasets (order by first appearance)
  const labelToIndex = new Map<string, number>();
  const labels: string[] = [];
  const LABEL_TAKE = Math.max(4, MIN_DATA_COLUMN);
  const stableLabel = (row: Row) => {
    const trimmed = leftLabel(row, LABEL_TAKE);
    return trimmed || leftLabel(row, 8);
  };
  const ensure = (L: string) => {
    if (!labelToIndex.has(L)) {
      labelToIndex.set(L, labels.length);
      labels.push(L);
    }
  };
  for (const rows of rowSets) {
    for (const r of rows) {
      const L = stableLabel(r);
      if (L) ensure(L);
    }
  }

  if (!labels.length) return { rows: [], columnPairs: [] };

  // Keep numbers far to the right of the label zone that leftLabel(..., 8) scans
  const LABEL_COL = 2;   // place label at column C
  const LEFT_PAD = 14;   // reserve enough left cells so pushes start beyond index 13
  const merged: Row[] = labels.map(L => {
    const row: Row = Array(LEFT_PAD).fill(null);
    row[LABEL_COL] = L;
    return row;
  });
  const columnPairs: PeriodColumnPair[] = [];

  // For each dataset, append its two latest numeric columns
  for (const rows of rowSets) {
    const [colOld, colNew] = detectPeriodCols(rows);
    const seen = new Set<string>();
    const baseIdx = merged[0]?.length ?? LEFT_PAD;

    for (const r of rows) {
      const L = stableLabel(r);
      if (!L) continue;
      seen.add(L);
      const idx = labelToIndex.get(L)!;
      merged[idx].push(r[colOld] ?? null, r[colNew] ?? null);
    }

    // pad labels not present in this dataset to keep column alignment
    for (const L of labels) if (!seen.has(L)) {
      const idx = labelToIndex.get(L)!;
      merged[idx].push(null, null);
    }

    columnPairs.push({ older: baseIdx, newer: baseIdx + 1 });
  }

  return { rows: merged, columnPairs };
}

/** Helper that keeps original rows when only one dataset is present. */
export function combineRowSets(rowSets: Row[][]): CombinedRowSet {
  if (!rowSets.length) return { rows: [], columnPairs: [] };
  if (rowSets.length === 1) {
    const rows = rowSets[0];
    const [older, newer] = detectPeriodCols(rows);
    return { rows, columnPairs: [{ older, newer }] };
  }
  return mergeRowsByLabel(rowSets);
}

