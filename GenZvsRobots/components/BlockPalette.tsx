"use client";

import { motion } from "framer-motion";
import type { BlockType } from "@/lib/types";
import { BLOCK_COLORS, BLOCK_LABELS } from "@/lib/constants";

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Adjust the brightness of a hex color by `amount` (positive = lighter,
 * negative = darker).  Falls back to the original string for non-hex values
 * (e.g. "transparent").
 */
function adjustBrightness(hex: string, amount: number): string {
  if (!hex.startsWith("#")) return hex;

  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const r = Math.min(255, Math.max(0, parseInt(full.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(full.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(full.slice(4, 6), 16) + amount));

  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ─── mini isometric block SVG ───────────────────────────────────────────────

interface MiniBlockProps {
  color: string;
}

function MiniBlock({ color }: MiniBlockProps) {
  // Three faces of an isometric cube rendered in a 28×28 viewport.
  //
  // The diamond sits centred with:
  //   top-centre  = (14, 4)
  //   left        = (2, 11)
  //   right       = (26, 11)
  //   bottom      = (14, 18)
  //
  // Left face  (top-centre → left  → bottom-left → mid-left)
  // Right face (top-centre → right → bottom-right → mid-right)
  // Top face   (top-centre → left  → bottom → right)  ← actually the top diamond

  const top = adjustBrightness(color, 0);
  const left = adjustBrightness(color, -40);
  const right = adjustBrightness(color, -20);

  // isometric points
  const cx = 14; // horizontal centre
  const ty = 4; // top vertex y
  const lx = 2,
    ly = 11; // left vertex
  const rx = 26,
    ry = 11; // right vertex
  const my = 18; // middle-row y (left/right bottom edges meet the bottom face)
  const by = 24; // bottom vertex y

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="block"
    >
      {/* Top face – diamond: top → left → bottom-mid → right */}
      <polygon
        points={`${cx},${ty} ${lx},${ly} ${cx},${my} ${rx},${ry}`}
        fill={top}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.5"
      />
      {/* Left face – parallelogram: left → bottom-mid → bottom → ??? */}
      <polygon
        points={`${lx},${ly} ${cx},${my} ${cx},${by} ${lx},${by - (my - ly)}`}
        fill={left}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.5"
      />
      {/* Right face – parallelogram */}
      <polygon
        points={`${rx},${ry} ${cx},${my} ${cx},${by} ${rx},${by - (my - ry)}`}
        fill={right}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

// ─── eraser icon ─────────────────────────────────────────────────────────────

function EraserIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="block"
    >
      {/* Background circle */}
      <circle cx="14" cy="14" r="12" fill="rgba(255,255,255,0.15)" />
      {/* X mark */}
      <line
        x1="8"
        y1="8"
        x2="20"
        y2="20"
        stroke="#e8e0d0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="8"
        x2="8"
        y2="20"
        stroke="#e8e0d0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── block order ────────────────────────────────────────────────────────────

const BLOCK_ORDER: BlockType[] = ["wall", "floor", "roof", "window", "door", "empty"];

// ─── main component ──────────────────────────────────────────────────────────

interface BlockPaletteProps {
  selected: BlockType;
  onSelect: (block: BlockType) => void;
}

export default function BlockPalette({ selected, onSelect }: BlockPaletteProps) {
  return (
    <div
      className="bg-[#4a3728]/90 rounded-xl backdrop-blur-sm px-3 py-2"
      role="toolbar"
      aria-label="Block palette"
    >
      <div className="flex flex-row gap-1 items-center justify-center">
        {BLOCK_ORDER.map((blockType) => {
          const isSelected = selected === blockType;
          const label = BLOCK_LABELS[blockType];
          const color = BLOCK_COLORS[blockType];

          return (
            <motion.button
              key={blockType}
              onClick={() => onSelect(blockType)}
              whileTap={{ scale: 0.9 }}
              aria-label={`Select ${label} block`}
              aria-pressed={isSelected}
              className={[
                "flex flex-col items-center justify-center gap-0.5",
                "rounded-lg px-2 py-1.5 min-w-[48px] min-h-[48px]",
                "transition-colors duration-150",
                isSelected
                  ? "bg-[#b89f65]/25 ring-2 ring-[#b89f65]"
                  : "bg-transparent hover:bg-white/10",
              ].join(" ")}
            >
              {/* Block preview */}
              <div className="w-7 h-7 flex items-center justify-center">
                {blockType === "empty" ? (
                  <EraserIcon />
                ) : (
                  <MiniBlock color={color} />
                )}
              </div>

              {/* Text label */}
              <span
                className={[
                  "font-[family-name:var(--font-pixel)] text-[7px] leading-tight",
                  "select-none",
                  isSelected ? "text-[#b89f65]" : "text-[#e8e0d0]/80",
                ].join(" ")}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
