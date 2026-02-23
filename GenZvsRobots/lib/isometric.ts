export const TILE_WIDTH = 48;
export const TILE_HEIGHT = 24; // half of width for 2:1 iso
export const BLOCK_HEIGHT = 20;

export function gridToIso(row: number, col: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  };
}

export function isoToGrid(screenX: number, screenY: number): { row: number; col: number } {
  const col = Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2);
  const row = Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2);
  return { row, col };
}

export const GRID_PIXEL_WIDTH = TILE_WIDTH * 8 + TILE_WIDTH;
export const GRID_PIXEL_HEIGHT = TILE_HEIGHT * 8 + BLOCK_HEIGHT + TILE_HEIGHT;
