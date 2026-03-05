import { describe, it, expect } from 'vitest';
import { detectPeriodCols, Row } from '../lib/till-xlsx';

describe('detectPeriodCols', () => {
  it('finds the two columns with the most numeric entries (returning [older,rightmost,newer])', () => {
    const rows: Row[] = [
      ['Label', '', '', '', '', 100, 200],
      ['Another', '', '', '', '', 75, 125],
      ['Third', '', '', '', '', '', 300],
    ];
    const [oldIdx, newIdx] = detectPeriodCols(rows);
    expect([oldIdx, newIdx]).toEqual([6, 5]); // rightmost column treated as older
  });
});
