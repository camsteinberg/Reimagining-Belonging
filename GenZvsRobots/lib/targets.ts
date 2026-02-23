import type { Grid, BlockType } from "./types";

// Helper: create grid from visual template
// W=wall, F=floor, R=roof, N=window, D=door, .=empty
function parseTarget(template: string[]): Grid {
  const charMap: Record<string, BlockType> = {
    "W": "wall", "F": "floor", "R": "roof",
    "N": "window", "D": "door", ".": "empty",
  };
  return template.map(row =>
    row.split("").map(ch => charMap[ch] || "empty")
  );
}

// Round 1: Simple L-shaped house (~18 blocks)
export const ROUND_1_TARGET: Grid = parseTarget([
  "RRRRR...",
  "WNWWN...",
  "WFFFW...",
  "WDFFW...",
  "WWWWWRR.",
  "....WNWW",
  "....WFFW",
  "....WWWW",
]);

// Round 2: Two-room house with detail (~28 blocks)
export const ROUND_2_TARGET: Grid = parseTarget([
  ".RRRRRR.",
  ".NWWNWN.",
  ".WFFWFFW",
  ".WFFWFFW",
  ".WFFDFFW",
  ".WFFWFFW",
  ".WDNWWWW",
  "..RRRR..",
]);

// Description for AI system prompt
export const ROUND_1_DESCRIPTION = `An L-shaped single-story house viewed from above on an 8x8 grid.
Main section (left): 5 columns wide, 4 rows tall. Roof across the top row (columns 0-4).
Walls on the perimeter with windows at positions (row 1, col 0) and (row 1, col 4).
Door at (row 3, col 0). Interior filled with floor tiles.
Wing (right): extends from row 4 downward, columns 4-7, 4 rows tall.
Roof at row 4 columns 5-6. Window at (row 5, col 4). Walls around perimeter. Floor inside.`;

export const ROUND_2_DESCRIPTION = `A larger two-room house viewed from above on an 8x8 grid.
Main rectangular shape roughly centered (columns 1-7), spanning rows 0-7.
Roof sections at top (row 0, cols 1-6) and bottom (row 7, cols 2-5).
Interior dividing wall at column 3, creating left room and right room.
Left room: floor tiles at rows 2-5 cols 1-2, windows at (1,1) and (6,2), door at (6,1).
Right room: floor tiles at rows 2-5 cols 4-5, windows at (1,3), (1,5), door at (4,3).
Outer walls around perimeter. About 28 blocks total.`;
