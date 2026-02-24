import type { BlockType, Grid } from "./types";

export const GRID_SIZE = 8;
export const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const DESIGN_DURATION_MS = 3 * 60 * 1000; // 3 minutes
export const TEAM_NAMES = [
  "Cabin Crew", "The Framers", "Block Party", "Roof Raisers",
  "Team Timber", "The Builders", "CNC Squad", "Pod People",
];
export const MAX_TEAM_SIZE = 3;
export const MIN_TEAM_SIZE = 2;
export const MAX_HEIGHT = 4;

export const BLOCK_COLORS: Record<BlockType, string> = {
  wall: "#8b5e3c",
  floor: "#e8e0d0",
  roof: "#5a8a68",
  window: "#7eb8cc",
  door: "#b8755d",
  plant: "#4a8c3f",
  table: "#c4956a",
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
    if (stack[h] === "empty") return h;
  }
  return MAX_HEIGHT;
}

export function getTopBlockHeight(grid: Grid, row: number, col: number): number {
  const stack = grid[row]?.[col];
  if (!Array.isArray(stack)) return -1;
  for (let h = MAX_HEIGHT - 1; h >= 0; h--) {
    if (stack[h] !== "empty") return h;
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
