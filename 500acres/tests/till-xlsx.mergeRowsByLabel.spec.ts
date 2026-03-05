import { describe, it, expect } from 'vitest';
import { mergeRowsByLabel, Row, leftLabel } from '../lib/till-xlsx';

const mk = (label: string, older: number, newer: number): Row => {
  // place label at col C (index 2); right column is older period, left is newer
  const r: Row = Array(20).fill(null);
  r[2] = label;
  r[11] = older; // right (older)
  r[10] = newer; // left (newer)
  return r;
};

describe('mergeRowsByLabel', () => {
  it('aligns by label and appends each dataset’s rightmost two numeric columns to the right', () => {
    // "Older" workbook (Q1/Q2)
    const A1: Row[] = [
      mk('Total Assets', 100, 120),
      mk('Total Expenses', 40, 60),
    ];
    // "Newer" workbook (Q2/Q3)
    const A2: Row[] = [
      mk('Total Assets', 120, 150),
      mk('Total Expenses', 60, 55),
      mk('New Only Line', 0, 10),
    ];

    const { rows: merged, columnPairs } = mergeRowsByLabel([A1, A2]);
    // Check label alignment preserved
    expect(leftLabel(merged[0])).toBe('Total Assets');
    expect(leftLabel(merged[1])).toBe('Total Expenses');
    expect(leftLabel(merged[2])).toBe('New Only Line');

    // The numeric tails should be: [A1 two cols] then [A2 two cols]
    const tailAssets = merged[0].slice(-4);
    const tailExpenses = merged[1].slice(-4);
    const tailNewOnly = merged[2].slice(-4);

    expect(tailAssets).toEqual([100, 120, 120, 150]);
    expect(tailExpenses).toEqual([40, 60, 60, 55]);
    expect(tailNewOnly).toEqual([null, null, 0, 10]);

    expect(columnPairs).toHaveLength(2);
    const [first, second] = columnPairs;
    expect(first.older).toBeDefined();
    expect(first.newer).toBeDefined();
    expect(second.older).toBeDefined();
    expect(second.newer).toBeDefined();
    expect(merged[0][first.older!]).toBe(100);
    expect(merged[0][first.newer!]).toBe(120);
    expect(merged[0][second.older!]).toBe(120);
    expect(merged[0][second.newer!]).toBe(150);
  });
});
