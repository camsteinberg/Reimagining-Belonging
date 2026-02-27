import type { BuildAction, AIResponse, BlockType } from "./types";
import { GRID_SIZE } from "./constants";

const VALID_BLOCKS = new Set<string>(["wall", "floor", "roof", "window", "door", "plant", "table", "metal", "concrete", "barrel", "pipe", "empty", "air"]);

export function parseAIResponse(text: string): AIResponse {
  const actions: BuildAction[] = [];

  // Extract ALL <actions> blocks (there may be multiple)
  const actionsRegex = /<actions>([\s\S]*?)<\/actions>/g;
  let match;
  while ((match = actionsRegex.exec(text)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
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
      // Invalid JSON in this block, skip it
    }
  }

  // Clean text (remove all <actions> tags from display text)
  const cleanText = text.replace(/<actions>[\s\S]*?<\/actions>/g, "").trim();

  return { text: cleanText, actions };
}
