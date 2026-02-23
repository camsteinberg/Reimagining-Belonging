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

// Round 1: Cottage — front elevation view (~42 blocks)
// A peaked-roof house seen from the front: triangle roof, windows, door
export const ROUND_1_TARGET: Grid = parseTarget([
  "...RR...",   // peak of roof
  "..RRRR..",   // roof widens
  ".RRRRRR.",   // full roof span
  ".WNFFNW.",   // top windows + interior
  ".WFFFFW.",   // wall + interior fill
  ".WFFFFW.",   // wall + interior fill
  ".WNFDNW.",   // bottom windows + door
  ".WWWWWW.",   // foundation
]);

// Round 2: Barn — front elevation view (~62 blocks)
// A wide barn with gambrel roof overhang, paired windows, double doors
export const ROUND_2_TARGET: Grid = parseTarget([
  ".RRRRRR.",   // roof cap
  "RRRRRRRR",   // wide roof overhang
  "WNFFFFNW",   // upper windows + hayloft
  "WFFFFFFW",   // solid wall section
  "WNFFFFNW",   // lower windows
  "WFFFFFFW",   // solid wall section
  "WFFDDFFR",   // double doors + side lean-to roof
  "WWWWWWWR",   // foundation + lean-to
]);

// Description for AI system prompt
export const ROUND_1_DESCRIPTION = `A cozy cottage seen from the front (elevation view) on an 8x8 grid.
Peaked triangle roof at the top: single peak at row 0 cols 3-4, widening to row 1 cols 2-5, full span row 2 cols 1-6.
Below the roof is a rectangular house body (rows 3-7, cols 1-6) made of brown walls on the left and right edges.
Row 3: two gold windows at cols 2 and 5, cream floor fill between them.
Rows 4-5: plain walls on sides, cream floor interior.
Row 6: two gold windows at cols 2 and 5, a terracotta door at col 4, cream floor.
Row 7: solid brown wall foundation across cols 1-6.
About 42 non-empty blocks total. It clearly looks like a house.`;

export const ROUND_2_DESCRIPTION = `A large barn seen from the front (elevation view) on an 8x8 grid.
Roof: row 0 has roof tiles at cols 1-6, row 1 is a full-width roof overhang across all 8 columns.
Main barn body (rows 2-7, cols 0-7): brown walls on left (col 0) and right (col 7) edges.
Row 2: gold windows at cols 1 and 6, cream floor hayloft between them.
Row 3: solid walls on sides, cream floor interior.
Row 4: gold windows at cols 1 and 6, cream floor between.
Row 5: solid walls on sides, cream floor interior.
Row 6: double terracotta doors at cols 3-4, cream floor on either side, green roof tile at col 7 (lean-to).
Row 7: solid brown wall foundation across cols 0-6, green roof tile at col 7 (lean-to continuation).
About 62 non-empty blocks total. It clearly looks like a barn with a wide roof and double doors.`;
