import { describe, it, expect } from 'vitest';
import { Row, parseDetailedIncome, combineRowSets } from '../lib/till-xlsx';

const sheetRow = (label: string, older: number, newer: number): Row => {
  const r: Row = Array(12).fill('');
  r[2] = label;
  r[9] = older;
  r[8] = newer;
  return r;
};

describe('parseDetailedIncome', () => {
  it('returns the latest period categories sorted descending', () => {
    const rows: Row[] = [
      sheetRow('Admin Expense', 300, 500),
      sheetRow('Program Expense', 700, 200),
      sheetRow('Total Expenses', 1000, 700),
    ];

    const detail = parseDetailedIncome(rows);
    expect(detail.byCategory.map((c) => c.category)).toEqual(['Admin Expense', 'Program Expense']);
    expect(detail.byCategory.map((c) => c.amount)).toEqual([500, 200]);
  });

  it('captures categories for each available period', () => {
    const q2Rows: Row[] = [
      sheetRow('Admin Expense', 100, 200),
      sheetRow('Program Expense', 400, 500),
    ];
    const q3Rows: Row[] = [
      sheetRow('Admin Expense', 200, 250),
      sheetRow('Program Expense', 500, 450),
    ];
    const combined = combineRowSets([q2Rows, q3Rows]);
    const detail = parseDetailedIncome(combined.rows, { columnPairs: combined.columnPairs });

    expect(detail.byPeriod.map((p) => p.month)).toEqual(['Q1', 'Q2', 'Q3']);
    const last = detail.byPeriod[detail.byPeriod.length - 1];
    expect(last.month).toBe('Q3');
    expect(last.categories[0]).toEqual({ category: 'Program Expense', amount: 450 });
  });
});
