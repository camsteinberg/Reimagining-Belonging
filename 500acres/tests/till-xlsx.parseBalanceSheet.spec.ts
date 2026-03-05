import { describe, it, expect } from 'vitest';
import { Row, parseBalanceSheet } from '../lib/till-xlsx';

// Helper: put label in C, assets numeric in H/I, liabilities/equity in Q/R per current parser
const l = (label: string, h=0, i=0): Row => {
  const r: Row = Array(18).fill(null);
  r[2] = label;  // C
  r[7] = h;      // H
  r[8] = i;      // I
  return r;
};
const r = (label: string, q=0, rr=0): Row => {
  const row: Row = Array(18).fill(null);
  row[12] = label; // M (used as right label field)
  row[16] = q;     // Q
  row[17] = rr;    // R
  return row;
};

describe('parseBalanceSheet', () => {
  it('computes totals and net assets; builds liabilities breakdown', () => {
    const rows: Row[] = [
      ['As of June 30, 2025'],
      l('Total Current Assets', 500),
      l('Total Fixed Assets', 300),
      l('Accumulated Depreciation', -100),
      l('Total Assets', 800),
      r('Current Liabilities'),
      r('AP & Accrued', 120),
      r('Long-term Liabilities'),
      r('Loan Payable', 200),
      r('Equity'),
      r('Total Equity', 480),
      r('Total Liabilities and Members Equity', 800),
    ];

    const bs = parseBalanceSheet(rows);
    expect(bs.totals.totalAssets).toBe(800);
    expect(bs.totals.totalLiabilities).toBe(320); // 800 - 480
    expect(bs.totals.netAssets).toBe(480);
    // Breakdown should include AP and Loan
    const names = bs.liabilitiesBreakdown.map(x => x.name);
    expect(names).toContain('AP & Accrued');
    expect(names).toContain('Loan Payable');
  });
});
