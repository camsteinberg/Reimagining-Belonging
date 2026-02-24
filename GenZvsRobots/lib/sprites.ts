import type { BlockType } from "./types";
import { BLOCK_COLORS } from "./constants";

export const TILE_W = 48;
export const TILE_H = 24;
export const BLOCK_H = 20;
export const FLOOR_H = 4;
export const SPRITE_SIZE = 64;

type Rotation = 0 | 1 | 2 | 3;

// Sprite types include all block types plus the non-user-placeable door_top variant
export const SPRITE_TYPES = ["wall", "floor", "roof", "window", "door", "door_top", "plant", "table", "empty"] as const;
export type SpriteType = (typeof SPRITE_TYPES)[number];

// Centering offset: (SPRITE_SIZE - TILE_W) / 2
const OX = 8;

// --- Color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function adjustRgb(rgb: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.max(0, Math.min(255, rgb[0] + amount)),
    Math.max(0, Math.min(255, rgb[1] + amount)),
    Math.max(0, Math.min(255, rgb[2] + amount)),
  ];
}

// --- Pixel-perfect drawing helpers (no anti-aliasing) ---

function setPixel(img: ImageData, x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) return;
  const i = (iy * img.width + ix) * 4;
  img.data[i] = r;
  img.data[i + 1] = g;
  img.data[i + 2] = b;
  img.data[i + 3] = a;
}

/** Bresenham's line algorithm — integer-only, no anti-aliasing */
function drawLine(img: ImageData, x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number): void {
  let ix0 = Math.round(x0), iy0 = Math.round(y0);
  const ix1 = Math.round(x1), iy1 = Math.round(y1);
  const dx = Math.abs(ix1 - ix0);
  const dy = -Math.abs(iy1 - iy0);
  const sx = ix0 < ix1 ? 1 : -1;
  const sy = iy0 < iy1 ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    setPixel(img, ix0, iy0, r, g, b);
    if (ix0 === ix1 && iy0 === iy1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; ix0 += sx; }
    if (e2 <= dx) { err += dx; iy0 += sy; }
  }
}

/** Scanline polygon fill — integer math, no anti-aliasing */
function fillPoly(img: ImageData, points: [number, number][], r: number, g: number, b: number, a: number = 255): void {
  if (points.length < 3) return;

  // Find bounding box
  let minY = Infinity, maxY = -Infinity;
  for (const [, py] of points) {
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  minY = Math.round(minY);
  maxY = Math.round(maxY);

  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const [x0, y0] = points[i];
      const [x1, y1] = points[j];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        const t = (y - y0) / (y1 - y0);
        intersections.push(Math.round(x0 + t * (x1 - x0)));
      }
    }
    intersections.sort((a2, b2) => a2 - b2);
    for (let k = 0; k < intersections.length - 1; k += 2) {
      for (let x = intersections[k]; x <= intersections[k + 1]; x++) {
        setPixel(img, x, y, r, g, b, a);
      }
    }
  }
}

/** 1px Bresenham outline around a polygon */
function outlinePoly(img: ImageData, points: [number, number][], r: number, g: number, b: number): void {
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    drawLine(img, points[i][0], points[i][1], points[j][0], points[j][1], r, g, b);
  }
}

// --- Face geometry (integer coordinates centered in 64px sprite) ---

function topFacePoints(yOff: number): [number, number][] {
  return [
    [OX + 24, yOff],
    [OX + 48, yOff + 12],
    [OX + 24, yOff + 24],
    [OX, yOff + 12],
  ];
}

function leftFacePoints(yOff: number, h: number): [number, number][] {
  return [
    [OX, yOff + 12],
    [OX + 24, yOff + 24],
    [OX + 24, yOff + 24 + h],
    [OX, yOff + 12 + h],
  ];
}

function rightFacePoints(yOff: number, h: number): [number, number][] {
  return [
    [OX + 24, yOff + 24],
    [OX + 48, yOff + 12],
    [OX + 48, yOff + 12 + h],
    [OX + 24, yOff + 24 + h],
  ];
}

// --- Block-specific decorations ---

function drawWallDecorations(img: ImageData, yOff: number, h: number, leftRgb: [number, number, number], rightRgb: [number, number, number]): void {
  // Horizontal mortar lines on left face every 5px
  const mortarLeft = adjustRgb(leftRgb, -15);
  for (let dy = 5; dy < h; dy += 5) {
    const y = yOff + 24 + dy;
    const leftX0 = OX;
    const leftX1 = OX + 24;
    drawLine(img, leftX0 + 1, Math.round(yOff + 12 + dy), leftX1 - 1, y, mortarLeft[0], mortarLeft[1], mortarLeft[2]);
  }

  // Horizontal mortar lines on right face every 5px
  const mortarRight = adjustRgb(rightRgb, -15);
  for (let dy = 5; dy < h; dy += 5) {
    const y = yOff + 24 + dy;
    drawLine(img, OX + 24 + 1, y, OX + 48 - 1, Math.round(yOff + 12 + dy), mortarRight[0], mortarRight[1], mortarRight[2]);
  }
}

function drawWindowDecorations(img: ImageData, yOff: number, h: number): void {
  const glassR = 0xa8, glassG = 0xd8, glassB = 0xea;
  const frameR = 0x3a, frameG = 0x3a, frameB = 0x4a;

  // --- Left face: semi-transparent glass pane with cross pattern ---
  const lCx = OX + 12;
  const lCy = yOff + 18 + Math.floor(h / 2);
  // Glass fill with alpha for semi-transparency (Minecraft-style)
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      setPixel(img, lCx - 1 + dx, lCy - 2 + dy, glassR, glassG, glassB, 150);
    }
  }
  // Cross dividers at 50% opacity
  const crossR = 0x70, crossG = 0x90, crossB = 0xa0;
  // Horizontal divider across middle
  for (let dx = 0; dx < 3; dx++) {
    setPixel(img, lCx - 1 + dx, lCy, crossR, crossG, crossB, 128);
  }
  // Vertical divider down center
  for (let dy = 0; dy < 4; dy++) {
    setPixel(img, lCx, lCy - 2 + dy, crossR, crossG, crossB, 128);
  }
  // 1px dark frame around window
  for (let dx = -1; dx <= 3; dx++) {
    setPixel(img, lCx - 1 + dx, lCy - 3, frameR, frameG, frameB);
    setPixel(img, lCx - 1 + dx, lCy + 2, frameR, frameG, frameB);
  }
  for (let dy = -2; dy <= 2; dy++) {
    setPixel(img, lCx - 2, lCy + dy, frameR, frameG, frameB);
    setPixel(img, lCx + 3, lCy + dy, frameR, frameG, frameB);
  }

  // --- Right face: semi-transparent glass pane with cross pattern ---
  const rCx = OX + 36;
  const rCy = yOff + 18 + Math.floor(h / 2);
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      setPixel(img, rCx - 1 + dx, rCy - 2 + dy, glassR, glassG, glassB, 150);
    }
  }
  // Cross dividers
  for (let dx = 0; dx < 3; dx++) {
    setPixel(img, rCx - 1 + dx, rCy, crossR, crossG, crossB, 128);
  }
  for (let dy = 0; dy < 4; dy++) {
    setPixel(img, rCx, rCy - 2 + dy, crossR, crossG, crossB, 128);
  }
  // 1px dark frame
  for (let dx = -1; dx <= 3; dx++) {
    setPixel(img, rCx - 1 + dx, rCy - 3, frameR, frameG, frameB);
    setPixel(img, rCx - 1 + dx, rCy + 2, frameR, frameG, frameB);
  }
  for (let dy = -2; dy <= 2; dy++) {
    setPixel(img, rCx - 2, rCy + dy, frameR, frameG, frameB);
    setPixel(img, rCx + 3, rCy + dy, frameR, frameG, frameB);
  }
}

function drawDoorDecoration(img: ImageData, yOff: number, h: number): void {
  const doorR = 0x3d, doorG = 0x2b, doorB = 0x1f;
  const knobR = 0xc0, knobG = 0xa0, knobB = 0x50;

  // Door on right face: 4x6 panel near bottom (larger than before)
  const dCx = OX + 36;
  const dCy = yOff + 24 + h - 8;
  for (let dy = 0; dy < 6; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      setPixel(img, dCx - 2 + dx, dCy + dy, doorR, doorG, doorB);
    }
  }
  // Rounded top corners — darken corners for arch effect
  const darkR = 0x2a, darkG = 0x1c, darkB = 0x14;
  setPixel(img, dCx - 2, dCy, darkR, darkG, darkB);
  setPixel(img, dCx + 1, dCy, darkR, darkG, darkB);
  // Larger handle dot (2px)
  setPixel(img, dCx + 1, dCy + 3, knobR, knobG, knobB);
  setPixel(img, dCx + 1, dCy + 4, knobR, knobG, knobB);
}

function drawDoorTopDecorations(img: ImageData, yOff: number, h: number): void {
  // Upper half of 2-high door: transom window on right face
  const glassR = 0xa8, glassG = 0xd8, glassB = 0xea;
  const frameR = 0x3a, frameG = 0x3a, frameB = 0x4a;

  // Small transom window: 3x2 glass rectangle centered on right face
  const rCx = OX + 36;
  const rCy = yOff + 18 + Math.floor(h / 2);
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      setPixel(img, rCx - 1 + dx, rCy - 1 + dy, glassR, glassG, glassB, 150);
    }
  }
  // 1px frame around transom
  for (let dx = -1; dx <= 3; dx++) {
    setPixel(img, rCx - 1 + dx, rCy - 2, frameR, frameG, frameB);
    setPixel(img, rCx - 1 + dx, rCy + 1, frameR, frameG, frameB);
  }
  for (let dy = -1; dy <= 1; dy++) {
    setPixel(img, rCx - 2, rCy + dy, frameR, frameG, frameB);
    setPixel(img, rCx + 2, rCy + dy, frameR, frameG, frameB);
  }
}

function drawRoofDecoration(img: ImageData, yOff: number, topRgb: [number, number, number], leftRgb: [number, number, number]): void {
  // Peaked ridge line across center of top face
  const ridge = adjustRgb(topRgb, 25);
  drawLine(img, OX + 12, yOff + 12, OX + 36, yOff + 12, ridge[0], ridge[1], ridge[2]);

  // Diagonal shingle lines across top face (top-left to bottom-right direction)
  const shingle = adjustRgb(topRgb, -15);
  drawLine(img, OX + 16, yOff + 4, OX + 40, yOff + 16, shingle[0], shingle[1], shingle[2]);
  drawLine(img, OX + 8, yOff + 8, OX + 32, yOff + 20, shingle[0], shingle[1], shingle[2]);
  drawLine(img, OX + 20, yOff + 2, OX + 44, yOff + 14, shingle[0], shingle[1], shingle[2]);

  // Shadow along top edge of left face for depth
  const shadow = adjustRgb(leftRgb, -20);
  drawLine(img, OX + 1, yOff + 13, OX + 23, yOff + 25, shadow[0], shadow[1], shadow[2]);
}

function drawFloorDecoration(img: ImageData, yOff: number, topRgb: [number, number, number]): void {
  // Two subtle 1px cross lines on top face diamond
  const crossColor = adjustRgb(topRgb, -10);
  // Diagonal cross within the diamond
  drawLine(img, OX + 12, yOff + 6, OX + 36, yOff + 18, crossColor[0], crossColor[1], crossColor[2]);
  drawLine(img, OX + 36, yOff + 6, OX + 12, yOff + 18, crossColor[0], crossColor[1], crossColor[2]);
}

function drawPlantDecorations(img: ImageData, yOff: number, topRgb: [number, number, number]): void {
  // Top face: small darker green leaf blobs
  const leafDark = adjustRgb(topRgb, -30);
  const leafLight = adjustRgb(topRgb, 20);

  // Cluster of leaf blobs offset from center on top face
  const cx = OX + 24;
  const cy = yOff + 12;
  // Blob 1 (top-left area)
  setPixel(img, cx - 4, cy - 1, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, cx - 3, cy - 2, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, cx - 3, cy - 1, leafDark[0], leafDark[1], leafDark[2]);
  // Blob 2 (top-right area)
  setPixel(img, cx + 3, cy - 1, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, cx + 4, cy, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, cx + 3, cy, leafDark[0], leafDark[1], leafDark[2]);
  // Blob 3 (bottom area)
  setPixel(img, cx, cy + 3, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, cx + 1, cy + 3, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, cx - 1, cy + 2, leafDark[0], leafDark[1], leafDark[2]);
  // Light highlight spots
  setPixel(img, cx - 2, cy, leafLight[0], leafLight[1], leafLight[2]);
  setPixel(img, cx + 2, cy + 1, leafLight[0], leafLight[1], leafLight[2]);

  // Front faces: small leaf/stem accent details
  const stemColor = adjustRgb(topRgb, -40);
  // Left face: tiny stem
  const lCx = OX + 12;
  const lCy = yOff + 22;
  setPixel(img, lCx, lCy, stemColor[0], stemColor[1], stemColor[2]);
  setPixel(img, lCx, lCy + 1, stemColor[0], stemColor[1], stemColor[2]);
  setPixel(img, lCx - 1, lCy - 1, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, lCx + 1, lCy - 1, leafDark[0], leafDark[1], leafDark[2]);

  // Right face: tiny leaf accent
  const rCx = OX + 36;
  const rCy = yOff + 20;
  setPixel(img, rCx, rCy, stemColor[0], stemColor[1], stemColor[2]);
  setPixel(img, rCx, rCy + 1, stemColor[0], stemColor[1], stemColor[2]);
  setPixel(img, rCx - 1, rCy - 1, leafDark[0], leafDark[1], leafDark[2]);
  setPixel(img, rCx + 1, rCy - 1, leafDark[0], leafDark[1], leafDark[2]);
}

function drawTableDecorations(img: ImageData, yOff: number, topRgb: [number, number, number]): void {
  // Top face: horizontal wood grain lines (slightly darker)
  const grain = adjustRgb(topRgb, -18);
  drawLine(img, OX + 14, yOff + 8, OX + 34, yOff + 8, grain[0], grain[1], grain[2]);
  drawLine(img, OX + 10, yOff + 12, OX + 38, yOff + 12, grain[0], grain[1], grain[2]);
  drawLine(img, OX + 14, yOff + 16, OX + 34, yOff + 16, grain[0], grain[1], grain[2]);

  // Front faces: thin dark vertical leg shapes near edges
  const legColor = adjustRgb(topRgb, -45);
  // Left face legs
  const lBase = yOff + 24;
  // Near-left leg
  setPixel(img, OX + 4, lBase + 2, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 4, lBase + 4, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 4, lBase + 6, legColor[0], legColor[1], legColor[2]);
  // Near-right leg on left face
  setPixel(img, OX + 20, lBase + 2, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 20, lBase + 4, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 20, lBase + 6, legColor[0], legColor[1], legColor[2]);

  // Right face legs
  // Near-left leg on right face
  setPixel(img, OX + 28, lBase + 2, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 28, lBase + 4, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 28, lBase + 6, legColor[0], legColor[1], legColor[2]);
  // Near-right leg on right face
  setPixel(img, OX + 44, lBase + 2, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 44, lBase + 4, legColor[0], legColor[1], legColor[2]);
  setPixel(img, OX + 44, lBase + 6, legColor[0], legColor[1], legColor[2]);
}

// --- Main sprite drawing ---

function drawSpriteToImageData(sprite: SpriteType): ImageData {
  const img = new ImageData(SPRITE_SIZE, SPRITE_SIZE);

  if (sprite === "empty") return img;

  // door_top uses the same base color as door
  const colorKey: BlockType = sprite === "door_top" ? "door" : sprite as BlockType;
  const baseColor = BLOCK_COLORS[colorKey];
  const baseRgb = hexToRgb(baseColor);
  const h = sprite === "floor" ? FLOOR_H : BLOCK_H;

  // yOff positions the block so it sits at the bottom of the sprite
  const yOff = SPRITE_SIZE - TILE_H - h;

  const topRgb = baseRgb;
  const rightRgb = adjustRgb(baseRgb, -12);
  const leftRgb = adjustRgb(baseRgb, -25);

  const top = topFacePoints(yOff);
  const left = leftFacePoints(yOff, h);
  const right = rightFacePoints(yOff, h);

  // Fill faces (back-to-front: left, right, top)
  fillPoly(img, left, leftRgb[0], leftRgb[1], leftRgb[2]);
  fillPoly(img, right, rightRgb[0], rightRgb[1], rightRgb[2]);
  fillPoly(img, top, topRgb[0], topRgb[1], topRgb[2]);

  // Block-specific decorations
  switch (sprite) {
    case "wall":
      drawWallDecorations(img, yOff, h, leftRgb, rightRgb);
      break;
    case "window":
      drawWindowDecorations(img, yOff, h);
      break;
    case "door":
      drawDoorDecoration(img, yOff, h);
      break;
    case "door_top":
      drawDoorTopDecorations(img, yOff, h);
      break;
    case "roof":
      drawRoofDecoration(img, yOff, topRgb, leftRgb);
      break;
    case "floor":
      drawFloorDecoration(img, yOff, topRgb);
      break;
    case "plant":
      drawPlantDecorations(img, yOff, topRgb);
      break;
    case "table":
      drawTableDecorations(img, yOff, topRgb);
      break;
  }

  // Color-matched outlines for seamless pixel-art look
  const outTop = adjustRgb(topRgb, -40);
  const outLeft = adjustRgb(leftRgb, -30);
  const outRight = adjustRgb(rightRgb, -30);
  outlinePoly(img, top, outTop[0], outTop[1], outTop[2]);
  outlinePoly(img, left, outLeft[0], outLeft[1], outLeft[2]);
  outlinePoly(img, right, outRight[0], outRight[1], outRight[2]);

  return img;
}

// --- Atlas generation (singleton) ---

let atlasCanvas: HTMLCanvasElement | null = null;

export function getSpriteAtlas(): HTMLCanvasElement {
  if (atlasCanvas) return atlasCanvas;

  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_TYPES.length * 4 * SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext("2d")!;

  for (let ti = 0; ti < SPRITE_TYPES.length; ti++) {
    const imgData = drawSpriteToImageData(SPRITE_TYPES[ti]);
    for (let ri = 0; ri < 4; ri++) {
      const x = (ti * 4 + ri) * SPRITE_SIZE;
      ctx.putImageData(imgData, x, 0);
    }
  }

  atlasCanvas = canvas;
  return canvas;
}

export function getSpriteRect(sprite: SpriteType, rotation: Rotation): { sx: number; sy: number; sw: number; sh: number } {
  const ti = SPRITE_TYPES.indexOf(sprite);
  return {
    sx: (ti * 4 + rotation) * SPRITE_SIZE,
    sy: 0,
    sw: SPRITE_SIZE,
    sh: SPRITE_SIZE,
  };
}
