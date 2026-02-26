import type { BlockType, Grid } from "./types";

export const GRID_SIZE = 6;
export const ROUND_DURATION_MS = 3 * 60 * 1000; // 3 minutes
export const DESIGN_DURATION_MS = 2 * 60 * 1000; // 2 minutes
export const TEAM_NAMES = [
  "Cabin Crew", "The Framers", "Block Party", "Roof Raisers",
  "Team Timber", "The Builders", "CNC Squad", "Pod People",
];
export const MAX_TEAM_SIZE = 2;
export const MIN_TEAM_SIZE = 2;
export const MAX_HEIGHT = 6;

export const BLOCK_COLORS: Record<BlockType, string> = {
  wall: "#8b5e3c",
  floor: "#e8e0d0",
  roof: "#5a8a68",
  window: "#7eb8cc",
  door: "#b8755d",
  plant: "#4a8c3f",
  table: "#c4956a",
  metal: "#8a9bae",
  concrete: "#a0a0a0",
  barrel: "#b07840",
  pipe: "#6e7b8a",
  air: "transparent",
  empty: "transparent",
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  wall: "Wall",
  floor: "Floor",
  roof: "Roof",
  window: "Window",
  door: "Door",
  plant: "Plant",
  table: "Table",
  metal: "Metal",
  concrete: "Concrete",
  barrel: "Barrel",
  pipe: "Pipe",
  air: "Air",
  empty: "Erase",
};

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: MAX_HEIGHT }, () => "empty" as BlockType)
    )
  );
}

export function getStackHeight(grid: Grid, row: number, col: number): number {
  const stack = grid[row]?.[col];
  if (!Array.isArray(stack)) return 0;
  for (let h = 0; h < MAX_HEIGHT; h++) {
    if (stack[h] === "empty" || stack[h] === "air") return h;
  }
  return MAX_HEIGHT;
}

export function getTopBlockHeight(grid: Grid, row: number, col: number): number {
  const stack = grid[row]?.[col];
  if (!Array.isArray(stack)) return -1;
  for (let h = MAX_HEIGHT - 1; h >= 0; h--) {
    if (stack[h] !== "empty" && stack[h] !== "air") return h;
  }
  return -1;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Convert grid column (0-based) to chess-notation letter (A, B, ...) */
export function colToLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

/** Convert grid row (0-based) to chess-notation number (1, 2, ...) */
export function rowToNumber(row: number): number {
  return row + 1;
}

/** Convert chess notation like "B3" to {row, col}. Returns null if invalid. */
export function parseChessNotation(notation: string): { row: number; col: number } | null {
  if (notation.length !== 2) return null;
  const col = notation[0].toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(notation[1], 10) - 1;
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE || isNaN(row)) return null;
  return { row, col };
}
