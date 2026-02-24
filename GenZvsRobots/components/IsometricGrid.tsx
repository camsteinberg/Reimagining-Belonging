"use client";

import React, { useCallback, useRef } from "react";
import type { Grid, BlockType } from "@/lib/types";
import { GRID_SIZE } from "@/lib/constants";
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  BLOCK_HEIGHT,
  GRID_PIXEL_WIDTH,
  GRID_PIXEL_HEIGHT,
  gridToIso,
  isoToGrid,
} from "@/lib/isometric";
import IsometricBlock from "./IsometricBlock";

// ---------------------------------------------------------------------------
// Ground tile colors — alternating warm neutrals
// ---------------------------------------------------------------------------
const GROUND_A = "#d4cfc4";
const GROUND_B = "#cec8bc";

/**
 * Returns the 4 SVG points of a flat isometric tile (diamond shape)
 * centred at the tile's screen origin.
 */
function groundTilePoints(cx: number, cy: number): string {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;
  return [
    `${cx},${cy}`,
    `${cx + hw},${cy + hh}`,
    `${cx},${cy + TILE_HEIGHT}`,
    `${cx - hw},${cy + hh}`,
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IsometricGridProps {
  grid: Grid;
  onCellClick?: (row: number, col: number) => void;
  selectedBlock?: BlockType;
  readOnly?: boolean;
  showScoring?: boolean;
  targetGrid?: Grid;
  /** Set of cell keys ("row,col") that were placed by the AI */
  aiPlacedCells?: Set<string>;
  className?: string;
  /** Set of cell keys ("row,col") for newly placed blocks */
  newCells?: Set<string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IsometricGrid({
  grid,
  onCellClick,
  readOnly = false,
  showScoring = false,
  targetGrid,
  aiPlacedCells,
  className,
  newCells,
}: IsometricGridProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // The SVG coordinate system has (0,0) at the top-center of the entire grid.
  // We shift everything right by half the pixel width so the grid fits.
  const offsetX = GRID_PIXEL_WIDTH / 2;
  // Small vertical padding so blocks at row 0 aren't clipped at the top.
  const offsetY = BLOCK_HEIGHT + TILE_HEIGHT / 2;

  const viewBox = `0 0 ${GRID_PIXEL_WIDTH} ${GRID_PIXEL_HEIGHT}`;

  // ------------------------------------------------------------------
  // Click handler: converts an SVG click to grid coordinates
  // ------------------------------------------------------------------
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (readOnly || !onCellClick) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      // Screen pixel position relative to SVG element
      const scaleX = GRID_PIXEL_WIDTH / rect.width;
      const scaleY = GRID_PIXEL_HEIGHT / rect.height;

      const svgX = (e.clientX - rect.left) * scaleX - offsetX;
      const svgY = (e.clientY - rect.top) * scaleY - offsetY;

      const { row, col } = isoToGrid(svgX, svgY);

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        onCellClick(row, col);
      }
    },
    [readOnly, onCellClick, offsetX, offsetY]
  );

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  /** Translate string for a given (row, col) in the SVG */
  const tileTranslate = (row: number, col: number) => {
    const { x, y } = gridToIso(row, col);
    return `translate(${offsetX + x}, ${offsetY + y})`;
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className={className ?? "w-full h-full max-h-[50vh]"}
      onClick={handleSvgClick}
      style={{ cursor: readOnly ? "default" : "pointer" }}
      aria-label="Isometric building grid"
    >
      {/* ----------------------------------------------------------------
          Ground plane — 8×8 flat diamond tiles, back-to-front order
      ---------------------------------------------------------------- */}
      <g aria-label="ground">
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => {
            const { x, y } = gridToIso(row, col);
            const cx = offsetX + x;
            const cy = offsetY + y;
            const isEven = (row + col) % 2 === 0;
            return (
              <polygon
                key={`ground-${row}-${col}`}
                points={groundTilePoints(cx, cy)}
                fill={isEven ? GROUND_A : GROUND_B}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth={0.5}
              />
            );
          })
        )}
      </g>

      {/* ----------------------------------------------------------------
          Blocks — rendered back-to-front (row 0 col 0 last) so that
          blocks in front correctly occlude blocks behind them.
          Iso painter's algorithm: render from back-right to front-left.
          Row increases "south-west", col increases "south-east", so
          we render rows 0→N, cols 0→N to get back-to-front.
      ---------------------------------------------------------------- */}
      <g aria-label="blocks">
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => {
            const stack = grid[row]?.[col];
            if (!stack) return null;
            // Find topmost non-empty block in stack
            let block: BlockType = "empty";
            for (let h = stack.length - 1; h >= 0; h--) {
              if (stack[h] !== "empty") { block = stack[h]; break; }
            }
            if (block === "empty") return null;

            const cellKey = `${row},${col}`;
            const isNew = newCells?.has(cellKey) ?? false;
            const isAIPlaced = aiPlacedCells?.has(cellKey) ?? false;

            let isCorrect: boolean | null = null;
            if (showScoring && targetGrid) {
              const targetStack = targetGrid[row]?.[col];
              // Compare top block of target
              let expected: BlockType = "empty";
              if (targetStack) {
                for (let h = targetStack.length - 1; h >= 0; h--) {
                  if (targetStack[h] !== "empty") { expected = targetStack[h]; break; }
                }
              }
              isCorrect = block === expected;
            }

            return (
              <g
                key={`block-${row}-${col}`}
                transform={tileTranslate(row, col)}
                aria-label={`${block} at row ${row} col ${col}`}
              >
                <IsometricBlock
                  block={block}
                  isNew={isNew}
                  isAIPlaced={isAIPlaced}
                  isCorrect={isCorrect}
                />
              </g>
            );
          })
        )}
      </g>
    </svg>
  );
}
