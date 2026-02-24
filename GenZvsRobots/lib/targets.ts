import type { Grid, BlockType } from "./types";
import { MAX_HEIGHT } from "./constants";

// Helper: character to block type mapping
const charMap: Record<string, BlockType> = {
  "W": "wall", "F": "floor", "R": "roof",
  "N": "window", "D": "door", "P": "plant",
  "T": "table", ".": "empty",
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
// Round 1 targets (2-3 layers, simpler)
// ============================================================

const COTTAGE: Grid = parse3DTarget([
  // L0: walls + floor + door + plants around edges
  [
    "..P..P..",
    ".WWWWWW.",
    ".WFFFFW.",
    ".WFTFFW.",
    ".WFFFFW.",
    ".WFFFFW.",
    ".WFDDFW.",
    "..P..P..",
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
  // L0: walls + floor + door + plants flanking entrance
  [
    "........",
    "........",
    "..WWWW..",
    "..WFFW..",
    "..WFFW..",
    "..WDDW..",
    "..P..P..",
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
  // L0: floor platform + plants underneath
  [
    "........",
    "..P..P..",
    "..FFFF..",
    "..FFFF..",
    "..FFFF..",
    "..FFFF..",
    "..P..P..",
    "........",
  ],
  // L1: cabin walls + windows + door + table
  [
    "........",
    "..WWWW..",
    "..NFFN..",
    "..WTFW..",
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
  // L0: courtyard + tower base + plants
  [
    "..FFFF..",
    ".FFFFFF.",
    ".FWWWWF.",
    ".FWFFWF.",
    ".FWFFWF.",
    ".FWDDWF.",
    ".FFFFFF.",
    "P.FFFF.P",
  ],
  // L1: tower walls + table
  [
    "........",
    "........",
    "..WWWW..",
    "..NTFN..",
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
  `The Cottage is a cozy rectangular house, 6 columns wide and 6 rows tall, centered on the 8x8 grid (rows 1-6, cols 1-6). It rises 3 layers high. Plants decorate the corners and a table sits inside.

Layer 0 (ground floor): Plants at the four outer corners: (0,2), (0,5), (7,2), (7,5). Wall blocks form the perimeter rectangle — top wall at row 1 cols 1-6, bottom wall at row 6 cols 1-6, left wall at col 1 rows 2-5, right wall at col 6 rows 2-5. Floor tiles fill the interior (rows 2-5, cols 2-5). A table at (3,3). A 2-high door at row 6 cols 3-4 (doors auto-stack to 2 blocks high).

Layer 1 (upper floor): Walls continue upward along the north wall (row 1 cols 1-6) and south wall (row 5 cols 1-6). Windows replace walls on the east and west sides at rows 2 and 4. Solid walls remain at rows 3. Floor fills the interior. The door auto-expands to this layer.

Layer 2 (roof): Roof tiles cover rows 1-5, cols 1-6.

Building strategy: Start with plants at corners, then the ground-floor wall rectangle with interior floor and table. Add the door (it auto-stacks 2 high). Build upper walls with windows. Cap with roof.`,

  `The Garden Shed is a compact 4-column-wide, 4-row-tall structure centered on the grid (rows 2-5, cols 2-5). It rises 2 layers high with plants flanking the entrance.

Layer 0 (ground floor): Walls form a small rectangle — top wall at row 2 cols 2-5, bottom wall at row 5 cols 2-5, sides at cols 2 and 5 rows 3-4. Floor fills the interior. A 2-high door at row 5 cols 3-4 (auto-stacks). Plants flank the entrance at (6,2) and (6,5).

Layer 1 (roof): Roof tiles cover rows 2-3, cols 2-5 (8 blocks). The door auto-expands to this layer.

Building strategy: Place plants at entrance, lay the wall perimeter, fill interior floor, add door (auto-stacks), then roof tiles. About 28 blocks total.`,

  `The Treehouse is a cabin sitting on a raised platform with plants below. It rises 3 layers high.

Layer 0 (platform): Plants at four corners: (1,2), (1,5), (6,2), (6,5). A flat 4x4 floor platform at rows 2-5, cols 2-5.

Layer 1 (cabin): Walls and windows form the cabin on top. North wall at row 1 cols 2-5. Windows at corners: (2,2), (2,5), (5,2), (5,5). Walls at (3,2), (3,5), (4,2), (4,5). A table at (3,3). Floor interior. 2-high door at row 5 cols 3-4 (auto-stacks).

Layer 2 (roof): Roof tiles at rows 1-2, cols 2-5. The door auto-expands to this layer.

Building strategy: Place corner plants, lay the platform, build cabin walls with windows and table, add door (auto-stacks), cap with roof.`,

  `The Watchtower is a tall central tower surrounded by a ground-level courtyard. It rises 4 layers high with plants and a table inside.

Layer 0 (courtyard + tower base): Floor courtyard in octagonal shape. Tower base walls at rows 2-5 cols 2-5. Interior floor. 2-high door at (5,3-4) (auto-stacks). Plants at corners: (7,0) and (7,7).

Layer 1 (lower tower): Tower walls at rows 2-6 cols 2-5. Windows at (3,2) and (3,5). A table at (3,3). Floor fills interior. The door auto-expands to this layer.

Layer 2 (upper tower): Same wall layout with windows at (3,2) and (3,5). Floor interior.

Layer 3 (roof): Roof tiles at rows 2-3, cols 2-5.

Building strategy: Build courtyard floor with plants, tower walls and door (auto-stacks), table inside. Stack tower walls up through layers 1-2 with windows. Cap with roof.`,
];

// ============================================================
// Round 2 targets (2-4 layers, complex)
// ============================================================

const BARN: Grid = parse3DTarget([
  // L0: walls + floor + doors + plants along path
  [
    "WWWWWWWW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WFFFFFFW",
    "WWFDDWWW",
    "FPFFFFPF",
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
  // L0: ground walls + plants + tables inside
  [
    "WW.PP.WW",
    "WWWWWWWW",
    "WNTFFTNW",
    "WFFFFFFW",
    "WNFFFFNW",
    "WWWWWWWW",
    "WWWDDWWW",
    "FPFFFFPF",
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
  // L0: cross plan + plants
  [
    "...WW...",
    "..WFFW..",
    ".WFFFFW.",
    "WNFFFFNW",
    ".WFFFFW.",
    "..WFFW..",
    "..WDDW..",
    ".P.FF.P.",
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
  // L0: lower shop + tables (shop displays)
  [
    "WWWWWWWW",
    "WFFFFFFW",
    "WNFFFFNW",
    "WWWWWWWW",
    "NNFTFNNN",
    "WFFFFFFW",
    "WFFDDFFW",
    "FPFFFFPF",
  ],
  // L1: upper floor + windows
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
  `The Barn is a large full-width structure spanning the entire 8-column grid, 7 rows deep (rows 0-6), with a path at row 7. It rises 3 layers high with plants along the path.

Layer 0 (ground floor): Walls form the perimeter. Floor fills the interior. 2-high doors at row 6 cols 3-4 (auto-stack). Row 7 is a floor path with plants at (7,1) and (7,6).

Layer 1 (upper walls): Walls continue with windows at corners: (0,1), (0,6), (3,0), (3,7), (6,1), (6,6). Floor fills interior. Doors auto-expand to this layer.

Layer 2 (roof): Roof tiles cover rows 0-6, cols 0-7 (56 blocks).

Building strategy: Build ground-floor walls, fill interior with floor, add doors (auto-stack), path with plants. Stack upper walls with windows. Lay the massive roof. About 100 blocks total.`,

  `The Castle is a walled fortress with four corner towers, plants in the courtyard, and tables inside. It rises 4 layers high.

Layer 0 (ground floor): Corner towers at (0,0-1) and (0,6-7). Plants between towers at (0,3) and (0,4). Full wall rows. Windows and tables inside at (2,1), (2,2) and (2,5), (2,6). Floor interior. 2-high doors at row 6 cols 3-4 (auto-stack). Row 7 path with plants at (7,1) and (7,6). Corner towers also at (6,0-1) and (6,6-7).

Layer 1 (upper walls): Same wall pattern without doors or row 7. Corner towers, walls, windows, floor interior.

Layer 2 (corner towers only): Wall blocks at the 4 corner tower positions.

Layer 3 (tower roofs): Roof tiles cap the corner towers.

Building strategy: Build walls with interior tables and plants. Add doors (auto-stack) and path. Stack upper walls. Add tower walls and roofs. About 95 blocks total.`,

  `The Church has a cross-shaped (cruciform) floor plan with a steeple and plants at the entrance. It rises 4 layers high.

Layer 0 (ground floor): Cross shape with walls, floor interior, and windows on transept sides. 2-high doors at row 6 cols 3-4 (auto-stack). Entry path floor at row 7 cols 3-4 with plants at (7,1) and (7,6).

Layer 1 (upper walls): Same cross shape continues with windows. Floor fills interior. Doors auto-expand to this layer.

Layer 2 (roof): Roof tiles in cross shape from narrow top to full transept width.

Layer 3 (steeple): 2 roof blocks at row 1 cols 3-4.

Building strategy: Build cross-shaped ground floor with plants at entrance. Add doors (auto-stack). Stack upper walls. Lay cross-shaped roof. Place steeple. About 85 blocks total.`,

  `The Storefront is a two-story commercial building with shop display tables and plants outside. The back half (rows 0-3) is 2-story; the front (rows 4-7) is single-story. Full width. Rises 3 layers.

Layer 0 (ground floor): Walls span full width. Back section with interior floor and windows. Dividing wall at row 3. Front section with display windows and a table at (4,3). Floor interior. 2-high doors at row 6 cols 3-4 (auto-stack). Row 7 sidewalk with plants at (7,1) and (7,6).

Layer 1 (upper floor — back half): Walls with windows at (0,1), (0,6), (2,1), (2,6). Floor interior. Doors auto-expand to this layer.

Layer 2 (roof — back half): Roof tiles at rows 0-3, cols 0-7.

Building strategy: Build ground floor walls for both sections. Fill interiors with floor and display table. Add doors (auto-stack) and sidewalk with plants. Stack upper floor on back half. Cap with roof. About 85 blocks total.`,
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
