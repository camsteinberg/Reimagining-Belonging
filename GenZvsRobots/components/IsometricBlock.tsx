"use client";

import { motion } from "framer-motion";
import type { BlockType } from "@/lib/types";
import { BLOCK_COLORS } from "@/lib/constants";
import { TILE_WIDTH, TILE_HEIGHT, BLOCK_HEIGHT } from "@/lib/isometric";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a hex color string (#rrggbb) into [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/** Clamp a number to [0, 255] */
function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

/** Return a hex color adjusted by `amount` brightness (positive = lighter, negative = darker) */
function adjustBrightness(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const toHex = (n: number) => clamp(n + amount).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// Polygon vertex helpers
// All coordinates are relative to the tile origin (top-center of the tile).
// Origin is the point where the top face's "peak" (leftmost point) sits.
// ---------------------------------------------------------------------------

const hw = TILE_WIDTH / 2;  // half tile width  = 24
const hh = TILE_HEIGHT / 2; // half tile height = 12

/**
 * Returns the 4 vertices of the isometric top face (diamond shape).
 * The top face is centred at (0, 0) in local space.
 *
 *      (0, 0)  ← left point
 *   (hw, hh)   ← bottom point
 *   (0, TILE_HEIGHT) ← right point  (= 2*hh)
 *   (-hw, hh)  ← top point
 *
 * In standard isometric screen space:
 *   left   = (0,   0)
 *   front  = (hw,  hh)
 *   right  = (0,   TILE_HEIGHT)
 *   back   = (-hw, hh)
 */
function topFacePoints(blockH: number): string {
  // Raised by blockH so the top face sits on top of the block
  const y = -blockH;
  return [
    `${0},${y}`,
    `${hw},${hh + y}`,
    `${0},${TILE_HEIGHT + y}`,
    `${-hw},${hh + y}`,
  ].join(" ");
}

/**
 * Left face (visible left side of the block).
 * Runs from the left edge down to the ground.
 */
function leftFacePoints(blockH: number): string {
  return [
    `${0},${0}`,           // top-left of left face  (ground level left)
    `${-hw},${hh}`,        // top-right of left face (ground level back)
    `${-hw},${hh + blockH}`, // bottom-right
    `${0},${blockH}`,      // bottom-left
  ].join(" ");
}

/**
 * Right face (visible right side of the block).
 */
function rightFacePoints(blockH: number): string {
  return [
    `${0},${0}`,           // top-right of right face (ground level left)
    `${hw},${hh}`,         // top-left of right face  (ground level front)
    `${hw},${hh + blockH}`, // bottom-left
    `${0},${blockH}`,      // bottom-right
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IsometricBlockProps {
  block: BlockType;
  isNew?: boolean;
  isAIPlaced?: boolean;
  isCorrect?: boolean | null; // null = not scored, true = correct, false = wrong
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IsometricBlock({
  block,
  isNew = false,
  isAIPlaced = false,
  isCorrect = null,
}: IsometricBlockProps) {
  if (block === "empty") return null;

  const baseColor = BLOCK_COLORS[block];

  // Floor blocks are nearly flat — use a minimal height
  const blockH = block === "floor" ? 4 : BLOCK_HEIGHT;

  const topColor = baseColor;
  const leftColor = adjustBrightness(baseColor, -30);
  const rightColor = adjustBrightness(baseColor, -15);

  // Scoring overlay colors
  const scoringOverlayColor =
    isCorrect === true
      ? "rgba(74, 222, 128, 0.45)"   // green-400 at 45%
      : isCorrect === false
      ? "rgba(248, 113, 113, 0.45)"  // red-400 at 45%
      : null;

  // AI placed: pulsing sage overlay
  const aiOverlayColor = isAIPlaced ? "rgba(140, 163, 140, 0.55)" : null;

  // Spring animation for newly placed blocks (drop from above)
  const motionProps = isNew
    ? {
        initial: { y: -40, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 18,
          mass: 0.8,
        },
      }
    : {};

  return (
    <motion.g {...motionProps}>
      {/* Left face */}
      <polygon
        points={leftFacePoints(blockH)}
        fill={leftColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={0.5}
      />

      {/* Right face */}
      <polygon
        points={rightFacePoints(blockH)}
        fill={rightColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={0.5}
      />

      {/* Top face */}
      <polygon
        points={topFacePoints(blockH)}
        fill={topColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={0.5}
      />

      {/* Window decoration: light-blue diamond on top face */}
      {block === "window" && (
        <polygon
          points={topFacePoints(blockH)
            .split(" ")
            .map((pt) => {
              const [px, py] = pt.split(",").map(Number);
              // Scale in towards centre by 35%
              return `${px * 0.55},${(py + blockH) * 0.55 - blockH}`;
            })
            .join(" ")}
          fill="#a8d8ea"
          opacity={0.85}
        />
      )}

      {/* Door decoration: dark rectangle on the right (front) face */}
      {block === "door" && (
        <rect
          x={4}
          y={hh + 2}
          width={hw - 8}
          height={blockH - 6}
          fill="#3d2b1f"
          opacity={0.75}
        />
      )}

      {/* Scoring overlay on top face */}
      {scoringOverlayColor && (
        <polygon
          points={topFacePoints(blockH)}
          fill={scoringOverlayColor}
          stroke="none"
        />
      )}

      {/* AI placed pulsing overlay */}
      {aiOverlayColor && (
        <motion.polygon
          points={topFacePoints(blockH)}
          fill={aiOverlayColor}
          stroke="none"
          animate={{ opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.g>
  );
}
