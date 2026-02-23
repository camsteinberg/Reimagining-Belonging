import type { BlockType } from "./types";
import { BLOCK_COLORS } from "./constants";

const TILE_W = 48;
const TILE_H = 24;
const BLOCK_H = 20;
const FLOOR_H = 4;
const SPRITE_SIZE = 48;

type Rotation = 0 | 1 | 2 | 3;

const BLOCK_TYPES: BlockType[] = ["wall", "floor", "roof", "window", "door", "empty"];

// --- Color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`;
}

function adjustBrightness(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

// --- Isometric face geometry for a given block height ---

function topFace(h: number): [number, number][] {
  return [
    [TILE_W / 2, 0],
    [TILE_W, TILE_H / 2],
    [TILE_W / 2, TILE_H],
    [0, TILE_H / 2],
  ];
}

function leftFace(h: number): [number, number][] {
  return [
    [0, TILE_H / 2],
    [TILE_W / 2, TILE_H],
    [TILE_W / 2, TILE_H + h],
    [0, TILE_H / 2 + h],
  ];
}

function rightFace(h: number): [number, number][] {
  return [
    [TILE_W / 2, TILE_H],
    [TILE_W, TILE_H / 2],
    [TILE_W, TILE_H / 2 + h],
    [TILE_W / 2, TILE_H + h],
  ];
}

function drawPoly(ctx: CanvasRenderingContext2D, pts: [number, number][], fill: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// 2x2 checkerboard dithering
function dither(ctx: CanvasRenderingContext2D, pts: [number, number][], baseColor: string, variation: number) {
  const [r, g, b] = hexToRgb(baseColor);
  // Draw base
  drawPoly(ctx, pts, baseColor);
  // Overlay dither dots
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();

  const lighter = rgbToHex(r + variation, g + variation, b + variation);
  ctx.fillStyle = lighter;
  // Get bounding box
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.floor(Math.min(...xs));
  const maxX = Math.ceil(Math.max(...xs));
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));

  for (let y = minY; y <= maxY; y += 4) {
    for (let x = minX; x <= maxX; x += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  ctx.restore();
}

// --- Block-specific decorations ---

function drawBrickPattern(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = adjustBrightness(color, -20);
  ctx.lineWidth = 1;
  const ys = pts.map(p => p[1]);
  const xs = pts.map(p => p[0]);
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  const minX = Math.floor(Math.min(...xs));
  const maxX = Math.ceil(Math.max(...xs));

  for (let y = minY; y <= maxY; y += 4) {
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWindowInset(ctx: CanvasRenderingContext2D, facePts: [number, number][]) {
  // Draw a glass panel inset on the face
  const cx = facePts.reduce((s, p) => s + p[0], 0) / facePts.length;
  const cy = facePts.reduce((s, p) => s + p[1], 0) / facePts.length;
  const scale = 0.5;

  const inset = facePts.map(p => [
    cx + (p[0] - cx) * scale,
    cy + (p[1] - cy) * scale,
  ] as [number, number]);

  ctx.beginPath();
  ctx.moveTo(inset[0][0], inset[0][1]);
  for (let i = 1; i < inset.length; i++) ctx.lineTo(inset[i][0], inset[i][1]);
  ctx.closePath();
  ctx.fillStyle = "#a8d8ea";
  ctx.fill();
  ctx.strokeStyle = "#5a4a3a";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawDoorPanel(ctx: CanvasRenderingContext2D, facePts: [number, number][]) {
  const cx = facePts.reduce((s, p) => s + p[0], 0) / facePts.length;
  const cy = facePts.reduce((s, p) => s + p[1], 0) / facePts.length;

  const inset = facePts.map(p => [
    cx + (p[0] - cx) * 0.55,
    cy + (p[1] - cy) * 0.65,
  ] as [number, number]);

  ctx.beginPath();
  ctx.moveTo(inset[0][0], inset[0][1]);
  for (let i = 1; i < inset.length; i++) ctx.lineTo(inset[i][0], inset[i][1]);
  ctx.closePath();
  ctx.fillStyle = "#3d2b1f";
  ctx.fill();
  ctx.strokeStyle = "#2a1a10";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Door knob
  ctx.beginPath();
  ctx.arc(cx + 3, cy, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#c0a050";
  ctx.fill();
}

function drawRoofTexture(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();

  // Angled shingle lines
  ctx.strokeStyle = adjustBrightness(color, -15);
  ctx.lineWidth = 1;
  const ys = pts.map(p => p[1]);
  const xs = pts.map(p => p[0]);
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  const minX = Math.floor(Math.min(...xs));
  const maxX = Math.ceil(Math.max(...xs));

  for (let y = minY; y <= maxY; y += 3) {
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloorGrid(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 0.5;
  // Diamond grid lines
  const cx = TILE_W / 2;
  const cy = TILE_H / 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 6, 0);
    ctx.lineTo(cx + i * 6, TILE_H);
    ctx.stroke();
  }
  ctx.restore();
}

// --- Sprite rendering ---

function drawBlock(
  ctx: CanvasRenderingContext2D,
  block: BlockType,
  _rotation: Rotation,
) {
  if (block === "empty") return;

  const baseColor = BLOCK_COLORS[block];
  const h = block === "floor" ? FLOOR_H : BLOCK_H;
  const topColor = baseColor;
  const leftColor = adjustBrightness(baseColor, -25);
  const rightColor = adjustBrightness(baseColor, -12);

  const top = topFace(h);
  const left = leftFace(h);
  const right = rightFace(h);

  // Offset so block sits within sprite with top face visible
  const yOff = SPRITE_SIZE - TILE_H - h;
  ctx.save();
  ctx.translate(0, yOff);

  // Draw faces with dithering
  dither(ctx, left, leftColor, 8);
  dither(ctx, right, rightColor, 8);
  dither(ctx, top, topColor, 10);

  // Block-specific decorations
  switch (block) {
    case "wall":
      drawBrickPattern(ctx, left, leftColor);
      drawBrickPattern(ctx, right, rightColor);
      break;
    case "window":
      drawWindowInset(ctx, right);
      drawWindowInset(ctx, left);
      break;
    case "door":
      drawDoorPanel(ctx, right);
      break;
    case "roof":
      drawRoofTexture(ctx, top, topColor);
      break;
    case "floor":
      drawFloorGrid(ctx, top);
      break;
  }

  ctx.restore();
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
    for (let ri = 0; ri < 4; ri++) {
      const x = (ti * 4 + ri) * SPRITE_SIZE;
      ctx.save();
      ctx.translate(x, 0);
      drawBlock(ctx, BLOCK_TYPES[ti], ri as Rotation);
      ctx.restore();
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

export { SPRITE_SIZE, TILE_W, TILE_H, BLOCK_H, FLOOR_H };
