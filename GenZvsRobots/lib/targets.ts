import type { Grid, BlockType } from "./types";
import { MAX_HEIGHT } from "./constants";

// Helper: character to block type mapping
const charMap: Record<string, BlockType> = {
  "W": "wall", "F": "floor", "R": "roof",
  "N": "window", "D": "door", ".": "empty",
};

// Parse a multi-layer 3D target from string template layers
function parse3DTarget(layers: string[][]): Grid {
  const GRID_SIZE = 8;
  // Initialize empty 3D grid
  const grid: Grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: MAX_HEIGHT }, () => "empty" as BlockType)
    )
  );

  for (let h = 0; h < layers.length && h < MAX_HEIGHT; h++) {
    const layer = layers[h];
    for (let r = 0; r < GRID_SIZE && r < layer.length; r++) {
      for (let c = 0; c < GRID_SIZE && c < layer[r].length; c++) {
        grid[r][c][h] = charMap[layer[r][c]] || "empty";
      }
    }
  }

  return grid;
}

// Single-layer backward-compatible wrapper
function parseTarget(template: string[]): Grid {
  return parse3DTarget([template]);
}

// ============================================================
// Round 1 targets (2-3 layers, simpler)
// ============================================================

const COTTAGE: Grid = parse3DTarget([
  // L0: walls + floor + door
  [
    "........",
    ".WWWWWW.",
    ".WFFFFW.",
    ".WFFFFW.",
    ".WFFFFW.",
    ".WFFFFW.",
    ".WFDDFW.",
    "........",
  ],
  // L1: upper walls + windows
  [
    "........",
    ".WWWWWW.",
    ".NFFFWN.",
    ".WFFFFW.",
    ".NFFFWN.",
    ".WWWWWW.",
    "........",
    "........",
  ],
  // L2: roof
  [
    "........",
    ".RRRRRR.",
    ".RRRRRR.",
    ".RRRRRR.",
    ".RRRRRR.",
    ".RRRRRR.",
    "........",
    "........",
  ],
]);

const GARDEN_SHED: Grid = parse3DTarget([
  // L0: walls + floor + door
  [
    "........",
    "........",
    "..WWWW..",
    "..WFFW..",
    "..WFFW..",
    "..WDDW..",
    "........",
    "........",
  ],
  // L1: roof cap
  [
    "........",
    "........",
    "..RRRR..",
    "..RRRR..",
    "........",
    "........",
    "........",
    "........",
  ],
]);

const TREEHOUSE: Grid = parse3DTarget([
  // L0: platform
  [
    "........",
    "........",
    "..FFFF..",
    "..FFFF..",
    "..FFFF..",
    "..FFFF..",
    "........",
    "........",
  ],
  // L1: cabin walls
  [
    "........",
    "..WWWW..",
    "..NFFN..",
    "..WFFW..",
    "..WFFW..",
    "..NDDN..",
    "........",
    "........",
  ],
  // L2: roof
  [
    "........",
    "..RRRR..",
    "..RRRR..",
    "........",
    "........",
    "........",
    "........",
    "........",
  ],
]);

const WATCHTOWER: Grid = parse3DTarget([
  // L0: courtyard + tower base
  [
    "..FFFF..",
    ".FFFFFF.",
    ".FWWWWF.",
    ".FWFFWF.",
    ".FWFFWF.",
    ".FWDDWF.",
    ".FFFFFF.",
    "..FFFF..",
  ],
  // L1: tower walls
  [
    "........",
    "........",
    "..WWWW..",
    "..NFFN..",
    "..WFFW..",
    "..WFFW..",
    "..WWWW..",
    "........",
  ],
  // L2: upper tower
  [
    "........",
    "........",
    "..WWWW..",
    "..NFFN..",
    "..WFFW..",
    "..WFFW..",
    "..WWWW..",
    "........",
  ],
  // L3: tower roof
  [
    "........",
    "........",
    "..RRRR..",
    "..RRRR..",
    "........",
    "........",
    "........",
    "........",
  ],
]);

export const ROUND_1_TARGETS = [COTTAGE, GARDEN_SHED, TREEHOUSE, WATCHTOWER];

export const ROUND_1_DESCRIPTIONS = [
  `The Cottage is a cozy rectangular house, 6 columns wide and 6 rows tall, centered on the 8x8 grid (rows 1-6, cols 1-6). It rises 3 layers high.

Layer 0 (ground floor): Wall blocks form the perimeter rectangle — top wall at row 1 cols 1-6, bottom wall at row 6 cols 1-6, left wall at col 1 rows 2-5, right wall at col 6 rows 2-5. Floor tiles fill the interior (rows 2-5, cols 2-5). A double door sits at the south wall at row 6 cols 3-4.

Layer 1 (upper floor): Walls continue upward along the north wall (row 1 cols 1-6) and south wall (row 5 cols 1-6). Windows replace walls on the east and west sides at rows 2 and 4 (positions (2,1), (2,6), (4,1), (4,6)). Solid walls remain at (3,1) and (3,6). Floor fills the interior (rows 2-4, cols 2-5). Row 6 is empty on this layer.

Layer 2 (roof): Roof tiles cover rows 1-5, cols 1-6 — a 5-by-6 rectangle. No blocks at row 6.

Building strategy: Start with the ground-floor wall rectangle and fill the interior with floor. Add the south door. Then build the upper walls with windows on the sides. Finally, cap with roof tiles.`,

  `The Garden Shed is a compact 4-column-wide, 4-row-tall structure centered on the grid (rows 2-5, cols 2-5). It rises only 2 layers high — the simplest target.

Layer 0 (ground floor): Walls form a small rectangle — top wall at row 2 cols 2-5, bottom wall at row 5 cols 2-5, left wall at col 2 rows 3-4, right wall at col 5 rows 3-4. Floor fills the interior at (3,3), (3,4), (4,3), (4,4). A double door sits at row 5 cols 3-4.

Layer 1 (roof): Roof tiles cover only the top half — rows 2-3, cols 2-5 (8 blocks). Rows 4-5 have no roof.

Building strategy: Lay down the wall perimeter first. Fill the 4 interior floor cells. Place the 2 door blocks. Then add the 8 roof tiles on the north half. Total is about 24 blocks.`,

  `The Treehouse is a cabin sitting on a raised platform, 4 columns wide, centered on the grid (cols 2-5). It rises 3 layers high.

Layer 0 (platform): A flat 4x4 floor platform at rows 2-5, cols 2-5 — 16 floor tiles. No walls on this layer.

Layer 1 (cabin): Walls and windows form the cabin structure on top of the platform. North wall at row 1 cols 2-5 (4 walls). Windows at all four corners: (2,2), (2,5), (5,2), (5,5). Walls at (3,2), (3,5), (4,2), (4,5). Floor interior at rows 2-4 cols 3-4 plus (3,2)-(4,5) interiors. Double door at row 5 cols 3-4. Note: the cabin extends one row above the platform (row 1).

Layer 2 (roof): Roof tiles at rows 1-2, cols 2-5 — 8 blocks covering the top of the cabin.

Building strategy: First lay the 16-tile floor platform. Then build the cabin walls with corner windows on layer 1. Add the door at the south. Cap with roof tiles on layer 2.`,

  `The Watchtower is a tall central tower surrounded by a ground-level courtyard. It rises 4 layers high — the tallest Round 1 target.

Layer 0 (courtyard + tower base): An octagonal courtyard of floor tiles: row 0 cols 2-5, rows 1 and 6 cols 1-6, row 7 cols 2-5, plus side floor tiles at col 1 and col 5 for rows 2-5. Inside the courtyard, the tower base has walls at rows 2-5 cols 2-4 forming a 4x3 rectangle: top wall (2,2)-(2,4), bottom wall (5,2)-(5,4), left wall col 2, right wall col 4. Interior floor at (3,3), (4,3). Wall blocks at (3,2),(3,4),(4,2),(4,4). Door at (5,3).

Layer 1 (lower tower): Tower walls form a rectangle at rows 2-6 cols 2-5. Top wall row 2, bottom wall row 6, sides at cols 2 and 5. Windows at (3,2) and (3,5). Floor fills interior (rows 3-5 cols 3-4, row 2 interior). Walls at remaining perimeter positions.

Layer 2 (upper tower): Same layout as Layer 1 — walls at rows 2-6 cols 2-5 with windows at (3,2) and (3,5).

Layer 3 (roof): Roof tiles at rows 2-3, cols 2-5 — 8 blocks.

Building strategy: Build the courtyard floor first, then the inner tower walls and door. Stack the tower walls up through layers 1 and 2 with windows. Cap with roof. Total is about 65 blocks.`,
];

// ============================================================
// Round 2 targets (2-4 layers, complex)
// ============================================================

const BARN: Grid = parse3DTarget([
  // L0: walls + floor + doors
  [
    "WWWWWWWW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WWFDDWWW",
    "FFFFFFFF",
  ],
  // L1: upper walls + windows
  [
    "WNWWWWNW",
    "WFFFFFFW",
    "WFFFFFFW",
    "NFFFFFFN",
    "WFFFFFFW",
    "WFFFFFFW",
    "WNWWWWNW",
    "........",
  ],
  // L2: roof
  [
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "........",
  ],
]);

const CASTLE: Grid = parse3DTarget([
  // L0: ground walls
  [
    "WW....WW",
    "WWWWWWWW",
    "WNFFFFNW",
    "WFFFFFFW",
    "WNFFFFNW",
    "WWWWWWWW",
    "WWWDDWWW",
    "FFFFFFFF",
  ],
  // L1: upper walls
  [
    "WW....WW",
    "WWWWWWWW",
    "WNFFFFNW",
    "WFFFFFFW",
    "WNFFFFNW",
    "WWWWWWWW",
    "WW....WW",
    "........",
  ],
  // L2: corner towers
  [
    "WW....WW",
    "........",
    "........",
    "........",
    "........",
    "........",
    "WW....WW",
    "........",
  ],
  // L3: tower roofs
  [
    "RR....RR",
    "........",
    "........",
    "........",
    "........",
    "........",
    "RR....RR",
    "........",
  ],
]);

const CHURCH: Grid = parse3DTarget([
  // L0: cross plan
  [
    "...WW...",
    "..WFFW..",
    ".WFFFFW.",
    "WNFFFFNW",
    ".WFFFFW.",
    "..WFFW..",
    "..WDDW..",
    "...FF...",
  ],
  // L1: upper walls
  [
    "...WW...",
    "..WFFW..",
    ".WFFFFW.",
    "WNFFFFNW",
    ".WFFFFW.",
    "..WFFW..",
    "........",
    "........",
  ],
  // L2: roof
  [
    "...RR...",
    "..RRRR..",
    ".RRRRRR.",
    "RRRRRRRR",
    ".RRRRRR.",
    "..RRRR..",
    "........",
    "........",
  ],
  // L3: steeple
  [
    "........",
    "...RR...",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
  ],
]);

const STOREFRONT: Grid = parse3DTarget([
  // L0: lower shop
  [
    "WWWWWWWW",
    "WFFFFFFW",
    "WNFFFFNW",
    "WWWWWWWW",
    "NNFFFFNN",
    "WFFFFFFW",
    "WFFDDFFW",
    "FFFFFFFF",
  ],
  // L1: upper floor
  [
    "WNWWWWNW",
    "WFFFFFFW",
    "WNFFFFNW",
    "WWWWWWWW",
    "........",
    "........",
    "........",
    "........",
  ],
  // L2: roof
  [
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "RRRRRRRR",
    "........",
    "........",
    "........",
    "........",
  ],
]);

export const ROUND_2_TARGETS = [BARN, CASTLE, CHURCH, STOREFRONT];

export const ROUND_2_DESCRIPTIONS = [
  `The Barn is a large full-width structure spanning the entire 8-column grid width, 7 rows deep (rows 0-6), with a floor apron at row 7. It rises 3 layers high.

Layer 0 (ground floor): Walls form the perimeter of a wide rectangle — top wall row 0 cols 0-7, left wall col 0 rows 1-6, right wall col 7 rows 1-6. Bottom wall at row 6 cols 0-1, 4-5, 6-7 with double doors at cols 3-4. Floor fills the entire interior (rows 1-5 cols 1-6, plus row 6 cols 2,5). Row 7 is a full-width floor apron (cols 0-7).

Layer 1 (upper walls): Walls continue upward at rows 0 and 6 cols 0-7, plus sides at cols 0 and 7 for rows 1-5. Windows at corners: (0,1), (0,6), (3,0), (3,7), (6,1), (6,6). Floor fills the interior (rows 1-5, cols 1-6). Row 7 is empty.

Layer 2 (roof): Roof tiles cover the entire barn footprint — rows 0-6, cols 0-7 (56 blocks). Row 7 is empty.

Building strategy: Start with the ground-floor walls around the perimeter, fill the huge interior with floor, add the south doors and the row 7 apron. Then stack the upper walls with corner windows. Finally, lay the massive roof. About 100 blocks total — the largest target.`,

  `The Castle is a walled fortress with four corner towers that extend upward. It uses the full 8-column width and rises 4 layers high.

Layer 0 (ground floor): Corner tower blocks at (0,0-1) and (0,6-7). Full wall row at row 1 cols 0-7. Walls with windows at rows 2 and 4: walls at cols 0,7 with windows at cols 1,6, floor interior at cols 2-5. Solid walls at row 3 and row 5 cols 0,7 with floor interior. Row 6: walls at cols 0-2 and 5-7 with double doors at cols 3-4. Row 7: full floor apron cols 0-7. Corner towers also at (6,0-1) and (6,6-7).

Layer 1 (upper walls): Same pattern as layer 0 but without doors or row 7. Corner tower blocks at (0,0-1), (0,6-7), (6,0-1), (6,6-7). Full walls at rows 1 and 5. Windows at rows 2 and 4 cols 1,6. Floor interior throughout.

Layer 2 (corner towers only): Only the 4 corner tower blocks remain — wall blocks at (0,0-1), (0,6-7), (6,0-1), (6,6-7). Everything else is empty.

Layer 3 (tower roofs): Roof tiles cap the 4 corner towers — (0,0-1), (0,6-7), (6,0-1), (6,6-7).

Building strategy: Build the ground-floor walls and fill the interior. Add corner towers, doors, and the floor apron. Stack the upper walls on layer 1. Then add just the corner tower walls on layer 2 and roof caps on layer 3. About 90 blocks total.`,

  `The Church has a cross-shaped (cruciform) floor plan, with a steeple. It rises 4 layers high.

Layer 0 (ground floor): The cross shape — narrow nave at top (row 0 cols 3-4 walls), widening at row 1 (cols 2-5), full transept at rows 2-4 spanning cols 1-6, narrowing again at rows 5-6 (cols 2-5). Walls form the cross perimeter with floor inside. Windows on the transept sides at (3,0) and (3,7). Double doors at row 6 cols 3-4. Entry path floor at row 7 cols 3-4.

Layer 1 (upper walls): Same cross shape continues — walls at row 0 cols 3-4, row 1 cols 2-5, rows 2-4 cols 1-6, row 5 cols 2-5. Windows again at (3,0) and (3,7). Floor fills the interior. Rows 6-7 are empty (no door or entry on this layer).

Layer 2 (roof): Roof tiles in cross shape — row 0 cols 3-4, row 1 cols 2-5, row 2 cols 1-6, row 3 cols 0-7 (full width), row 4 cols 1-6, row 5 cols 2-5.

Layer 3 (steeple): Just 2 roof blocks at row 1 cols 3-4, forming the steeple peak.

Building strategy: Build the cross-shaped ground floor starting from the center transept outward. Add windows on the sides and the door at the south. Stack the upper cross walls. Lay the cross-shaped roof. Place the 2 steeple blocks on top. About 80 blocks total.`,

  `The Storefront is a two-story commercial building. The back half (rows 0-3) is a full 2-story structure; the front half (rows 4-7) is single-story. Full 8-column width. Rises 3 layers high.

Layer 0 (ground floor): Walls span the full width. Back section: walls at row 0 cols 0-7, row 3 cols 0-7 (dividing wall). Interior floor rows 1-2 cols 1-6. Windows at (2,1), (2,6). Front section: large display windows at row 4 cols 0-1 and 6-7, floor at cols 2-5. Floor interior at rows 5-6 cols 1-6. Walls at rows 5-6 cols 0,7. Double doors at row 6 cols 3-4. Row 7: full-width sidewalk floor (cols 0-7).

Layer 1 (upper floor — back half only): Walls at row 0 and row 3 cols 0-7. Windows at (0,1), (0,6), (2,1), (2,6). Floor fills interior rows 1-2 cols 1-6. Walls at cols 0,7 for rows 1-2. Rows 4-7 are empty.

Layer 2 (roof — back half only): Roof tiles at rows 0-3, cols 0-7 (32 blocks). Rows 4-7 empty.

Building strategy: Build the ground-floor walls for both sections. Fill interiors with floor. Add the display windows and doors. Add the row 7 sidewalk. Then stack the upper floor on the back half only (rows 0-3). Cap with roof. About 80 blocks total.`,
];

// --- Backwards-compatible exports ---
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
