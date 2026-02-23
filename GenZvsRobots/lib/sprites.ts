import type { BlockType } from "./types";
import { BLOCK_COLORS } from "./constants";

export const TILE_W = 48;
export const TILE_H = 24;
export const BLOCK_H = 20;
export const FLOOR_H = 4;
export const SPRITE_SIZE = 64;

type Rotation = 0 | 1 | 2 | 3;

const BLOCK_TYPES: BlockType[] = ["wall", "floor", "roof", "window", "door", "empty"];

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
function fillPoly(img: ImageData, points: [number, number][], r: number, g: number, b: number): void {
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
    intersections.sort((a, b) => a - b);
    for (let k = 0; k < intersections.length - 1; k += 2) {
      for (let x = intersections[k]; x <= intersections[k + 1]; x++) {
        setPixel(img, x, y, r, g, b);
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
    // Left face spans from (OX, yOff+12+dy) to (OX+24, yOff+24+dy)
    // Interpolate across the face at this height
    const t = dy / h;
    const leftX0 = OX;
    const leftX1 = OX + 24;
    const leftY = Math.round(yOff + 12 + dy + t * 0); // horizontal line at fixed y
    // Draw a line across the left face at this scanline
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

  // Window on left face: 3x4 rectangle centered
  const lCx = OX + 12;
  const lCy = yOff + 18 + Math.floor(h / 2);
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      setPixel(img, lCx - 1 + dx, lCy - 2 + dy, glassR, glassG, glassB);
    }
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

  // Window on right face: 3x4 rectangle centered
  const rCx = OX + 36;
  const rCy = yOff + 18 + Math.floor(h / 2);
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      setPixel(img, rCx - 1 + dx, rCy - 2 + dy, glassR, glassG, glassB);
    }
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

  // Door on right face: 3x5 rectangle near bottom
  const dCx = OX + 36;
  const dCy = yOff + 24 + h - 7;
  for (let dy = 0; dy < 5; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      setPixel(img, dCx - 1 + dx, dCy + dy, doorR, doorG, doorB);
    }
  }
  // 1px gold knob pixel
  setPixel(img, dCx + 1, dCy + 2, knobR, knobG, knobB);
}

function drawRoofDecoration(img: ImageData, yOff: number, topRgb: [number, number, number]): void {
  // 1px lighter ridge line across top face center
  const ridge = adjustRgb(topRgb, 20);
  // Ridge runs from center-left to center-right of diamond
  drawLine(img, OX + 12, yOff + 12, OX + 36, yOff + 12, ridge[0], ridge[1], ridge[2]);
}

function drawFloorDecoration(img: ImageData, yOff: number, topRgb: [number, number, number]): void {
  // Two subtle 1px cross lines on top face diamond
  const crossColor = adjustRgb(topRgb, -10);
  // Diagonal cross within the diamond
  drawLine(img, OX + 12, yOff + 6, OX + 36, yOff + 18, crossColor[0], crossColor[1], crossColor[2]);
  drawLine(img, OX + 36, yOff + 6, OX + 12, yOff + 18, crossColor[0], crossColor[1], crossColor[2]);
}

// --- Main sprite drawing ---

function drawBlockToImageData(block: BlockType): ImageData {
  const img = new ImageData(SPRITE_SIZE, SPRITE_SIZE);

  if (block === "empty") return img;

  const baseColor = BLOCK_COLORS[block];
  const baseRgb = hexToRgb(baseColor);
  const h = block === "floor" ? FLOOR_H : BLOCK_H;

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
  switch (block) {
    case "wall":
      drawWallDecorations(img, yOff, h, leftRgb, rightRgb);
      break;
    case "window":
      drawWindowDecorations(img, yOff, h);
      break;
    case "door":
      drawDoorDecoration(img, yOff, h);
      break;
    case "roof":
      drawRoofDecoration(img, yOff, topRgb);
      break;
    case "floor":
      drawFloorDecoration(img, yOff, topRgb);
      break;
  }

  // 1px black outlines on all block edges
  outlinePoly(img, top, 0, 0, 0);
  outlinePoly(img, left, 0, 0, 0);
  outlinePoly(img, right, 0, 0, 0);

  return img;
}

// --- Atlas generation (singleton) ---

let atlasCanvas: HTMLCanvasElement | null = null;

export function getSpriteAtlas(): HTMLCanvasElement {
  if (atlasCanvas) return atlasCanvas;

  // 6 types x 4 rotations = 24 sprites, each SPRITE_SIZE x SPRITE_SIZE
  const canvas = document.createElement("canvas");
  canvas.width = BLOCK_TYPES.length * 4 * SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext("2d")!;

  for (let ti = 0; ti < BLOCK_TYPES.length; ti++) {
    const imgData = drawBlockToImageData(BLOCK_TYPES[ti]);
    for (let ri = 0; ri < 4; ri++) {
      const x = (ti * 4 + ri) * SPRITE_SIZE;
      ctx.putImageData(imgData, x, 0);
    }
  }

  atlasCanvas = canvas;
  return canvas;
}

export function getSpriteRect(block: BlockType, rotation: Rotation): { sx: number; sy: number; sw: number; sh: number } {
  const ti = BLOCK_TYPES.indexOf(block);
  return {
    sx: (ti * 4 + rotation) * SPRITE_SIZE,
    sy: 0,
    sw: SPRITE_SIZE,
    sh: SPRITE_SIZE,
  };
}
