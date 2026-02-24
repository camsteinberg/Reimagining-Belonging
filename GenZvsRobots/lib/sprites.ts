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

// --- Inset face helpers for large decorations ---

/** Inset a face parallelogram by `inset` pixels on each side */
function insetFace(pts: [number, number][], inset: number): [number, number][] {
  // Compute centroid
  let cx = 0, cy = 0;
  for (const [px, py] of pts) { cx += px; cy += py; }
  cx /= pts.length; cy /= pts.length;
  // Shrink each point toward centroid
  return pts.map(([px, py]) => {
    const dx = px - cx, dy = py - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.01) return [px, py] as [number, number];
    const scale = Math.max(0, (len - inset) / len);
    return [Math.round(cx + dx * scale), Math.round(cy + dy * scale)] as [number, number];
  });
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
  // Fill BOTH faces almost entirely with bright glass, leaving a thin frame
  const glassR = 0xb0, glassG = 0xdd, glassB = 0xf0;
  const divR = 0x55, divG = 0x80, divB = 0x90;

  // Left face — fill inset glass area
  const leftPts = leftFacePoints(yOff, h);
  const leftGlass = insetFace(leftPts, 3);
  fillPoly(img, leftGlass, glassR, glassG, glassB, 180);
  // Cross dividers — horizontal through middle, vertical through center
  const lCx = Math.round((leftPts[0][0] + leftPts[1][0]) / 2);
  const lMidY = Math.round((leftPts[0][1] + leftPts[3][1]) / 2 + 6);
  // Horizontal divider
  drawLine(img, leftGlass[0][0] + 1, lMidY, leftGlass[1][0] - 1, lMidY, divR, divG, divB);
  // Vertical divider
  const lVx = lCx;
  drawLine(img, lVx, leftGlass[0][1] + 1, lVx, leftGlass[3][1] - 1, divR, divG, divB);

  // Right face — fill inset glass area
  const rightPts = rightFacePoints(yOff, h);
  const rightGlass = insetFace(rightPts, 3);
  fillPoly(img, rightGlass, glassR, glassG, glassB, 180);
  // Cross dividers
  const rCx = Math.round((rightPts[0][0] + rightPts[1][0]) / 2);
  const rMidY = Math.round((rightPts[1][1] + rightPts[2][1]) / 2 + 6);
  drawLine(img, rightGlass[0][0] + 1, rMidY, rightGlass[1][0] - 1, rMidY, divR, divG, divB);
  const rVx = rCx;
  drawLine(img, rVx, rightGlass[0][1] + 1, rVx, rightGlass[3][1] - 1, divR, divG, divB);
}

function drawDoorDecoration(img: ImageData, yOff: number, h: number): void {
  const panelR = 0x5c, panelG = 0x3a, panelB = 0x28;
  const knobR = 0xe0, knobG = 0xc0, knobB = 0x50;

  // Fill BOTH faces with dark door panel, inset by 2px for frame effect
  const leftPts = leftFacePoints(yOff, h);
  const leftPanel = insetFace(leftPts, 2);
  fillPoly(img, leftPanel, panelR, panelG, panelB);

  const rightPts = rightFacePoints(yOff, h);
  const rightPanel = insetFace(rightPts, 2);
  fillPoly(img, rightPanel, panelR, panelG, panelB);

  // Gold handle dots on right face (2x2 near center-right)
  const rCx = Math.round((rightPts[0][0] + rightPts[1][0]) / 2) + 3;
  const rCy = Math.round((rightPts[0][1] + rightPts[3][1]) / 2) + 6;
  setPixel(img, rCx, rCy, knobR, knobG, knobB);
  setPixel(img, rCx, rCy + 1, knobR, knobG, knobB);
  setPixel(img, rCx + 1, rCy, knobR, knobG, knobB);
  setPixel(img, rCx + 1, rCy + 1, knobR, knobG, knobB);

  // Handle on left face too
  const lCx = Math.round((leftPts[0][0] + leftPts[1][0]) / 2) + 3;
  const lCy = Math.round((leftPts[0][1] + leftPts[3][1]) / 2) + 6;
  setPixel(img, lCx, lCy, knobR, knobG, knobB);
  setPixel(img, lCx, lCy + 1, knobR, knobG, knobB);
}

function drawDoorTopDecorations(img: ImageData, yOff: number, h: number): void {
  // Upper half of 2-high door — dark panel with transom glass window
  const panelR = 0x5c, panelG = 0x3a, panelB = 0x28;
  const glassR = 0xb0, glassG = 0xdd, glassB = 0xf0;

  // Fill both faces with dark door panel
  const leftPts = leftFacePoints(yOff, h);
  const leftPanel = insetFace(leftPts, 2);
  fillPoly(img, leftPanel, panelR, panelG, panelB);

  const rightPts = rightFacePoints(yOff, h);
  const rightPanel = insetFace(rightPts, 2);
  fillPoly(img, rightPanel, panelR, panelG, panelB);

  // Transom glass window in upper half of each face
  const leftInner = insetFace(leftPts, 5);
  // Only fill top half for transom
  const leftTransom: [number, number][] = [
    leftInner[0],
    leftInner[1],
    [Math.round((leftInner[1][0] + leftInner[2][0]) / 2), Math.round((leftInner[1][1] + leftInner[2][1]) / 2)],
    [Math.round((leftInner[0][0] + leftInner[3][0]) / 2), Math.round((leftInner[0][1] + leftInner[3][1]) / 2)],
  ];
  fillPoly(img, leftTransom, glassR, glassG, glassB, 180);

  const rightInner = insetFace(rightPts, 5);
  const rightTransom: [number, number][] = [
    rightInner[0],
    rightInner[1],
    [Math.round((rightInner[1][0] + rightInner[2][0]) / 2), Math.round((rightInner[1][1] + rightInner[2][1]) / 2)],
    [Math.round((rightInner[0][0] + rightInner[3][0]) / 2), Math.round((rightInner[0][1] + rightInner[3][1]) / 2)],
  ];
  fillPoly(img, rightTransom, glassR, glassG, glassB, 180);
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
  const leafDark = adjustRgb(topRgb, -35);
  const leafLight = adjustRgb(topRgb, 25);
  const stemColor: [number, number, number] = [0x5a, 0x3e, 0x28];

  // Top face: scattered dark/light leaf blobs covering most of the diamond
  const cx = OX + 24;
  const cy = yOff + 12;
  // Large scattered blobs across the top face
  const leafPositions = [
    [-6, 0], [-4, -2], [-3, -1], [-2, 1], [-1, -3],
    [0, 2], [1, -2], [2, 0], [3, -1], [4, 1],
    [5, 0], [-3, 3], [0, -1], [2, 3], [-1, 2],
  ];
  for (const [dx, dy] of leafPositions) {
    setPixel(img, cx + dx, cy + dy, leafDark[0], leafDark[1], leafDark[2]);
  }
  // Bright highlight spots
  const lightPositions = [[-2, -1], [1, 1], [3, -2], [-4, 1], [0, 3]];
  for (const [dx, dy] of lightPositions) {
    setPixel(img, cx + dx, cy + dy, leafLight[0], leafLight[1], leafLight[2]);
  }

  // Left face: bushy leaf texture + brown stem
  const leftPts = leftFacePoints(yOff, BLOCK_H);
  const lMidX = Math.round((leftPts[0][0] + leftPts[1][0]) / 2);
  const lMidY = Math.round((leftPts[0][1] + leftPts[3][1]) / 2) + 6;
  // Stem
  drawLine(img, lMidX, lMidY - 2, lMidX, lMidY + 6, stemColor[0], stemColor[1], stemColor[2]);
  // Leaf clusters around stem top
  for (const [dx, dy] of [[-2, -2], [-1, -3], [0, -4], [1, -3], [2, -2], [-3, 0], [3, 0]]) {
    setPixel(img, lMidX + dx, lMidY + dy, leafDark[0], leafDark[1], leafDark[2]);
  }

  // Right face: similar bushy texture
  const rightPts = rightFacePoints(yOff, BLOCK_H);
  const rMidX = Math.round((rightPts[0][0] + rightPts[1][0]) / 2);
  const rMidY = Math.round((rightPts[1][1] + rightPts[2][1]) / 2) + 6;
  drawLine(img, rMidX, rMidY - 2, rMidX, rMidY + 6, stemColor[0], stemColor[1], stemColor[2]);
  for (const [dx, dy] of [[-2, -2], [-1, -3], [0, -4], [1, -3], [2, -2], [-3, 0], [3, 0]]) {
    setPixel(img, rMidX + dx, rMidY + dy, leafDark[0], leafDark[1], leafDark[2]);
  }
}

function drawTableDecorations(img: ImageData, yOff: number, topRgb: [number, number, number]): void {
  // Top face: multiple wood grain lines (darker) for visible texture
  const grain = adjustRgb(topRgb, -20);
  const grainLight = adjustRgb(topRgb, 12);
  // Several grain lines across the diamond following isometric angles
  drawLine(img, OX + 14, yOff + 6, OX + 34, yOff + 6, grain[0], grain[1], grain[2]);
  drawLine(img, OX + 10, yOff + 10, OX + 38, yOff + 10, grainLight[0], grainLight[1], grainLight[2]);
  drawLine(img, OX + 12, yOff + 14, OX + 36, yOff + 14, grain[0], grain[1], grain[2]);
  drawLine(img, OX + 14, yOff + 18, OX + 34, yOff + 18, grainLight[0], grainLight[1], grainLight[2]);

  // Both faces: dark legs as thick 2px vertical lines near edges
  const legColor = adjustRgb(topRgb, -55);

  // Left face legs — 2px wide, full height of face
  const leftPts = leftFacePoints(yOff, BLOCK_H);
  // Left leg near left edge
  for (let dy = 2; dy < BLOCK_H - 1; dy++) {
    const t = dy / BLOCK_H;
    const lx = Math.round(leftPts[0][0] + 3 + t * 0);
    setPixel(img, lx, leftPts[0][1] + dy, legColor[0], legColor[1], legColor[2]);
    setPixel(img, lx + 1, leftPts[0][1] + dy, legColor[0], legColor[1], legColor[2]);
  }
  // Right leg near right edge of left face
  for (let dy = 2; dy < BLOCK_H - 1; dy++) {
    const lx = Math.round(leftPts[1][0] - 4);
    setPixel(img, lx, leftPts[1][1] + dy, legColor[0], legColor[1], legColor[2]);
    setPixel(img, lx + 1, leftPts[1][1] + dy, legColor[0], legColor[1], legColor[2]);
  }

  // Right face legs
  const rightPts = rightFacePoints(yOff, BLOCK_H);
  // Left leg near left edge of right face
  for (let dy = 2; dy < BLOCK_H - 1; dy++) {
    const rx = Math.round(rightPts[0][0] + 3);
    setPixel(img, rx, rightPts[0][1] + dy, legColor[0], legColor[1], legColor[2]);
    setPixel(img, rx + 1, rightPts[0][1] + dy, legColor[0], legColor[1], legColor[2]);
  }
  // Right leg near right edge of right face
  for (let dy = 2; dy < BLOCK_H - 1; dy++) {
    const rx = Math.round(rightPts[1][0] - 4);
    setPixel(img, rx, rightPts[1][1] + dy, legColor[0], legColor[1], legColor[2]);
    setPixel(img, rx + 1, rightPts[1][1] + dy, legColor[0], legColor[1], legColor[2]);
  }
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
