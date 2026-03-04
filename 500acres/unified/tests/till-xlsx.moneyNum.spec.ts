import { describe, it, expect } from 'vitest';
import { moneyNum } from '../lib/till-xlsx';

describe('moneyNum', () => {
  it('parses normal numbers', () => {
    expect(moneyNum(123)).toBe(123);
    expect(moneyNum('123')).toBe(123);
  });

  it('handles commas and currency symbols', () => {
    expect(moneyNum('$1,234')).toBe(1234);
    expect(moneyNum('€9,876.50')).toBe(9876.5);
  });

  it('handles accounting negatives (parentheses)', () => {
    expect(moneyNum('(1,250)')).toBe(-1250);
    expect(moneyNum('($2,000)')).toBe(-2000);
  });

  it('returns 0 for junk', () => {
    expect(moneyNum(null)).toBe(0);
    expect(moneyNum(undefined)).toBe(0);
    expect(moneyNum('N/A')).toBe(0);
  });
});
