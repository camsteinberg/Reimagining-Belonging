"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Grid, BlockType } from "@/lib/types";
import { GRID_SIZE } from "@/lib/constants";
import { renderVoxelGrid } from "@/lib/voxelRenderer";
import { screenToGrid, type Rotation } from "@/lib/voxel";
import { TILE_W, TILE_H, BLOCK_H } from "@/lib/sprites";

// ---------------------------------------------------------------------------
// Props — identical to IsometricGrid for drop-in swap
// ---------------------------------------------------------------------------

interface VoxelGridProps {
  grid: Grid;
  onCellClick?: (row: number, col: number) => void;
  selectedBlock?: BlockType;
  readOnly?: boolean;
  showScoring?: boolean;
  targetGrid?: Grid;
  aiPlacedCells?: Set<string>;
  className?: string;
  newCells?: Set<string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoxelGrid({
  grid,
  onCellClick,
  readOnly = false,
  showScoring = false,
  targetGrid,
  aiPlacedCells,
  className,
  newCells,
}: VoxelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [rotationLocked, setRotationLocked] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: 400, h: 300 });
  const animFrameRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // ---- DPR scaling ----
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // ---- ResizeObserver to track container size ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ w: width, h: height });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ---- Single render function ----
  const render = useCallback(
    (time?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvasSize.w * dpr;
      const h = canvasSize.h * dpr;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      renderVoxelGrid(ctx, {
        grid,
        width: w,
        height: h,
        rotation,
        showScoring,
        targetGrid,
        aiPlacedCells,
        newCells,
        animTime: time ?? 0,
      });
    },
    [grid, canvasSize, dpr, rotation, showScoring, targetGrid, aiPlacedCells, newCells],
  );

  // ---- Animation loop (only when needed) ----
  useEffect(() => {
    const hasAnim = (newCells && newCells.size > 0) || (aiPlacedCells && aiPlacedCells.size > 0);

    if (!hasAnim) {
      // Single static render
      render(0);
      return;
    }

    animStartRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = now - animStartRef.current;
      render(elapsed);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // ---- Click / tap handling ----
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Swipe to rotate (only if unlocked and horizontal drag > 60px)
      if (!rotationLocked && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setRotation((prev) => ((dx > 0 ? prev + 1 : prev + 3) % 4) as Rotation);
        return;
      }

      // Tap to place block (movement < 10px)
      if (dist < 10 && !readOnly && onCellClick) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = (canvasSize.w * dpr) / rect.width;
        const scaleY = (canvasSize.h * dpr) / rect.height;

        // Get pixel position in canvas coordinate space
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Reverse the transform applied in renderVoxelGrid
        // We need to match the offset/scale used in the renderer
        const { minX, minY, maxX, maxY } = getGridExtent(rotation);
        const gridW = maxX - minX;
        const gridH = maxY - minY;
        const w = canvasSize.w * dpr;
        const h = canvasSize.h * dpr;
        const padding = 8;
        const sx = (w - padding * 2) / gridW;
        const sy = (h - padding * 2) / gridH;
        const scale = Math.min(sx, sy);
        const offsetX = (w - gridW * scale) / 2 - minX * scale;
        const offsetY = (h - gridH * scale) / 2 - minY * scale;

        // Inverse transform: canvas coords -> grid iso coords
        const isoX = (canvasX - offsetX) / scale;
        const isoY = (canvasY - offsetY) / scale;

        const { row, col } = screenToGrid(isoX, isoY, rotation);

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          onCellClick(row, col);
        }
      }
    },
    [readOnly, onCellClick, rotation, rotationLocked, canvasSize, dpr],
  );

  // ---- Rotate helpers ----
  const rotateLeft = useCallback(() => {
    setRotation((r) => ((r + 3) % 4) as Rotation);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation((r) => ((r + 1) % 4) as Rotation);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "w-full h-full max-h-[50vh]"}
      style={{ position: "relative", touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          cursor: readOnly ? "default" : "pointer",
          display: "block",
        }}
        aria-label="Voxel building grid"
      />

      {/* Rotation controls — only for interactive (non-readOnly) grids */}
      {!readOnly && (
        <>
          {/* Lock / unlock toggle */}
          <button
            onClick={() => setRotationLocked((l) => !l)}
            className="absolute top-1 right-1 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-xs font-mono transition-colors"
            title={rotationLocked ? "Unlock rotation" : "Lock rotation"}
            type="button"
          >
            {rotationLocked ? "🔒" : "🔓"}
          </button>

          {/* Rotation arrows (hidden when locked) */}
          {!rotationLocked && (
            <>
              <button
                onClick={rotateLeft}
                className="absolute bottom-1 left-1 bg-black/40 hover:bg-black/60 text-white rounded px-2 py-1 text-sm font-mono transition-colors"
                title="Rotate left"
                type="button"
              >
                ◀
              </button>
              <button
                onClick={rotateRight}
                className="absolute bottom-1 right-1 bg-black/40 hover:bg-black/60 text-white rounded px-2 py-1 text-sm font-mono transition-colors"
                title="Rotate right"
                type="button"
              >
                ▶
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---- Duplicated extent calc (kept in sync with voxelRenderer.ts) ----
// Needed here for click inverse-transform. Importing from renderer would
// create a clean module boundary but duplicating ~10 lines is simpler.

import { gridToScreen } from "@/lib/voxel";

function getGridExtent(rotation: Rotation) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const { x, y } = gridToScreen(r, c, rotation);
      minX = Math.min(minX, x - TILE_W / 2);
      maxX = Math.max(maxX, x + TILE_W / 2);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + TILE_H + BLOCK_H);
    }
  }
  return { minX, minY, maxX, maxY };
}
