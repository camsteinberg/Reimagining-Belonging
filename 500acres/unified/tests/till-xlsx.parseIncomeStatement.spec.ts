import { describe, it, expect } from 'vitest';
import { Row, parseIncomeStatement, combineRowSets } from '../lib/till-xlsx';

// Builds rows where the left numeric column is the newest period.
const row = (label: string, olderVal: number, newerVal: number): Row => {
  const r: Row = Array(12).fill('');
  r[2] = label;      // label in col C
  r[9] = olderVal;   // right column (older period)
  r[8] = newerVal;   // left column (newer period)
  return r;
};

const sheetRow = (label: string, olderVal: number, newerVal: number): Row => row(label, olderVal, newerVal);

describe('parseIncomeStatement', () => {
  it('reads total revenue/expenses and computes monthly, YTD, variance', () => {
    const rows: Row[] = [
      row('Total Revenue', 1000, 1200),
      row('Total Expenses', 700, 800),
      row('Net Income', 300, 400),
    ];

    const is = parseIncomeStatement(rows);
    expect(is.monthly).toEqual([
      { month: 'Q1', revenue: 1000, expenses: 700, net: 300 },
      { month: 'Q2', revenue: 1200, expenses: 800, net: 400 },
    ]);
    expect(is.revenueYTD).toBe(2200);
    expect(is.expensesYTD).toBe(1500);
    expect(is.netIncomeYTD).toBe(700);
    expect(is.variance.netMoM).toBe(100);
  });

  it('falls back to rev-exp when Net line is absent', () => {
    const rows: Row[] = [
      row('Total Revenue', 1000, 1100),
      row('Total Expenses', 600, 700),
      // no Net Income row
    ];
    const is = parseIncomeStatement(rows);
    expect(is.monthly[0].net).toBe(400);
    expect(is.monthly[1].net).toBe(400);
  });

  it('builds additional periods when merging multiple workbooks', () => {
    const q2Rows: Row[] = [
      sheetRow('Total Revenue', 1000, 1200),
      sheetRow('Total Expenses', 600, 800),
      sheetRow('Net Income', 400, 400),
    ];
    const q3Rows: Row[] = [
      sheetRow('Total Revenue', 1200, 1900),
      sheetRow('Total Expenses', 800, 1400),
      sheetRow('Net Income', 400, 500),
    ];
    const combined = combineRowSets([q2Rows, q3Rows]);
    const is = parseIncomeStatement(combined.rows, { columnPairs: combined.columnPairs });
    expect(is.monthly.map((m) => m.month)).toEqual(['Q1', 'Q2', 'Q3']);
    expect(is.monthly[2].revenue).toBe(1900);
    expect(is.monthly[2].net).toBe(500);
    expect(is.revenueYTD).toBe(1000 + 1200 + 1900);
    expect(is.variance.netMoM).toBe(100);
  });

  it('treats negative expense cells as positive magnitudes so fallback nets work', () => {
    const rows: Row[] = [
      row('Total Revenue', 2000, 1500),
      row('Total Expenses', -1200, -1800),
      // no net line
    ];
    const is = parseIncomeStatement(rows);
    expect(is.monthly[0]).toEqual({ month: 'Q1', revenue: 2000, expenses: 1200, net: 800 });
    expect(is.monthly[1]).toEqual({ month: 'Q2', revenue: 1500, expenses: 1800, net: -300 });
    expect(is.netIncomeYTD).toBe(500);
  });
});
