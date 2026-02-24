import type { Grid } from "./types";
import { GRID_SIZE, MAX_HEIGHT } from "./constants";
import {
  ROUND_1_TARGETS, ROUND_1_DESCRIPTIONS,
  ROUND_2_TARGETS, ROUND_2_DESCRIPTIONS,
} from "./targets";

export function buildProgressContext(teamGrid: Grid | null, target: Grid): string {
  if (!teamGrid) return "";

  let placed = 0, correct = 0, total = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let h = 0; h < MAX_HEIGHT; h++) {
        if (teamGrid[r][c][h] !== "empty") placed++;
        if (target[r][c][h] !== "empty") {
          total++;
          if (teamGrid[r][c][h] === target[r][c][h]) correct++;
        }
      }
    }
  }

  if (placed === 0) return "\n\n## Current Build Progress\nThe team hasn't placed any blocks yet. Start by guiding them on the foundation.";

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return `\n\n## Current Build Progress\nThe team has placed ${placed} blocks so far. ${correct}/${total} target cells are correct (${pct}% accuracy). Help them improve!`;
}

export function buildSystemPrompt(target: Grid, round: 1 | 2): string {
  // Match the target grid to its description by finding it in the array
  const targets = round === 1 ? ROUND_1_TARGETS : ROUND_2_TARGETS;
  const descriptions = round === 1 ? ROUND_1_DESCRIPTIONS : ROUND_2_DESCRIPTIONS;
  const idx = targets.findIndex(t =>
    JSON.stringify(t) === JSON.stringify(target)
  );
  const desc = idx >= 0 ? descriptions[idx] : descriptions[0];
  let gridStr = "";
  for (let h = 0; h < MAX_HEIGHT; h++) {
    const layerCells: string[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = target[r][c][h];
        if (cell !== "empty") layerCells.push(`(${r},${c}):${cell}`);
      }
    }
    if (layerCells.length > 0) {
      gridStr += `\nLayer ${h}: ${layerCells.join(" ")}`;
    }
  }

  return `You are Scout, an AI construction robot assistant for the "Blueprint Telephone" game by 500 Acres.

You are helping a team build a structure using Skylark 250-inspired blocks on an ${GRID_SIZE}x${GRID_SIZE} isometric grid.

## The Target Structure
${desc}

Grid data by layer (row,col):blockType — only non-empty cells shown:
${gridStr}

## Block Types Available
- wall: Solid structural block (brown)
- floor: Ground/foundation panel (cream)
- roof: Roofing piece (green)
- window: Wall with glass cutout (gold)
- door: Entry block (clay)
- empty: Remove/clear a cell

## Your Capabilities
You can DESCRIBE the target and you can BUILD by including action commands in your response.

To place blocks, include a JSON array in your response wrapped in <actions> tags:
<actions>[{"row":0,"col":0,"height":0,"block":"wall"},{"row":0,"col":1,"height":0,"block":"wall"}]</actions>

## Rules
- You can see the TARGET structure. If build progress is shown below, use it to guide the team
- Keep text responses SHORT (1-3 sentences) — this is a timed game
- Be enthusiastic, encouraging, and clear
- Use grid coordinates (row, col) starting from (0,0) at top-left
- When asked to build, include <actions> tags with the block placements
- When asked to describe, give clear spatial descriptions
- You are a friendly robot construction assistant — warm but efficient`;
}
