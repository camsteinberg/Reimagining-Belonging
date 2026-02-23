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

// Round 1: Simple L-shaped house (~39 blocks)
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

// Round 2: Two-room house with detail (~51 blocks)
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
Main section (top-left): 5 columns wide (cols 0-4), 5 rows tall (rows 0-4). Roof across row 0 (cols 0-4).
Walls on the perimeter with windows at (1,1) and (1,4).
Door at (3,1). Interior floor tiles at cols 1-3 row 2 and cols 2-3 row 3.
Wing (bottom-right): extends from row 4 downward, columns 4-7, 4 rows tall (rows 4-7).
Row 4 is a wall row with roofs at (4,5) and (4,6). Window at (5,5). Walls around perimeter. Floor at cols 5-6 rows 6.`;

export const ROUND_2_DESCRIPTION = `A larger two-room house viewed from above on an 8x8 grid.
Main rectangular shape spanning columns 1-7, rows 0-7.
Roof sections at top (row 0, cols 1-6) and bottom (row 7, cols 2-5).
Interior dividing wall at column 4 (rows 2-3 and 5-6), with a door at (4,4).
Left room (cols 1-3): walls along col 1, floor tiles at rows 2-5 cols 2-3, window at (1,1), door at (6,2), window at (6,3).
Right room (cols 4-7): walls along col 7, floor tiles at rows 2-5 cols 5-6, window at (1,4), window at (1,6).
Bottom wall: row 6 cols 4-7 are all walls. About 51 non-empty blocks total.`;
