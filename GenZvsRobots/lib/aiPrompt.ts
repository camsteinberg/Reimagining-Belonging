import type { Grid } from "./types";
import { GRID_SIZE, MAX_HEIGHT, colToLetter, rowToNumber } from "./constants";
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

export function buildSystemPrompt(
  target: Grid,
  round: 1 | 2,
  aiActionLog?: { row: number; col: number; block: string }[],
  role?: "architect" | "builder"
): string {
  // Match the target grid to its description
  const targets = round === 1 ? ROUND_1_TARGETS : ROUND_2_TARGETS;
  const descriptions = round === 1 ? ROUND_1_DESCRIPTIONS : ROUND_2_DESCRIPTIONS;
  const idx = targets.findIndex(t =>
    JSON.stringify(t) === JSON.stringify(target)
  );
  const desc = idx >= 0
    ? descriptions[idx]
    : "This building was designed by the team's Architect. Study the grid data below.";

  let gridStr = "";
  for (let h = 0; h < MAX_HEIGHT; h++) {
    const layerCells: string[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = target[r][c][h];
        if (cell !== "empty") layerCells.push(`${colToLetter(c)}${rowToNumber(r)}:${cell}`);
      }
    }
    if (layerCells.length > 0) {
      gridStr += `\nLayer ${h}: ${layerCells.join(" ")}`;
    }
  }

  let actionLogStr = "";
  if (aiActionLog && aiActionLog.length > 0) {
    actionLogStr = `\n\nRecent actions:\n`;
    actionLogStr += aiActionLog.map((a, i) =>
      `${i + 1}. ${colToLetter(a.col)}${rowToNumber(a.row)}: ${a.block}`
    ).join("\n");
    actionLogStr += "\nTo undo, place 'empty' at those positions via <actions>.";
  }

  const roleSection = role === "architect"
    ? `\n## YOUR ROLE: Architect Coach
You are talking to the ARCHITECT who designed this building.
- NEVER include <actions> tags. You cannot place blocks.
- Help them describe their design to their Builder teammate.
- Suggest simple descriptions: "Tell them: walls along the back edge, floors in the middle"
- Keep it to ONE short sentence.`
    : `\n## YOUR ROLE: Builder Helper
You are talking to the BUILDER who is recreating the Architect's design.
- You CAN and SHOULD place blocks using <actions> tags when asked to build.
- After building, confirm briefly: "Done! Placed 6 walls along the back."
- If they ask what to build, describe the next section simply.`;

  return `You are Scout, a friendly robot construction helper.

## RESPONSE RULES — FOLLOW STRICTLY
- Reply in ONE sentence. Maximum TWO if absolutely necessary.
- NEVER use bullet points, numbered lists, or multiple paragraphs.
- NEVER mention coordinates like "A1" or "Layer 0" in your text to players.
- Use plain spatial language: "back wall", "left side", "ground floor", "on top"
- Be warm and encouraging but extremely brief. This is a timed game!

## BAD vs GOOD responses
BAD: "I'll place wall blocks at positions A1 through A6 on Layer 0 to create the back wall foundation of the structure. This will form the northern edge."
GOOD: "Building the back wall for you!"

BAD: "The target has walls at A1, A2, A3, B1, B3, with floor tiles at B2, and a door at C2 on Layer 0, then roof blocks on Layer 1 at A1 through B3."
GOOD: "Tell them it's a small room with walls around the edges, a floor inside, a door in front, and a roof on top!"

## Target Structure
${desc}

## Grid (${GRID_SIZE}x${GRID_SIZE}, up to ${MAX_HEIGHT} high)
Columns A-${colToLetter(GRID_SIZE - 1)} (left-right), Rows 1-${GRID_SIZE} (back-front).
${gridStr}

## Block Types
wall, floor, roof, window, door (auto-stacks 2 high), plant, table, metal, concrete, barrel, pipe, air (invisible scaffold), empty (erases top block)

## Building (for <actions> only — never show to players)
To place blocks: <actions>[{"row":0,"col":0,"block":"wall"}]</actions>
Row/col are 0-indexed in actions. ALWAYS include <actions> when asked to build anything.
${actionLogStr}
${roleSection}`;
}
