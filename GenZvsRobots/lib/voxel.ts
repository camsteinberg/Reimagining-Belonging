import { GRID_SIZE, MAX_HEIGHT } from "./constants";
import { TILE_W, TILE_H, BLOCK_H, FLOOR_H } from "./sprites";
import type { Grid } from "./types";

export type Rotation = 0 | 1 | 2 | 3;

/**
 * Rotate grid coordinates for a given camera rotation.
 * Rotation 0 = NE (default), 1 = NW, 2 = SW, 3 = SE.
 */
export function rotateCoords(
  row: number,
  col: number,
  rotation: Rotation,
  size: number = GRID_SIZE,
): { r: number; c: number } {
  const max = size - 1;
  switch (rotation) {
    case 0: return { r: row, c: col };
    case 1: return { r: col, c: max - row };
    case 2: return { r: max - row, c: max - col };
    case 3: return { r: max - col, c: row };
  }
}

/**
 * Convert rotated grid position to screen (pixel) coordinates.
 * Returns the top-center anchor point of the isometric tile.
 */
export function gridToScreen(
  row: number,
  col: number,
  rotation: Rotation,
): { x: number; y: number } {
  const { r, c } = rotateCoords(row, col, rotation);
  return {
    x: (c - r) * (TILE_W / 2),
    y: (c + r) * (TILE_H / 2),
  };
}

/**
 * Convert screen coordinates back to grid position (inverse of gridToScreen).
 * Applies inverse rotation after iso-to-grid conversion.
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  rotation: Rotation,
): { row: number; col: number } {
  // Inverse isometric projection
  const c = Math.round((screenX / (TILE_W / 2) + screenY / (TILE_H / 2)) / 2);
  const r = Math.round((screenY / (TILE_H / 2) - screenX / (TILE_W / 2)) / 2);

  // Inverse rotation
  const inv = ((4 - rotation) % 4) as Rotation;
  const { r: row, c: col } = rotateCoords(r, c, inv);
  return { row, col };
}

/**
 * Get draw order (back-to-front) for painter's algorithm given a rotation.
 * Returns array of [row, col] pairs in the order they should be drawn.
 */
export function getDrawOrder(rotation: Rotation): [number, number][] {
  const order: [number, number][] = [];
  const n = GRID_SIZE;

  // After rotation, we always draw back-to-front in rotated space.
  // We iterate in the rotated row/col order and convert back to original coords.
  for (let rr = 0; rr < n; rr++) {
    for (let rc = 0; rc < n; rc++) {
      // rr, rc are positions in rotated space. Convert back to original grid.
      const inv = ((4 - rotation) % 4) as Rotation;
      const { r: row, c: col } = rotateCoords(rr, rc, inv);
      order.push([row, col]);
    }
  }

  return order;
}

/**
 * Test if a point (px, py) is inside a diamond defined by 4 vertices.
 * Uses cross-product winding for convex polygon.
 */
function pointInDiamond(px: number, py: number, pts: [number, number][]): boolean {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ex = pts[j][0] - pts[i][0];
    const ey = pts[j][1] - pts[i][1];
    const tx = px - pts[i][0];
    const ty = py - pts[i][1];
    if (ex * ty - ey * tx < 0) return false;
  }
  return true;
}

/**
 * Height-aware screen-to-grid conversion.
 * Checks all grid cells from tallest stack to shortest, testing if the
 * screen point lands on the top face diamond of each stack. Falls back
 * to standard screenToGrid() if nothing hit.
 */
export function screenToGridWithHeight(
  screenX: number,
  screenY: number,
  rotation: Rotation,
  grid: Grid,
): { row: number; col: number } {
  // Build list of cells with their visual height, sorted tallest first
  const cells: { row: number; col: number; heightPx: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const stack = grid[r]?.[c];
      if (!stack) continue;
      let heightPx = 0;
      for (let h = 0; h < MAX_HEIGHT; h++) {
        const block = stack[h];
        if (!block || block === "empty" || block === "air") break;
        heightPx += block === "floor" ? FLOOR_H : BLOCK_H;
      }
      if (heightPx > 0) {
        cells.push({ row: r, col: c, heightPx });
      }
    }
  }
  // Sort tallest first so we check topmost faces first
  cells.sort((a, b) => b.heightPx - a.heightPx);

  for (const { row, col, heightPx } of cells) {
    const { x, y } = gridToScreen(row, col, rotation);
    // Top face diamond of the topmost block, offset upward by stack height
    const topY = y - heightPx;
    const diamond: [number, number][] = [
      [x, topY],                              // top vertex
      [x + TILE_W / 2, topY + TILE_H / 2],   // right vertex
      [x, topY + TILE_H],                     // bottom vertex
      [x - TILE_W / 2, topY + TILE_H / 2],   // left vertex
    ];
    if (pointInDiamond(screenX, screenY, diamond)) {
      return { row, col };
    }
  }

  // Fallback: standard ground-plane detection
  return screenToGrid(screenX, screenY, rotation);
}
