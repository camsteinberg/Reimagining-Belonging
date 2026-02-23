import { GRID_SIZE } from "./constants";
import { TILE_W, TILE_H } from "./sprites";

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
