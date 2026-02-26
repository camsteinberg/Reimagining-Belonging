import type { Grid, BlockType } from "./types";
import { GRID_SIZE, MAX_HEIGHT, getStackHeight, getTopBlockHeight, colToLetter, rowToNumber } from "./constants";
import { getSpriteAtlas, getSpriteRect, SPRITE_SIZE, TILE_W, TILE_H, BLOCK_H, FLOOR_H, type SpriteType } from "./sprites";
import { gridToScreen, getDrawOrder, type Rotation } from "./voxel";

export interface RenderOptions {
  grid: Grid;
  width: number;
  height: number;
  rotation: Rotation;
  showScoring?: boolean;
  targetGrid?: Grid;
  aiPlacedCells?: Set<string>;
  newCells?: Map<string, number>;
  animTime?: number;
  hoverCell?: { row: number; col: number } | null;
  hoverBlock?: BlockType;
  topDown?: boolean;
}

// Centering offset for sprite positioning
const OX = (SPRITE_SIZE - TILE_W) / 2; // 8

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
export function getGridExtent(rotation: Rotation): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const { x, y } = gridToScreen(r, c, rotation);
      // Tile diamond corners
      minX = Math.min(minX, x - TILE_W / 2);
      maxX = Math.max(maxX, x + TILE_W / 2);
      // Account for sprite height (taller than tile) + max stack
      const maxStackPixels = MAX_HEIGHT * BLOCK_H;
      minY = Math.min(minY, y - (SPRITE_SIZE - TILE_H) - maxStackPixels);
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
  const cx = screenX + TILE_W / 2 + OX;

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
  const cx = screenX + TILE_W / 2 + OX;
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

// Draw hover preview (semi-transparent block + diamond outline)
function drawHoverPreview(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  row: number,
  col: number,
  block: BlockType,
  rotation: Rotation,
  grid: Grid,
) {
  const { x, y } = gridToScreen(row, col, rotation);

  // Calculate height offset for stacking
  let heightOffset = 0;
  const stack = grid[row]?.[col];
  if (stack) {
    if (block === "empty") {
      // Erasing: show at top block height
      const topH = getTopBlockHeight(grid, row, col);
      for (let below = 0; below <= topH && below >= 0; below++) {
        heightOffset += (stack[below] === "floor" ? FLOOR_H : BLOCK_H);
      }
      // Adjust back to top of the topmost block
      if (topH >= 0) {
        heightOffset -= (stack[topH] === "floor" ? FLOOR_H : BLOCK_H);
      }
    } else {
      // Placing: show at next available height
      const nextH = getStackHeight(grid, row, col);
      for (let below = 0; below < nextH; below++) {
        heightOffset += (stack[below] === "floor" ? FLOOR_H : BLOCK_H);
      }
    }
  }

  // Draw white diamond outline on ground tile (at height)
  const hoverY = y - heightOffset;
  ctx.beginPath();
  ctx.moveTo(x, hoverY);
  ctx.lineTo(x + TILE_W / 2, hoverY + TILE_H / 2);
  ctx.lineTo(x, hoverY + TILE_H);
  ctx.lineTo(x - TILE_W / 2, hoverY + TILE_H / 2);
  ctx.closePath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw 50%-opacity sprite of the hover block
  if (block && block !== "empty" && block !== "air") {
    // When hovering a door on top of another door, show door_top sprite
    let hoverSprite: SpriteType = block as SpriteType;
    if (block === "door" && stack) {
      const nextH = getStackHeight(grid, row, col);
      if (nextH > 0 && stack[nextH - 1] === "door") {
        hoverSprite = "door_top";
      }
    }
    const { sx, sy, sw, sh } = getSpriteRect(hoverSprite, rotation);
    const dx = x - TILE_W / 2 - OX;
    const dy = y - (SPRITE_SIZE - TILE_H) - heightOffset;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(atlas, sx, sy, sw, sh, dx, dy, SPRITE_SIZE, SPRITE_SIZE);
    ctx.restore();
  }
}

// Chess-notation axis labels (A-F columns, 1-6 rows)
function drawAxisLabels(ctx: CanvasRenderingContext2D, rotation: Rotation): void {
  ctx.save();
  ctx.fillStyle = "rgba(42, 37, 32, 0.35)";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Column letters along top-left edge (row = -0.7, varying col)
  for (let col = 0; col < GRID_SIZE; col++) {
    const { x, y } = gridToScreen(-0.7, col, rotation);
    ctx.fillText(colToLetter(col), x, y + TILE_H / 2);
  }

  // Row numbers along top-right edge (col = -0.7, varying row)
  for (let row = 0; row < GRID_SIZE; row++) {
    const { x, y } = gridToScreen(row, -0.7, rotation);
    ctx.fillText(String(rowToNumber(row)), x, y + TILE_H / 2);
  }

  ctx.restore();
}

// Inline block colors to avoid circular dep issues
const TOP_DOWN_COLORS: Record<string, string> = {
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
};

// Flat 2D overhead grid renderer
function renderTopDown(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  width: number,
  height: number,
  showScoring: boolean,
  targetGrid?: Grid,
  hoverCell?: { row: number; col: number } | null,
  hoverBlock?: BlockType,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  // Calculate cell size to fit grid with padding
  const padding = 16;
  const availW = width - padding * 2;
  const availH = height - padding * 2;
  const cellSize = Math.floor(Math.min(availW / GRID_SIZE, availH / GRID_SIZE));
  const gridPxW = cellSize * GRID_SIZE;
  const gridPxH = cellSize * GRID_SIZE;
  const originX = Math.floor((width - gridPxW) / 2);
  const originY = Math.floor((height - gridPxH) / 2);

  // Draw cells
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = originX + col * cellSize;
      const y = originY + row * cellSize;

      // Find topmost block
      let topBlock: BlockType = "empty";
      const stack = grid[row]?.[col];
      if (stack) {
        for (let h = MAX_HEIGHT - 1; h >= 0; h--) {
          if (stack[h] && stack[h] !== "empty" && stack[h] !== "air") {
            topBlock = stack[h];
            break;
          }
        }
      }

      // Fill cell
      if (topBlock !== "empty" && topBlock !== "air") {
        ctx.fillStyle = TOP_DOWN_COLORS[topBlock] ?? "#ccc";
      } else {
        // Checkerboard for empty cells
        const isDark = (row + col) % 2 === 0;
        ctx.fillStyle = isDark ? "#d4cfc4" : "#cec8bc";
      }
      ctx.fillRect(x, y, cellSize, cellSize);

      // Grid lines
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Scoring overlay
      if (showScoring && targetGrid) {
        let hasOverlay = false;
        let allCorrect = true;
        for (let h = 0; h < MAX_HEIGHT; h++) {
          const expected = targetGrid[row]?.[col]?.[h];
          const actual = grid[row]?.[col]?.[h];
          const expEmpty = !expected || expected === "empty" || expected === "air";
          const actEmpty = !actual || actual === "empty" || actual === "air";
          if (!expEmpty || !actEmpty) {
            hasOverlay = true;
            if (expEmpty !== actEmpty || expected !== actual) {
              allCorrect = false;
            }
          }
        }
        if (hasOverlay) {
          ctx.fillStyle = allCorrect
            ? "rgba(34, 197, 94, 0.4)"
            : "rgba(239, 68, 68, 0.4)";
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
      }

      // Hover highlight
      if (hoverCell && hoverCell.row === row && hoverCell.col === col) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        // Hover block preview
        if (hoverBlock && hoverBlock !== "empty" && hoverBlock !== "air") {
          ctx.fillStyle = TOP_DOWN_COLORS[hoverBlock] ?? "#ccc";
          ctx.globalAlpha = 0.45;
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          ctx.globalAlpha = 1.0;
        }
      }

      // Coordinate label
      const label = colToLetter(col) + String(rowToNumber(row));
      const fontSize = Math.max(8, Math.floor(cellSize * 0.28));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Dark text on light cells, light text on dark cells
      const isLight = topBlock === "empty" || topBlock === "air" || topBlock === "floor" || topBlock === "window" || topBlock === "concrete";
      ctx.fillStyle = isLight ? "rgba(42, 37, 32, 0.55)" : "rgba(255, 255, 255, 0.7)";
      ctx.fillText(label, x + cellSize / 2, y + cellSize / 2);
    }
  }
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
    hoverCell,
    hoverBlock,
  } = opts;

  // Top-down 2D view — early return
  if (opts.topDown) {
    renderTopDown(ctx, grid, width, height, showScoring ?? false, targetGrid, hoverCell, hoverBlock);
    return;
  }

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

  // 1b. Draw chess-notation axis labels
  drawAxisLabels(ctx, rotation);

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
    const stack = grid[row]?.[col];
    if (!stack) continue;

    for (let h = 0; h < MAX_HEIGHT; h++) {
      const block = stack[h];
      if (!block || block === "empty" || block === "air") continue;

      const { x, y } = gridToScreen(row, col, rotation);
      // Detect door-on-door stacking: upper door renders as door_top
      let spriteBlock: SpriteType = block as SpriteType;
      if (block === "door" && h > 0 && stack[h - 1] === "door") {
        spriteBlock = "door_top";
      }
      const { sx, sy, sw, sh } = getSpriteRect(spriteBlock, rotation);
      const blockH = block === "floor" ? FLOOR_H : BLOCK_H;

      // Calculate cumulative height offset from blocks below
      let heightOffset = 0;
      for (let below = 0; below < h; below++) {
        heightOffset += (stack[below] === "floor" ? FLOOR_H : BLOCK_H);
      }

      let dx = x - TILE_W / 2 - OX;
      let dy = y - (SPRITE_SIZE - TILE_H) - heightOffset;

      // Drop animation for new cells (per-cell timestamps for independent animation)
      const key = `${row},${col},${h}`;
      const cellStart = newCells?.get(key);
      if (cellStart !== undefined) {
        const cellElapsed = animTime - cellStart;
        const progress = Math.min(1, cellElapsed / 400);
        const bounce = easeOutBounce(progress);
        dy -= 30 * (1 - bounce);
      }

      ctx.drawImage(atlas, sx, sy, sw, sh, dx, dy, SPRITE_SIZE, SPRITE_SIZE);

      // Scoring overlay
      if (showScoring && targetGrid) {
        const expected = targetGrid[row]?.[col]?.[h];
        const actual = block;
        if (expected && expected !== "empty") {
          drawScoringOverlay(ctx, dx, dy, actual === expected, blockH);
        } else if (expected === "empty") {
          drawScoringOverlay(ctx, dx, dy, false, blockH);
        }
      }

      // AI pulse overlay
      if (aiPlacedCells?.has(`${row},${col}`)) {
        drawAIPulse(ctx, dx, dy, blockH, animTime);
      }
    }
  }

  // 3. Draw scoring overlay for empty cells that should have blocks
  if (showScoring && targetGrid) {
    for (const [row, col] of drawOrder) {
      for (let h = 0; h < MAX_HEIGHT; h++) {
        const expected = targetGrid[row]?.[col]?.[h];
        const actual = grid[row]?.[col]?.[h];
        if (expected && expected !== "empty" && expected !== "air" && (!actual || actual === "empty" || actual === "air")) {
          const { x, y } = gridToScreen(row, col, rotation);
          let heightOffset = 0;
          const stack = grid[row]?.[col];
          if (stack) {
            for (let below = 0; below < h; below++) {
              heightOffset += (stack[below] === "floor" ? FLOOR_H : BLOCK_H);
            }
          }
          const cx = x;
          const cy = y + TILE_H / 2 - heightOffset;
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
          ctx.fill();
        }
      }
    }
  }

  // 4. Draw hover preview
  if (hoverCell && hoverBlock) {
    drawHoverPreview(ctx, atlas, hoverCell.row, hoverCell.col, hoverBlock, rotation, grid);
  }

  ctx.restore();
}
