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

// ============================================================
// Round 1 targets (simpler, ~30-42 blocks)
// ============================================================

const COTTAGE: Grid = parseTarget([
  "...RR...",   // peak of roof
  "..RRRR..",   // roof widens
  ".RRRRRR.",   // full roof span
  ".WNFFNW.",   // top windows + interior
  ".WFFFFW.",   // wall + interior fill
  ".WFFFFW.",   // wall + interior fill
  ".WNFDNW.",   // bottom windows + door
  ".WWWWWW.",   // foundation
]);

const GARDEN_SHED: Grid = parseTarget([
  "........",
  ".RRRRRR.",   // flat roof
  ".RRRRRR.",   // roof second layer
  ".WFFFFW.",   // interior
  ".WNFFNW.",   // windows
  ".WFFFFW.",   // interior
  ".WFFDFW.",   // door
  ".WWWWWW.",   // foundation
]);

const TREEHOUSE: Grid = parseTarget([
  "..RRRR..",   // roof cap
  "..WNNW..",   // upper windows
  "..WDDW..",   // door (ladder entry)
  ".FFFFFF.",   // platform floor
  "...WW...",   // trunk
  "...WW...",   // trunk
  "...WW...",   // trunk
  "..FFFF..",   // ground base
]);

const LIGHTHOUSE: Grid = parseTarget([
  "...RR...",   // lantern top
  "..RNNR..",   // lantern windows
  "...WW...",   // narrow tower
  "..WNNW..",   // windows
  "..WFFW..",   // interior
  ".WFFFFW.",   // wider base
  ".WNDDNW.",  // door + windows
  ".WWWWWW.",   // foundation
]);

export const ROUND_1_TARGETS = [COTTAGE, GARDEN_SHED, TREEHOUSE, LIGHTHOUSE];

export const ROUND_1_DESCRIPTIONS = [
  `A cozy cottage seen from the front (elevation view) on an 8x8 grid.
Peaked triangle roof at the top: single peak at row 0 cols 3-4, widening to row 1 cols 2-5, full span row 2 cols 1-6.
Below the roof is a rectangular house body (rows 3-7, cols 1-6) made of brown walls on the left and right edges.
Row 3: two gold windows at cols 2 and 5, cream floor fill between them.
Rows 4-5: plain walls on sides, cream floor interior.
Row 6: two gold windows at cols 2 and 5, a terracotta door at col 4, cream floor.
Row 7: solid brown wall foundation across cols 1-6.
About 42 non-empty blocks total. It clearly looks like a house.`,

  `A garden shed seen from the front on an 8x8 grid.
Flat green roof spans rows 1-2, cols 1-6 (two layers of roof blocks).
Rectangular body (rows 3-7, cols 1-6) with brown walls on left and right edges.
Row 4 has two gold windows at cols 2 and 5. Row 6 has a door at col 4.
The rest of the interior is cream floor. Row 7 is solid wall foundation.
About 36 non-empty blocks. It looks like a small utility shed.`,

  `A treehouse on an 8x8 grid.
Small roof cap at top (row 0, cols 2-5). Below that, a small cabin (rows 1-2, cols 2-5) with windows and a door hatch.
Row 3 is a wide floor platform (cols 1-6). Below the platform, a narrow tree trunk (rows 4-6, cols 3-4) made of wall blocks.
Bottom row 7 has a ground base of floor blocks at cols 2-5.
About 30 non-empty blocks. It looks like a house on stilts / treehouse.`,

  `A lighthouse on an 8x8 grid.
Lantern at top: small roof peak (row 0, cols 3-4) with window lantern panes (row 1, cols 2-3 and 4-5).
Narrow tower section (rows 2-4, cols 3-4 or 2-5) with windows at row 3.
Wider base section (rows 5-7, cols 1-6) with walls, windows, double door, and foundation.
About 38 non-empty blocks. It clearly looks like a lighthouse tower.`,
];

// ============================================================
// Round 2 targets (more complex, ~45-60 blocks)
// ============================================================

const BARN: Grid = parseTarget([
  ".RRRRRR.",   // roof cap
  "RRRRRRRR",   // wide roof overhang
  "WNFFFFNW",   // upper windows + hayloft
  "WFFFFFFW",   // solid wall section
  "WNFFFFNW",   // lower windows
  "WFFFFFFW",   // solid wall section
  "WFFDDFFR",   // double doors + side lean-to roof
  "WWWWWWWR",   // foundation + lean-to
]);

const CASTLE_TOWER: Grid = parseTarget([
  "R.R.R.R.",   // crenellations (alternating roof/empty)
  "WWWWWWWW",   // thick parapet wall
  "WNWFFWNW",   // arrow slits (narrow windows)
  "WWWFFWWW",   // thick wall
  "WNWFFWNW",   // more arrow slits
  "WWWFFWWW",   // thick wall
  "WWWDDWWW",   // gate with door
  "FFFFFFFF",   // floor / courtyard base
]);

const CHURCH: Grid = parseTarget([
  "...RR...",   // steeple peak
  "..RNNR..",   // steeple windows
  ".RRRRRR.",   // main roof
  ".WNFFNW.",   // rose window area
  ".WFFFFW.",   // nave interior
  "RWFFFFWR",   // side wing roofs + interior
  "WWFDDFWW",   // main door + side walls
  "WWWWWWWW",   // foundation
]);

const STOREFRONT: Grid = parseTarget([
  "RRRRRRRR",   // top roof edge
  "WFFFFFFW",   // upper living space
  "WNFFFFNW",   // upper windows
  "WFFFFFFW",   // mid floor
  "RRRRRRRR",   // awning / divider
  "NNFFFFNN",   // shop display windows
  "WFFDDFFW",   // shop door
  "FFFFFFFF",   // sidewalk / foundation floor
]);

export const ROUND_2_TARGETS = [BARN, CASTLE_TOWER, CHURCH, STOREFRONT];

export const ROUND_2_DESCRIPTIONS = [
  `A large barn seen from the front (elevation view) on an 8x8 grid.
Roof: row 0 has roof tiles at cols 1-6, row 1 is a full-width roof overhang across all 8 columns.
Main barn body (rows 2-7, cols 0-7): brown walls on left (col 0) and right (col 7) edges.
Row 2: gold windows at cols 1 and 6, cream floor hayloft between them.
Row 3: solid walls on sides, cream floor interior.
Row 4: gold windows at cols 1 and 6, cream floor between.
Row 5: solid walls on sides, cream floor interior.
Row 6: double terracotta doors at cols 3-4, cream floor on either side, green roof tile at col 7 (lean-to).
Row 7: solid brown wall foundation across cols 0-6, green roof tile at col 7 (lean-to continuation).
About 62 non-empty blocks total. It clearly looks like a barn with a wide roof and double doors.`,

  `A castle tower on an 8x8 grid.
Row 0: crenellations — alternating roof blocks at cols 0, 2, 4, 6 with empty at cols 1, 3, 5, 7.
Row 1: solid wall parapet across all 8 columns.
Rows 2-5: thick stone walls with narrow arrow-slit windows and a central vertical shaft (cols 3-4 are floor/interior).
Row 6: heavy gate with double doors at cols 3-4, thick walls on all sides.
Row 7: courtyard floor across all 8 columns.
About 52 non-empty blocks. It looks like a medieval castle tower with battlements.`,

  `A church seen from the front on an 8x8 grid.
Tall steeple at top: roof peak at row 0 cols 3-4, steeple windows at row 1 cols 2-3 and 4-5.
Main roof spans row 2 cols 1-6. Body of nave (rows 3-5, cols 1-6) with walls on edges, windows, floor interior.
Row 5 has side wing roofs at cols 0 and 7. Row 6 has double doors at cols 3-4 with walls extending to edges.
Row 7: full foundation wall across all 8 columns.
About 54 non-empty blocks. It looks like a church with a steeple and side wings.`,

  `A two-story storefront on an 8x8 grid.
Row 0: full-width roof edge across all 8 columns.
Rows 1-3: upper living space with walls on edges, windows at row 2, floor interior.
Row 4: awning/divider — full row of roof blocks (visual break between floors).
Row 5: shop display windows (window blocks at cols 0-1 and 6-7, floor interior between).
Row 6: shop entrance with double doors at cols 3-4, walls and floor on sides.
Row 7: sidewalk — full row of floor blocks.
About 60 non-empty blocks. It looks like a shop with living space above.`,
];

// --- Backwards-compatible exports ---
// Keep the original names so existing imports (aiPrompt.ts) still work.
// They now point to the first option in each array.
export const ROUND_1_TARGET: Grid = ROUND_1_TARGETS[0];
export const ROUND_2_TARGET: Grid = ROUND_2_TARGETS[0];
export const ROUND_1_DESCRIPTION: string = ROUND_1_DESCRIPTIONS[0];
export const ROUND_2_DESCRIPTION: string = ROUND_2_DESCRIPTIONS[0];

/**
 * Pick a random target for the given round.
 * Returns { target, description, index }.
 */
export function pickRandomTarget(round: 1 | 2): {
  target: Grid;
  description: string;
  index: number;
} {
  const targets = round === 1 ? ROUND_1_TARGETS : ROUND_2_TARGETS;
  const descriptions = round === 1 ? ROUND_1_DESCRIPTIONS : ROUND_2_DESCRIPTIONS;
  const index = Math.floor(Math.random() * targets.length);
  return { target: targets[index], description: descriptions[index], index };
}
