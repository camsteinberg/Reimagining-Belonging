import type { BuildAction, AIResponse, BlockType } from "./types";
import { GRID_SIZE } from "./constants";

const VALID_BLOCKS = new Set<string>(["wall", "floor", "roof", "window", "door", "plant", "table", "metal", "concrete", "barrel", "pipe", "empty", "air"]);

export function parseAIResponse(text: string): AIResponse {
  const actions: BuildAction[] = [];

  // Extract <actions> JSON
  const actionsMatch = text.match(/<actions>([\s\S]*?)<\/actions>/);
  if (actionsMatch) {
    try {
      const parsed = JSON.parse(actionsMatch[1]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            typeof item.row === "number" &&
            typeof item.col === "number" &&
            VALID_BLOCKS.has(item.block) &&
            item.row >= 0 && item.row < GRID_SIZE &&
            item.col >= 0 && item.col < GRID_SIZE
          ) {
            actions.push({
              row: item.row,
              col: item.col,
              block: item.block as BlockType,
              height: typeof item.height === "number" ? item.height : undefined,
            });
          }
        }
      }
    } catch {
      // Invalid JSON, ignore actions
    }
  }

  // Clean text (remove <actions> tags from display text)
  const cleanText = text.replace(/<actions>[\s\S]*?<\/actions>/g, "").trim();

  return { text: cleanText, actions };
}
