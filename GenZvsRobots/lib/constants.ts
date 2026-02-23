import type { BlockType, Grid } from "./types";

export const GRID_SIZE = 8;
export const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const TEAM_NAMES = [
  "Cabin Crew", "The Framers", "Block Party", "Roof Raisers",
  "Team Timber", "The Builders", "CNC Squad", "Pod People",
];
export const MAX_TEAM_SIZE = 3;
export const MIN_TEAM_SIZE = 2;

export const BLOCK_COLORS: Record<BlockType, string> = {
  wall: "#8b5e3c",
  floor: "#e8e0d0",
  roof: "#3d6b4f",
  window: "#b89f65",
  door: "#b8755d",
  empty: "transparent",
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  wall: "Wall",
  floor: "Floor",
  roof: "Roof",
  window: "Window",
  door: "Door",
  empty: "Erase",
};

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "empty" as BlockType)
  );
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
