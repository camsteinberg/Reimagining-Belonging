import type { Grid } from "./types";
import { GRID_SIZE } from "./constants";
import { getSpriteAtlas, getSpriteRect, SPRITE_SIZE, TILE_W, TILE_H, BLOCK_H, FLOOR_H } from "./sprites";
import { gridToScreen, getDrawOrder, type Rotation } from "./voxel";

export interface RenderOptions {
  grid: Grid;
  width: number;
  height: number;
  rotation: Rotation;
  showScoring?: boolean;
  targetGrid?: Grid;
  aiPlacedCells?: Set<string>;
  newCells?: Set<string>;
  animTime?: number;
}

// Ease-out bounce for drop animation
function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75;
    return 7.5625 * t2 * t2 + 0.75;
  } else if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75;
    return 7.5625 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
}

// Grid extent in pixel space (for fitting/centering)
function getGridExtent(rotation: Rotation): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const { x, y } = gridToScreen(r, c, rotation);
      // Tile diamond corners
      minX = Math.min(minX, x - TILE_W / 2);
      maxX = Math.max(maxX, x + TILE_W / 2);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + TILE_H + BLOCK_H);
    }
  }
  return { minX, minY, maxX, maxY };
}

// Ground-plane diamond tile
function drawGroundTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + TILE_W / 2, cy + TILE_H / 2);
  ctx.lineTo(cx, cy + TILE_H);
  ctx.lineTo(cx - TILE_W / 2, cy + TILE_H / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// Scoring overlay on top face area
function drawScoringOverlay(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  correct: boolean,
  h: number,
) {
  const yOff = SPRITE_SIZE - TILE_H - h;
  const topY = screenY + yOff;
  const cx = screenX + TILE_W / 2;

  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + TILE_W / 2, topY + TILE_H / 2);
  ctx.lineTo(cx, topY + TILE_H);
  ctx.lineTo(cx - TILE_W / 2, topY + TILE_H / 2);
  ctx.closePath();
  ctx.fillStyle = correct
    ? "rgba(34, 197, 94, 0.45)"
    : "rgba(239, 68, 68, 0.45)";
  ctx.fill();
}

// AI placed pulsing overlay
function drawAIPulse(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  h: number,
  animTime: number,
) {
  const yOff = SPRITE_SIZE - TILE_H - h;
  const topY = screenY + yOff;
  const cx = screenX + TILE_W / 2;
  const opacity = 0.55 + 0.35 * Math.sin((animTime / 1600) * Math.PI * 2);

  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + TILE_W / 2, topY + TILE_H / 2);
  ctx.lineTo(cx, topY + TILE_H);
  ctx.lineTo(cx - TILE_W / 2, topY + TILE_H / 2);
  ctx.closePath();
  ctx.fillStyle = `rgba(120, 160, 130, ${opacity})`;
  ctx.fill();
}

export function renderVoxelGrid(
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions,
): void {
  const {
    grid,
    width,
    height,
    rotation,
    showScoring,
    targetGrid,
    aiPlacedCells,
    newCells,
    animTime = 0,
  } = opts;

  // Clear
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  // Calculate scale to fit grid in canvas
  const extent = getGridExtent(rotation);
  const gridW = extent.maxX - extent.minX;
  const gridH = extent.maxY - extent.minY;
  const padding = 8;
  const scaleX = (width - padding * 2) / gridW;
  const scaleY = (height - padding * 2) / gridH;
  const scale = Math.min(scaleX, scaleY);

  ctx.save();
  // Center the grid
  const offsetX = (width - gridW * scale) / 2 - extent.minX * scale;
  const offsetY = (height - gridH * scale) / 2 - extent.minY * scale;
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const drawOrder = getDrawOrder(rotation);

  // 1. Draw ground plane
  for (const [row, col] of drawOrder) {
    const { x, y } = gridToScreen(row, col, rotation);
    const isDark = (row + col) % 2 === 0;
    drawGroundTile(ctx, x, y, isDark ? "#d4cfc4" : "#cec8bc");
  }

  // 2. Draw blocks
  let atlas: HTMLCanvasElement;
  try {
    atlas = getSpriteAtlas();
  } catch {
    // SSR or no DOM — skip block drawing
    ctx.restore();
    return;
  }

  for (const [row, col] of drawOrder) {
    const block = grid[row]?.[col];
    if (!block || block === "empty") continue;

    const { x, y } = gridToScreen(row, col, rotation);
    const { sx, sy, sw, sh } = getSpriteRect(block, rotation);
    const h = block === "floor" ? FLOOR_H : BLOCK_H;

    // Sprite screen position: center sprite on tile
    let dx = x - TILE_W / 2;
    let dy = y - (SPRITE_SIZE - TILE_H);

    // Drop animation for new cells
    const key = `${row},${col}`;
    if (newCells?.has(key)) {
      const elapsed = animTime;
      const progress = Math.min(1, elapsed / 400);
      const bounce = easeOutBounce(progress);
      dy -= 30 * (1 - bounce);
    }

    ctx.drawImage(atlas, sx, sy, sw, sh, dx, dy, SPRITE_SIZE, SPRITE_SIZE);

    // Scoring overlay
    if (showScoring && targetGrid) {
      const expected = targetGrid[row]?.[col];
      const actual = block;
      if (expected && expected !== "empty") {
        drawScoringOverlay(ctx, dx, dy, actual === expected, h);
      } else if (expected === "empty") {
        // Block placed where target is empty = incorrect
        drawScoringOverlay(ctx, dx, dy, false, h);
      }
    }

    // AI pulse overlay
    if (aiPlacedCells?.has(key)) {
      drawAIPulse(ctx, dx, dy, h, animTime);
    }
  }

  // 3. Draw scoring overlay for empty cells that should have blocks
  if (showScoring && targetGrid) {
    for (const [row, col] of drawOrder) {
      const expected = targetGrid[row]?.[col];
      const actual = grid[row]?.[col];
      if (expected && expected !== "empty" && (!actual || actual === "empty")) {
        const { x, y } = gridToScreen(row, col, rotation);
        // Draw a small red marker on the ground tile
        const cx = x;
        const cy = y + TILE_H / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
        ctx.fill();
      }
    }
  }

  ctx.restore();
}
