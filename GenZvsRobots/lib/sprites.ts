import type { BlockType } from "./types";
import { BLOCK_COLORS } from "./constants";

export const TILE_W = 48;
export const TILE_H = 24;
export const BLOCK_H = 20;
export const FLOOR_H = 4;
export const SPRITE_SIZE = 64;

type Rotation = 0 | 1 | 2 | 3;

// Sprite types include all block types plus the non-user-placeable door_top variant
export const SPRITE_TYPES = ["wall", "floor", "roof", "window", "door", "door_top", "plant", "table", "metal", "concrete", "barrel", "pipe", "air", "empty"] as const;
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

function drawMetalDecorations(img: ImageData, yOff: number, h: number, leftRgb: [number, number, number], rightRgb: [number, number, number]): void {
  // Horizontal rivet lines at 1/3 and 2/3 height on both faces
  const rivetLineLeft = adjustRgb(leftRgb, -20);
  const rivetLineRight = adjustRgb(rightRgb, -20);
  const rivetDotLeft = adjustRgb(leftRgb, 40);
  const rivetDotRight = adjustRgb(rightRgb, 40);

  const thirds = [Math.round(h / 3), Math.round((h * 2) / 3)];

  // Left face rivet lines + dots
  for (const dy of thirds) {
    const y1 = Math.round(yOff + 12 + dy);
    const y2 = yOff + 24 + dy;
    drawLine(img, OX + 1, y1, OX + 23, y2, rivetLineLeft[0], rivetLineLeft[1], rivetLineLeft[2]);
    // Rivet dots every 6px along the line
    for (let t = 0; t <= 1; t += 0.25) {
      const rx = Math.round(OX + 1 + t * 22);
      const ry = Math.round(y1 + t * (y2 - y1));
      setPixel(img, rx, ry, rivetDotLeft[0], rivetDotLeft[1], rivetDotLeft[2]);
    }
  }

  // Right face rivet lines + dots
  for (const dy of thirds) {
    const y1 = yOff + 24 + dy;
    const y2 = Math.round(yOff + 12 + dy);
    drawLine(img, OX + 25, y1, OX + 47, y2, rivetLineRight[0], rivetLineRight[1], rivetLineRight[2]);
    // Rivet dots every 6px along the line
    for (let t = 0; t <= 1; t += 0.25) {
      const rx = Math.round(OX + 25 + t * 22);
      const ry = Math.round(y1 + t * (y2 - y1));
      setPixel(img, rx, ry, rivetDotRight[0], rivetDotRight[1], rivetDotRight[2]);
    }
  }
}

function drawConcreteDecorations(img: ImageData, yOff: number, h: number, topRgb: [number, number, number], leftRgb: [number, number, number], rightRgb: [number, number, number]): void {
  // Subtle speckle texture on all faces
  const speckleTop = adjustRgb(topRgb, -18);
  const speckleLeft = adjustRgb(leftRgb, -18);
  const speckleRight = adjustRgb(rightRgb, -18);

  // Top face speckles — scattered darker pixels across diamond
  const cx = OX + 24;
  const cy = yOff + 12;
  const topSpeckles = [
    [-5, 1], [-3, -2], [-1, 3], [1, -1], [3, 2],
    [5, -1], [-4, -1], [0, 0], [4, -3], [-2, 4],
    [6, 1], [-6, 0], [2, -4], [-1, -2], [3, 4],
  ];
  for (const [dx, dy] of topSpeckles) {
    setPixel(img, cx + dx, cy + dy, speckleTop[0], speckleTop[1], speckleTop[2]);
  }

  // Left face speckles
  const leftPts = leftFacePoints(yOff, h);
  const lCx = Math.round((leftPts[0][0] + leftPts[1][0]) / 2);
  const lCy = Math.round((leftPts[0][1] + leftPts[3][1]) / 2) + 6;
  for (const [dx, dy] of [[-3, -2], [2, 1], [-1, 3], [4, -1], [0, -3], [-2, 4], [3, 2], [-4, 0]]) {
    setPixel(img, lCx + dx, lCy + dy, speckleLeft[0], speckleLeft[1], speckleLeft[2]);
  }

  // Right face speckles
  const rightPts = rightFacePoints(yOff, h);
  const rCx = Math.round((rightPts[0][0] + rightPts[1][0]) / 2);
  const rCy = Math.round((rightPts[1][1] + rightPts[2][1]) / 2) + 6;
  for (const [dx, dy] of [[-3, -1], [2, 2], [-1, -3], [4, 0], [0, 3], [-2, -2], [3, -1], [-4, 1]]) {
    setPixel(img, rCx + dx, rCy + dy, speckleRight[0], speckleRight[1], speckleRight[2]);
  }

  // Thin horizontal form-work lines at 1/3 and 2/3 height on side faces
  const formLeft = adjustRgb(leftRgb, -12);
  const formRight = adjustRgb(rightRgb, -12);
  const thirds = [Math.round(h / 3), Math.round((h * 2) / 3)];

  for (const dy of thirds) {
    drawLine(img, OX + 1, Math.round(yOff + 12 + dy), OX + 23, yOff + 24 + dy, formLeft[0], formLeft[1], formLeft[2]);
    drawLine(img, OX + 25, yOff + 24 + dy, OX + 47, Math.round(yOff + 12 + dy), formRight[0], formRight[1], formRight[2]);
  }
}

function drawBarrelDecorations(img: ImageData, yOff: number, h: number, topRgb: [number, number, number], leftRgb: [number, number, number], rightRgb: [number, number, number]): void {
  // Dark horizontal bands (hoops) near top and bottom of each face
  const hoopLeft = adjustRgb(leftRgb, -35);
  const hoopRight = adjustRgb(rightRgb, -35);

  const hoopOffsets = [3, h - 3]; // near top and bottom

  // Left face hoops
  for (const dy of hoopOffsets) {
    const y1 = Math.round(yOff + 12 + dy);
    const y2 = yOff + 24 + dy;
    drawLine(img, OX + 1, y1, OX + 23, y2, hoopLeft[0], hoopLeft[1], hoopLeft[2]);
    drawLine(img, OX + 1, y1 + 1, OX + 23, y2 + 1, hoopLeft[0], hoopLeft[1], hoopLeft[2]);
  }

  // Right face hoops
  for (const dy of hoopOffsets) {
    const y1 = yOff + 24 + dy;
    const y2 = Math.round(yOff + 12 + dy);
    drawLine(img, OX + 25, y1, OX + 47, y2, hoopRight[0], hoopRight[1], hoopRight[2]);
    drawLine(img, OX + 25, y1 + 1, OX + 47, y2 + 1, hoopRight[0], hoopRight[1], hoopRight[2]);
  }

  // Vertical wood grain lines between hoops on left face
  const grainLeft = adjustRgb(leftRgb, -10);
  for (let dx = 4; dx < 22; dx += 5) {
    const x = OX + dx;
    const topY = Math.round(yOff + 12 + (dx / 24) * 12) + 4;
    const botY = topY + h - 8;
    drawLine(img, x, topY, x, botY, grainLeft[0], grainLeft[1], grainLeft[2]);
  }

  // Vertical wood grain lines on right face
  const grainRight = adjustRgb(rightRgb, -10);
  for (let dx = 4; dx < 22; dx += 5) {
    const x = OX + 24 + dx;
    const topY = Math.round(yOff + 24 - (dx / 24) * 12) + 4;
    const botY = topY + h - 8;
    drawLine(img, x, topY, x, botY, grainRight[0], grainRight[1], grainRight[2]);
  }

  // Top face: darker inner circle/ellipse
  const topDark = adjustRgb(topRgb, -30);
  const tcx = OX + 24;
  const tcy = yOff + 12;
  // Draw a small elliptical ring on the top face diamond
  for (let angle = 0; angle < 360; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    const ex = Math.round(tcx + Math.cos(rad) * 6);
    const ey = Math.round(tcy + Math.sin(rad) * 3);
    setPixel(img, ex, ey, topDark[0], topDark[1], topDark[2]);
  }
}

function drawPipeDecorations(img: ImageData, yOff: number, h: number, topRgb: [number, number, number], leftRgb: [number, number, number], rightRgb: [number, number, number]): void {
  // Right face: bright vertical highlight stripe in center for cylindrical look
  const highlightRight = adjustRgb(rightRgb, 35);
  const rightPts = rightFacePoints(yOff, h);
  const rCx = Math.round((rightPts[0][0] + rightPts[1][0]) / 2);
  for (let dy = 2; dy < h - 1; dy++) {
    const baseY = Math.round(rightPts[0][1] + dy);
    setPixel(img, rCx, baseY, highlightRight[0], highlightRight[1], highlightRight[2]);
    setPixel(img, rCx + 1, baseY, highlightRight[0], highlightRight[1], highlightRight[2]);
  }

  // Left face: dark edges for shadow/depth
  const darkLeft = adjustRgb(leftRgb, -30);
  const leftPts = leftFacePoints(yOff, h);
  // Dark edge on left side of left face
  for (let dy = 2; dy < h - 1; dy++) {
    setPixel(img, leftPts[0][0] + 1, Math.round(leftPts[0][1] + dy), darkLeft[0], darkLeft[1], darkLeft[2]);
    setPixel(img, leftPts[0][0] + 2, Math.round(leftPts[0][1] + dy), darkLeft[0], darkLeft[1], darkLeft[2]);
  }
  // Dark edge on right side of left face
  for (let dy = 2; dy < h - 1; dy++) {
    setPixel(img, leftPts[1][0] - 1, Math.round(leftPts[1][1] + dy), darkLeft[0], darkLeft[1], darkLeft[2]);
    setPixel(img, leftPts[1][0] - 2, Math.round(leftPts[1][1] + dy), darkLeft[0], darkLeft[1], darkLeft[2]);
  }

  // Top face: dark ring for opening
  const topDark = adjustRgb(topRgb, -40);
  const topInner = adjustRgb(topRgb, -55);
  const tcx = OX + 24;
  const tcy = yOff + 12;
  // Outer ring
  for (let angle = 0; angle < 360; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const ex = Math.round(tcx + Math.cos(rad) * 7);
    const ey = Math.round(tcy + Math.sin(rad) * 3.5);
    setPixel(img, ex, ey, topDark[0], topDark[1], topDark[2]);
  }
  // Inner dark fill for pipe opening
  for (let angle = 0; angle < 360; angle += 12) {
    const rad = (angle * Math.PI) / 180;
    const ex = Math.round(tcx + Math.cos(rad) * 4);
    const ey = Math.round(tcy + Math.sin(rad) * 2);
    setPixel(img, ex, ey, topInner[0], topInner[1], topInner[2]);
  }
  // Center fill
  setPixel(img, tcx, tcy, topInner[0], topInner[1], topInner[2]);
  setPixel(img, tcx - 1, tcy, topInner[0], topInner[1], topInner[2]);
  setPixel(img, tcx + 1, tcy, topInner[0], topInner[1], topInner[2]);
  setPixel(img, tcx, tcy - 1, topInner[0], topInner[1], topInner[2]);
  setPixel(img, tcx, tcy + 1, topInner[0], topInner[1], topInner[2]);
}

// --- Main sprite drawing ---

function drawSpriteToImageData(sprite: SpriteType): ImageData {
  const img = new ImageData(SPRITE_SIZE, SPRITE_SIZE);

  if (sprite === "empty" || sprite === "air") return img;

  // door_top uses the same base color as door
  const colorKey: BlockType = sprite === "door_top" ? "door" : sprite as BlockType;
  const baseColor = BLOCK_COLORS[colorKey];
  const baseRgb = hexToRgb(baseColor);
  const h = sprite === "floor" ? FLOOR_H : BLOCK_H;

  // yOff positions the block so it sits at the bottom of the sprite
  const yOff = SPRITE_SIZE - TILE_H - h;

  // Custom per-face colors for new industrial blocks; others use standard shading
  const customColors: Record<string, { top: [number, number, number]; left: [number, number, number]; right: [number, number, number] }> = {
    metal:    { top: [138, 155, 174], left: [108, 125, 144], right: [123, 140, 159] },
    concrete: { top: [160, 160, 160], left: [130, 130, 130], right: [145, 145, 145] },
    barrel:   { top: [176, 120, 64],  left: [146, 90, 34],   right: [161, 105, 49] },
    pipe:     { top: [110, 123, 138], left: [80, 93, 108],    right: [95, 108, 123] },
  };

  const custom = customColors[sprite];
  const topRgb: [number, number, number] = custom ? custom.top : baseRgb;
  const rightRgb: [number, number, number] = custom ? custom.right : adjustRgb(baseRgb, -12);
  const leftRgb: [number, number, number] = custom ? custom.left : adjustRgb(baseRgb, -25);

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
    case "metal":
      drawMetalDecorations(img, yOff, h, leftRgb, rightRgb);
      break;
    case "concrete":
      drawConcreteDecorations(img, yOff, h, topRgb, leftRgb, rightRgb);
      break;
    case "barrel":
      drawBarrelDecorations(img, yOff, h, topRgb, leftRgb, rightRgb);
      break;
    case "pipe":
      drawPipeDecorations(img, yOff, h, topRgb, leftRgb, rightRgb);
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
