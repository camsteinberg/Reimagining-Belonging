"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Grid, BlockType } from "@/lib/types";
import { GRID_SIZE } from "@/lib/constants";
import { renderVoxelGrid, getGridExtent } from "@/lib/voxelRenderer";
import { screenToGrid, screenToGridWithHeight, type Rotation } from "@/lib/voxel";
import { TILE_W, TILE_H } from "@/lib/sprites";

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
  newCells?: Map<string, number>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoxelGrid({
  grid,
  onCellClick,
  selectedBlock,
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
  const [topDown, setTopDown] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 400, h: 300 });
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [keyboardCursor, setKeyboardCursor] = useState<{ row: number; col: number } | null>(null);
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

  // ---- Inverse transform helper (canvas coords -> grid cell) ----
  const canvasToGrid = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleXR = (canvasSize.w * dpr) / rect.width;
      const scaleYR = (canvasSize.h * dpr) / rect.height;

      const canvasX = (clientX - rect.left) * scaleXR;
      const canvasY = (clientY - rect.top) * scaleYR;

      // Top-down mode: simple grid math
      if (topDown) {
        const w = canvasSize.w * dpr;
        const h = canvasSize.h * dpr;
        const padding = 16;
        const availW = w - padding * 2;
        const availH = h - padding * 2;
        const cellSize = Math.floor(Math.min(availW / GRID_SIZE, availH / GRID_SIZE));
        const gridPxW = cellSize * GRID_SIZE;
        const gridPxH = cellSize * GRID_SIZE;
        const originX = Math.floor((w - gridPxW) / 2);
        const originY = Math.floor((h - gridPxH) / 2);

        const col = Math.floor((canvasX - originX) / cellSize);
        const row = Math.floor((canvasY - originY) / cellSize);

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          return { row, col };
        }
        return null;
      }

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

      const isoX = (canvasX - offsetX) / scale;
      const isoY = (canvasY - offsetY) / scale;

      // Use height-aware detection that checks top-face diamonds of stacked blocks,
      // falling back to ground-plane detection for empty cells
      const { row, col } = screenToGridWithHeight(isoX, isoY - TILE_H / 2, rotation, grid);

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        return { row, col };
      }
      return null;
    },
    [rotation, canvasSize, dpr, grid, topDown],
  );

  // ---- Single render function (stored in ref to avoid restarting animation loop) ----
  const renderRef = useRef<(time: number) => void>(() => {});
  renderRef.current = useCallback(
    (time: number) => {
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
        animTime: time,
        hoverCell: readOnly ? null : (keyboardCursor ?? hoverCell),
        hoverBlock: selectedBlock,
        topDown,
      });
    },
    [grid, canvasSize, dpr, rotation, showScoring, targetGrid, aiPlacedCells, newCells, hoverCell, keyboardCursor, selectedBlock, readOnly, topDown],
  );

  // ---- Static render when no animation needed ----
  useEffect(() => {
    const hasAnim = (newCells && newCells.size > 0) || (aiPlacedCells && aiPlacedCells.size > 0);
    if (!hasAnim) {
      renderRef.current(performance.now());
    }
  }, [renderRef.current]);

  // ---- Animation loop (only when animated cells exist) ----
  useEffect(() => {
    const hasAnim = (newCells && newCells.size > 0) || (aiPlacedCells && aiPlacedCells.size > 0);
    if (!hasAnim) return;

    const loop = () => {
      renderRef.current(performance.now());
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [newCells, aiPlacedCells]);

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
        const cell = canvasToGrid(e.clientX, e.clientY);
        if (cell) {
          onCellClick(cell.row, cell.col);
        }
      }
    },
    [readOnly, onCellClick, rotationLocked, canvasToGrid],
  );

  // ---- Hover tracking ----
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly) return;
      setKeyboardCursor(null);
      const cell = canvasToGrid(e.clientX, e.clientY);
      setHoverCell((prev) => {
        if (!cell && !prev) return prev;
        if (!cell) return null;
        if (prev && prev.row === cell.row && prev.col === cell.col) return prev;
        return cell;
      });
    },
    [readOnly, canvasToGrid],
  );

  const handlePointerLeave = useCallback(() => {
    setHoverCell(null);
  }, []);

  // ---- Keyboard navigation ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (readOnly) return;

      const cur = keyboardCursor ?? { row: 0, col: 0 };
      let { row, col } = cur;

      switch (e.key) {
        case "ArrowUp":
          row = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          row = Math.min(GRID_SIZE - 1, row + 1);
          break;
        case "ArrowLeft":
          col = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          col = Math.min(GRID_SIZE - 1, col + 1);
          break;
        case "Enter":
        case " ":
          if (onCellClick) onCellClick(cur.row, cur.col);
          e.preventDefault();
          return;
        default:
          return;
      }
      e.preventDefault();
      setKeyboardCursor({ row, col });
    },
    [readOnly, keyboardCursor, onCellClick],
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
      tabIndex={readOnly ? undefined : 0}
      onKeyDown={readOnly ? undefined : handleKeyDown}
      role="application"
      aria-label="Building grid"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          cursor: readOnly ? "default" : "pointer",
          display: "block",
        }}
        aria-hidden="true"
      />

      {/* Top-down / 3D view toggle */}
      <button
        onClick={() => setTopDown((v) => !v)}
        className={[
          "absolute top-2 left-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
          topDown
            ? "bg-[#b89f65]/90 hover:bg-[#b89f65] text-[#2a2520] ring-1 ring-[#b89f65]"
            : "bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] ring-1 ring-[#b89f65]/40",
        ].join(" ")}
        title={topDown ? "Switch to 3D isometric view" : "Switch to 2D top-down view"}
        type="button"
      >
        <span className="text-sm">{topDown ? "3D" : "2D"}</span>
      </button>

      {/* Rotation controls — available on all grids (architects need to rotate too) */}
      {(
        <>
          {/* Rotate toggle — prominent labeled button */}
          <button
            onClick={() => setRotationLocked((l) => !l)}
            className={[
              "absolute top-2 right-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
              rotationLocked
                ? "bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] ring-1 ring-[#b89f65]/40 animate-[pulse_3s_ease-in-out_2]"
                : "bg-[#b89f65]/90 hover:bg-[#b89f65] text-[#2a2520] ring-1 ring-[#b89f65]",
            ].join(" ")}
            title={rotationLocked ? "Unlock to rotate the building view" : "Lock rotation"}
            type="button"
          >
            <span className="text-sm">{rotationLocked ? "🔒" : "🔓"}</span>
            <span>{rotationLocked ? "Rotate" : "Lock"}</span>
          </button>

          {/* Rotation arrows — visible when unlocked */}
          {!rotationLocked && (
            <>
              <button
                onClick={rotateLeft}
                className="absolute bottom-2 left-2 bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] rounded-lg px-3 py-2 text-base font-mono transition-colors shadow-md ring-1 ring-[#b89f65]/30"
                title="Rotate left"
                type="button"
              >
                ◀
              </button>
              <button
                onClick={rotateRight}
                className="absolute bottom-2 right-2 bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] rounded-lg px-3 py-2 text-base font-mono transition-colors shadow-md ring-1 ring-[#b89f65]/30"
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
