import type { Grid, BlockType } from "./types";
import { MAX_HEIGHT } from "./constants";

// Helper: character to block type mapping
const charMap: Record<string, BlockType> = {
  "W": "wall", "F": "floor", "R": "roof",
  "N": "window", "D": "door", "P": "plant",
  "T": "table", "M": "metal", "C": "concrete",
  "B": "barrel", "I": "pipe", ".": "empty",
};

// Parse a multi-layer 3D target from string template layers
// Each layer is an array of 6 strings, each string 6 characters wide (6x6 grid)
function parse3DTarget(layers: string[][]): Grid {
  const GRID_SIZE = 6;
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

  // Door auto-expansion: if a cell has "door" on layer L and layer L+1 is empty,
  // auto-fill L+1 with "door" to create 2-high doorways
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let h = 0; h < MAX_HEIGHT - 1; h++) {
        if (grid[r][c][h] === "door" && grid[r][c][h + 1] === "empty") {
          grid[r][c][h + 1] = "door";
        }
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
// Round 1 targets (simpler, describable verbally in 3 min)
// ============================================================

// COTTAGE: Simple 4x4 cabin centered on the 6x6 grid
// ~32 blocks, 3 layers
const COTTAGE: Grid = parse3DTarget([
  // L0: Wall perimeter with door on front, floor inside
  [
    ".P..P.",
    "WWWWWW",
    "WFFFFW",
    "WFFFFW",
    "WFDDFW",
    "..P...",
  ],
  // L1: Walls with windows on two sides
  [
    "......",
    "WWWWWW",
    "NFFFWN",
    "NFFFWN",
    "WWWWWW",
    "......",
  ],
  // L2: Full roof
  [
    "......",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "......",
  ],
]);

// GARDEN_SHED: Small 3x3 structure with barrels and plants outside
// ~22 blocks, 2 layers
const GARDEN_SHED: Grid = parse3DTarget([
  // L0: Wall box with door, barrel outside, plants flanking
  [
    "......",
    ".BWWW.",
    "..WFFW",
    "..WFFW",
    "..WDDW",
    ".P..P.",
  ],
  // L1: Roof
  [
    "......",
    "..RRRR",
    "..RRRR",
    "..RRRR",
    "......",
    "......",
  ],
]);

// WORKSHOP: Industrial building with metal, concrete, pipe
// ~33 blocks, 3 layers
const WORKSHOP: Grid = parse3DTarget([
  // L0: Concrete floor, metal walls, pipe in corner, door
  [
    "MMMMMM",
    "MCCCIM",
    "MCCCFM",
    "MCCCFM",
    "MFDDMM",
    "......",
  ],
  // L1: Metal walls with windows
  [
    "MMMMMM",
    "NFFFMN",
    "MFFFFM",
    "NFFFFN",
    "MMMMMM",
    "......",
  ],
  // L2: Metal roof
  [
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "......",
  ],
]);

// WATCHTOWER: Tall narrow structure using height
// ~30 blocks, 5 layers
const WATCHTOWER: Grid = parse3DTarget([
  // L0: 3x3 wall base with door
  [
    "......",
    "..WWW.",
    "..WFW.",
    "..WDW.",
    "......",
    "......",
  ],
  // L1: Walls with window
  [
    "......",
    "..WWW.",
    "..NFN.",
    "..WWW.",
    "......",
    "......",
  ],
  // L2: Walls
  [
    "......",
    "..WWW.",
    "..WFW.",
    "..WWW.",
    "......",
    "......",
  ],
  // L3: Walls with windows
  [
    "......",
    "..WWW.",
    "..NFN.",
    "..WWW.",
    "......",
    "......",
  ],
  // L4: Roof platform
  [
    "......",
    "..RRR.",
    "..RRR.",
    "..RRR.",
    "......",
    "......",
  ],
]);

export const ROUND_1_TARGETS: Grid[] = [COTTAGE, GARDEN_SHED, WORKSHOP, WATCHTOWER];

export const ROUND_1_DESCRIPTIONS: string[] = [
  // COTTAGE
  `The Cottage is a cozy rectangular cabin, 6 columns wide and 4 rows deep, sitting in rows 1-4 of the 6x6 grid. It rises 3 layers high. Plants decorate three corners outside the walls.

Layer 0 (ground floor): Plants at row 0 col 1 and row 0 col 4, and at row 5 col 1. Walls form the perimeter rectangle at rows 1-4, cols 0-5. Floor tiles fill the interior (rows 2-3, cols 1-4). A 2-high door at row 4 cols 2-3 (doors auto-stack to 2 blocks high).

Layer 1 (upper walls): Walls continue at rows 1 and 4 across all 6 columns. Windows replace the side walls at rows 2-3 on cols 0 and 5. Floor fills the interior.

Layer 2 (roof): Roof tiles cover rows 1-4, cols 0-5 (24 blocks).

Building strategy: Place the ground-floor wall rectangle first, fill the interior with floor, add the door at front. Build upper walls with windows on the sides. Cap with the roof slab.`,

  // GARDEN_SHED
  `The Garden Shed is a compact 4-wide, 3-deep structure in the right half of the grid (cols 2-5, rows 1-4). A barrel sits outside to the left and plants flank the entrance. It rises 2 layers.

Layer 0 (ground floor): A barrel at row 1 col 1. Walls form a rectangle at rows 1-4, cols 2-5. Floor fills the interior at rows 2-3, cols 3-4. A 2-high door at row 4 cols 3-4 (auto-stacks). Plants at row 5 cols 1 and 4.

Layer 1 (roof): Roof tiles cover rows 1-3, cols 2-5 (12 blocks).

Building strategy: Start with the wall perimeter, add interior floor, place the door. Put the barrel outside to the upper-left and plants at the entrance. Lay the roof on top. About 22 blocks total.`,

  // WORKSHOP
  `The Workshop is an industrial building spanning 6 columns wide and 5 rows deep (rows 0-4), using metal walls, concrete floor, and a pipe. It rises 3 layers high.

Layer 0 (ground floor): Metal walls form the perimeter at rows 0 and 4, and cols 0 and 5 of rows 1-3. Concrete fills the interior floor (rows 1-3, cols 1-3). A pipe at row 1 col 4. Some floor blocks at rows 2-3 col 4. A 2-high door at row 4 cols 2-3 (auto-stacks).

Layer 1 (upper walls): Metal walls continue around the perimeter. Windows at row 0 col 0, row 0 col 5, row 3 col 0, and row 3 col 5. Floor fills the interior.

Layer 2 (roof): Roof tiles cover the full 6x5 area (rows 0-4, cols 0-5).

Building strategy: Lay the metal perimeter walls, fill with concrete interior. Add the pipe in the upper-right corner and the door. Build upper metal walls with windows. Cap with roof.`,

  // WATCHTOWER
  `The Watchtower is a tall narrow tower, 3 columns wide and 3 rows deep (cols 2-4, rows 1-3), rising 5 layers high in the center of the grid. It uses the most height of any Round 1 structure.

Layer 0 (base): Walls form a 3x3 perimeter at rows 1-3, cols 2-4. Floor at the center (row 2, col 3). A single-wide door at row 3 col 3 (auto-stacks to 2 high).

Layer 1: Walls with windows on the east and west sides at row 2. Floor center.

Layer 2: Solid walls with floor center.

Layer 3: Walls with windows again at row 2. Floor center.

Layer 4 (roof): Roof tiles cap the tower at rows 1-3, cols 2-4 (9 blocks).

Building strategy: Build the 3x3 base with door, then stack walls upward layer by layer, alternating windows and solid walls. Place the roof cap on top. About 30 blocks, mostly vertical.`,
];

// ============================================================
// Round 2 targets (complex, designed for AI assistance)
// ============================================================

// FACTORY: L-shaped industrial building with utility blocks
// ~50 blocks, 3 layers
const FACTORY: Grid = parse3DTarget([
  // L0: L-shaped footprint with metal, concrete, pipe, barrel
  [
    "MMMM..",
    "MCCCM.",
    "MCIBM.",
    "MMMMMM",
    "..MCCM",
    "..MDDM",
  ],
  // L1: Upper walls with windows
  [
    "MMMM..",
    "NFFMN.",
    "MFFFM.",
    "MMMMMM",
    "..NFFN",
    "..MMMM",
  ],
  // L2: Roof
  [
    "RRRR..",
    "RRRR..",
    "RRRR..",
    "RRRRRR",
    "..RRRR",
    "..RRRR",
  ],
]);

// TWO_STORY: Full 2-story house with interior detail
// ~55 blocks, 5 layers
const TWO_STORY: Grid = parse3DTarget([
  // L0: Ground floor with door, table, plants outside
  [
    "P....P",
    "WWWWWW",
    "WTFFNW",
    "WFFFFW",
    "WFDDFW",
    "......",
  ],
  // L1: Upper ground-floor walls with windows
  [
    "......",
    "WWWWWW",
    "NFFFWN",
    "WFFFFW",
    "WWWWWW",
    "......",
  ],
  // L2: Second floor (floor slab + walls)
  [
    "......",
    "WWWWWW",
    "WFFFFW",
    "WTFFFW",
    "WWWWWW",
    "......",
  ],
  // L3: Second floor upper walls with windows
  [
    "......",
    "WWWWWW",
    "NFFFWN",
    "NFFFWN",
    "WWWWWW",
    "......",
  ],
  // L4: Roof
  [
    "......",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "......",
  ],
]);

// MARKET: Open-air market with tables, roof canopy, barrels, plants
// ~45 blocks, 3 layers
const MARKET: Grid = parse3DTarget([
  // L0: Tables in rows, barrels at edges, plants, partial walls
  [
    "WP..PW",
    "BTTTFB",
    "......",
    "BTTTFB",
    "......",
    "WP..PW",
  ],
  // L1: Support columns (walls at corners)
  [
    "W....W",
    "......",
    "......",
    "......",
    "......",
    "W....W",
  ],
  // L2: Roof canopy floating on corner columns
  [
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
    "RRRRRR",
  ],
]);

// FORTRESS: Walled compound with corner towers
// ~58 blocks, 4 layers
const FORTRESS: Grid = parse3DTarget([
  // L0: Thick walls, entrance, interior floor
  [
    "WWWWWW",
    "WFFFFW",
    "WFFFFW",
    "WFFFFW",
    "WFFFFW",
    "WWDDWW",
  ],
  // L1: Walls with windows, corner towers solid
  [
    "WWNNWW",
    "W....W",
    "N....N",
    "N....N",
    "W....W",
    "WWWWWW",
  ],
  // L2: Corner towers only (walls at 4 corners)
  [
    "WW..WW",
    "......",
    "......",
    "......",
    "......",
    "WW..WW",
  ],
  // L3: Tower roofs
  [
    "RR..RR",
    "......",
    "......",
    "......",
    "......",
    "RR..RR",
  ],
]);

export const ROUND_2_TARGETS: Grid[] = [FACTORY, TWO_STORY, MARKET, FORTRESS];

export const ROUND_2_DESCRIPTIONS: string[] = [
  // FACTORY
  `The Factory is an L-shaped industrial building using metal walls, concrete floors, pipes, and barrels. The L-shape occupies the top-left 4 columns (rows 0-2) and a wing extending down the right side (rows 3-5, cols 2-5). It rises 3 layers high.

Layer 0 (ground floor): Metal walls form the L-shaped perimeter. Concrete fills the interior floor. A pipe at row 2 col 2 and a barrel at row 2 col 3 sit inside the main hall. The door is at row 5 cols 3-4 on the wing (auto-stacks 2 high). Concrete floor in the wing interior.

Layer 1 (upper walls): Metal walls continue along the L-shaped perimeter. Windows at key positions on the outer edges (row 0 col 0, row 0 col 4, row 1 col 4, row 4 col 2, row 4 col 5). Floor fills both sections.

Layer 2 (roof): Roof tiles cover the entire L-shaped footprint including both the main hall and the wing.

Building strategy: Build the L-shaped metal perimeter first. Fill with concrete floor, place the pipe and barrel inside. Add the door on the wing. Stack upper walls with windows, then lay the L-shaped roof. About 50 blocks total.`,

  // TWO_STORY
  `The Two-Story House is a full 6-wide, 4-deep residential building (rows 1-4) that rises 5 layers to create two complete floors plus a roof. Plants decorate the front corners and tables furnish the interior.

Layer 0 (ground floor): Plants at row 0 cols 0 and 5. Walls form the perimeter at rows 1-4. A table at row 2 col 1 and a window at row 2 col 4. Floor fills the interior. A 2-high door at row 4 cols 2-3 (auto-stacks).

Layer 1 (upper ground-floor walls): Walls continue at rows 1 and 4. Windows at row 2 cols 0 and 5. Floor interior.

Layer 2 (second floor): Wall perimeter with floor interior. A table at row 3 col 1 for the upstairs room.

Layer 3 (second floor upper walls): Walls continue with windows on the east and west sides at rows 2 and 3.

Layer 4 (roof): Roof tiles cover rows 1-4, cols 0-5 (24 blocks).

Building strategy: Place ground-floor walls with table and door. Stack to layer 1 with windows. Build second floor walls with another table. Add upper windows. Cap with roof. About 55 blocks across 5 layers.`,

  // MARKET
  `The Market is an open-air structure with tables arranged in rows, barrels on the sides, plants for decoration, and a floating roof canopy supported by corner columns. It uses the full 6x6 grid and rises 3 layers.

Layer 0 (ground level): Wall posts at all four corners (row 0 cols 0 and 5, row 5 cols 0 and 5). Plants next to the corner posts (row 0 cols 1 and 4, row 5 cols 1 and 4). Barrels line the left and right sides at rows 1 and 3 (cols 0 and 5). Two rows of 3 tables each at rows 1 and 3 (cols 1-3). Floor blocks at rows 1 and 3 col 4.

Layer 1 (support columns): Wall blocks at the four corners only (row 0 cols 0 and 5, row 5 cols 0 and 5). Everything else is empty.

Layer 2 (roof canopy): Full 6x6 roof covering the entire grid (36 blocks), floating above the open market space.

Building strategy: Place corner wall posts, add plants and barrels on the sides. Fill in the table rows. Stack corner walls up to layer 1. Lay the full roof canopy on layer 2. About 45 blocks total.`,

  // FORTRESS
  `The Fortress is a walled compound spanning the entire 6x6 grid with four corner towers that rise above the main walls. A grand entrance with doors faces south. It rises 4 layers high.

Layer 0 (ground floor): Walls form the full 6x6 perimeter. Floor fills the entire interior (rows 1-4, cols 1-4). A 2-high door at row 5 cols 2-3 (auto-stacks).

Layer 1 (upper walls): Corner blocks are double-thick walls at rows 0 and 5 (cols 0-1 and 4-5). Windows on the north wall at row 0 cols 2-3, and on the east and west walls at rows 2-3. Walls continue at rows 0 and 5 with the door auto-expanded.

Layer 2 (corner towers): Wall blocks at the four corner positions only: row 0 cols 0-1, row 0 cols 4-5, row 5 cols 0-1, row 5 cols 4-5.

Layer 3 (tower roofs): Roof tiles cap each corner tower at the same positions as layer 2.

Building strategy: Build the full wall perimeter with interior floor. Add the front door. Stack upper walls with windows and thick corners. Build corner tower walls up through layer 2. Cap towers with roof. About 58 blocks total.`,
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
