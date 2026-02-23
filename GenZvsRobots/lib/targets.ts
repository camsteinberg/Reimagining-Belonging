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
// Round 1 targets (simpler, ~30-40 blocks) — plan-view floor plans
// ============================================================

const COTTAGE: Grid = parseTarget([
  "........",
  ".RRRRRR.",
  ".RWWWWR.",
  ".RWFFWR.",
  ".RWFFWR.",
  ".RNFFNR.",
  ".RWDDWR.",
  ".RRRRRR.",
]);

const GARDEN_SHED: Grid = parseTarget([
  "........",
  "........",
  "..RRRR..",
  "..RWWR..",
  "..WNFW..",
  "..WFNW..",
  "..WDWW..",
  "........",
]);

const TREEHOUSE: Grid = parseTarget([
  "........",
  "...WW...",
  "..WNFW..",
  "..WFNW..",
  "...DD...",
  "..FFFF..",
  "..FFFF..",
  "........",
]);

const WATCHTOWER: Grid = parseTarget([
  "..FFFF..",
  ".FFFFFF.",
  ".FWWWF.",
  ".FWNWF.",
  ".FWNWF.",
  ".FWDWF.",
  ".FFFFFF.",
  "..FFFF..",
]);

export const ROUND_1_TARGETS = [COTTAGE, GARDEN_SHED, TREEHOUSE, WATCHTOWER];

export const ROUND_1_DESCRIPTIONS = [
  `A cottage seen from above (plan view) on an 8x8 grid.
Green roof tiles form the outer rectangle (rows 1-7, cols 1-6), representing a sloped roof covering the house.
Inside the roof perimeter are brown wall blocks forming the house walls (rows 2-6, cols 2 and 5).
The interior (rows 3-4, cols 3-4) has cream floor tiles. Row 5 has gold window blocks at cols 2 and 5.
Row 6 has terracotta door blocks at cols 3-4. The outer ring is all roof, inner ring is walls, center is floor.
About 36 non-empty blocks total. From above it looks like a rectangular house with a green roof.`,

  `A small garden shed seen from above (plan view) on an 8x8 grid.
Compact structure centered in the grid. Green roof tiles cap the top (rows 2-3, cols 2-5).
Below the roof, brown walls form the shed perimeter (rows 3-6, cols 2 and 5).
Row 3 has walls inside the roof. Rows 4-5 have walls on sides with floor and window blocks inside.
Row 6 has a door at col 2 and walls elsewhere. About 20 non-empty blocks.
Small and simple — looks like a compact utility shed from above.`,

  `A treehouse seen from above (plan view) on an 8x8 grid.
Upper section (rows 1-3): a small cabin with brown walls forming a perimeter at cols 2-5.
Row 1 has walls at cols 3-4 (narrow top). Rows 2-3 have walls on edges with floor and window blocks inside.
Row 4 has door blocks at cols 3-4 (the ladder entry). Below (rows 5-6) is a wide platform of cream floor tiles at cols 2-5.
About 24 non-empty blocks. From above it looks like a small cabin on a raised platform.`,

  `A watchtower seen from above (plan view) on an 8x8 grid.
Outer courtyard of cream floor tiles forms a rounded rectangle (rows 0-7).
Inner tower walls form a square (rows 2-5, cols 2-4) made of brown wall blocks.
Inside the tower (rows 3-4, cols 3) are window blocks. Row 5 col 2 has a door.
The floor surrounds the tower on all sides. About 40 non-empty blocks.
From above it looks like a circular courtyard with a square tower in the center.`,
];

// ============================================================
// Round 2 targets (more complex, ~45-60 blocks) — plan-view floor plans
// ============================================================

const BARN: Grid = parseTarget([
  "RRRRRRRR",
  "RWWWWWWR",
  "RNFFFFNR",
  "RWFFFFWR",
  "RNFFFFNR",
  "RWFFFFWR",
  "RWWDDWWR",
  "WWWWWWWW",
]);

const CASTLE: Grid = parseTarget([
  "WWRWWRWW",
  "WWWWWWWW",
  "WWNFFNWW",
  "WWFFFFWW",
  "WWNFFNWW",
  "WWWWWWWW",
  "WWWDDWWW",
  "FFFFFFFF",
]);

const CHURCH: Grid = parseTarget([
  "...WW...",
  "..WFFW..",
  ".WFFFFW.",
  "WNFFFFNW",
  ".WFFFFW.",
  "..WFFW..",
  "..WDDW..",
  "...FF...",
]);

const STOREFRONT: Grid = parseTarget([
  "WWWWWWWW",
  "WFFFFFFW",
  "WNFFFFNW",
  "WWWWWWWW",
  "NNFFFFNN",
  "WFFFFFFW",
  "WFFDDFFW",
  "FFFFFFFF",
]);

export const ROUND_2_TARGETS = [BARN, CASTLE, CHURCH, STOREFRONT];

export const ROUND_2_DESCRIPTIONS = [
  `A large barn seen from above (plan view) on an 8x8 grid.
Green roof tiles form the outer border on rows 0-6 (cols 0 and 7), plus the full top row.
Brown walls form the structural perimeter just inside the roof. Row 7 is solid wall foundation.
Windows (gold) appear at rows 2 and 4 on the side walls (cols 1 and 6).
Large cream floor interior fills the center (rows 2-5, cols 2-5).
Row 6 has double terracotta doors at cols 3-4 flanked by walls.
About 60 non-empty blocks. From above it looks like a wide barn with a green roof border.`,

  `A castle seen from above (plan view) on an 8x8 grid.
Thick brown walls form the outer perimeter (2 blocks thick on sides).
Row 0 has battlements — alternating wall and roof blocks. Row 1 is solid thick wall.
Interior has a courtyard of cream floor (rows 2-4, cols 3-4 expanding to cols 2-5).
Gold window blocks at rows 2 and 4 (cols 2 and 5) serve as arrow slits.
Row 6 has double doors at cols 3-4. Row 7 is an outer courtyard floor.
About 52 non-empty blocks. From above it looks like a fortified castle with thick walls.`,

  `A church seen from above (plan view) on an 8x8 grid.
Cross-shaped floor plan centered on the grid.
Vertical axis: walls at cols 3-4 running from row 0 to row 7 with floor interior.
Horizontal axis: walls expand wide at row 3 (cols 0-7) forming the transept.
Gold window blocks at cols 1 and 6 on row 3. Double doors at row 6, cols 3-4.
Row 7 has floor tiles at cols 3-4 (entry path). Cream floor fills the cross interior.
About 38 non-empty blocks. From above it clearly looks like a cross-shaped church.`,

  `A two-room storefront seen from above (plan view) on an 8x8 grid.
Brown walls form the outer perimeter. A dividing wall runs across row 3 splitting upper and lower rooms.
Upper room (rows 1-2): cream floor interior with windows at cols 1 and 6 on row 2.
Lower room (rows 4-6): cream floor interior with display windows (gold) at corners of row 4.
Row 6 has double doors at cols 3-4. Row 7 is an open sidewalk of floor tiles.
About 56 non-empty blocks. From above it looks like a commercial building with two rooms.`,
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
