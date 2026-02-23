import type { Grid, CellResult, BlockType } from "./types";
import { GRID_SIZE } from "./constants";

export interface DetailedScore {
  percentage: number;
  correct: number;
  total: number;
  cells: CellResult[];
}

export function calculateDetailedScore(build: Grid, target: Grid): DetailedScore {
  const cells: CellResult[] = [];
  let correct = 0;
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const expected = target[r][c];
      const actual = build[r][c];

      // Count cells that should have something
      if (expected !== "empty") {
        total++;
        const isCorrect = actual === expected;
        if (isCorrect) correct++;
        cells.push({ row: r, col: c, expected, actual, correct: isCorrect });
      }

      // Penalize extra blocks not in target
      if (expected === "empty" && actual !== "empty") {
        total++;
        cells.push({ row: r, col: c, expected, actual, correct: false });
      }
    }
  }

  return {
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
    correct,
    total,
    cells,
  };
}
