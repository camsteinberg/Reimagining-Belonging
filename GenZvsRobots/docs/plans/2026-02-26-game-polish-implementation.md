# Blueprint Telephone — Final Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring Blueprint Telephone to its final polished version: 6x6 grid, 6-high building, chess notation, 4 new utility blocks, Scout AI overhaul, strict 2-player teams, walkthrough tutorials, and numerous UX fixes.

**Architecture:** Changes span the full stack — constants/types (foundation), pixel sprites (rendering), game state (server logic), AI prompt (Claude integration), and React components (UI). Each task is self-contained and builds on the previous. Grid constant changes propagate automatically through the codebase since most code references `GRID_SIZE` and `MAX_HEIGHT`.

**Tech Stack:** Next.js 16 + React 19, PartyKit WebSocket, Canvas 2D with ImageData sprites, Anthropic Claude Sonnet 4.6, Tailwind CSS, Framer Motion.

---

## Task 1: Grid Constants, Timings & New Block Types

Update the foundational constants and types that everything else depends on.

**Files:**
- Modify: `lib/constants.ts`
- Modify: `lib/types.ts`

**Step 1: Update grid constants**

In `lib/constants.ts`, change:
```typescript
export const GRID_SIZE = 6;          // was 8
export const ROUND_DURATION_MS = 3 * 60 * 1000;  // was 5 min, now 3 min
export const DESIGN_DURATION_MS = 2 * 60 * 1000;  // was 3 min, now 2 min
```

Change `MAX_HEIGHT`:
```typescript
export const MAX_HEIGHT = 6;  // was 4
```

Remove `PREFERRED_TEAM_SIZE` (no longer needed with strict 2-player):
```typescript
export const MAX_TEAM_SIZE = 2;  // was 3
// DELETE: export const PREFERRED_TEAM_SIZE = 2;
export const MIN_TEAM_SIZE = 2;
```

**Step 2: Add new block colors and labels**

In `lib/constants.ts`, add to `BLOCK_COLORS`:
```typescript
export const BLOCK_COLORS: Record<BlockType, string> = {
  wall: "#8b5e3c",
  floor: "#e8e0d0",
  roof: "#5a8a68",
  window: "#7eb8cc",
  door: "#b8755d",
  plant: "#4a8c3f",
  table: "#c4956a",
  metal: "#8a9bae",
  concrete: "#a0a0a0",
  barrel: "#b07840",
  pipe: "#6e7b8a",
  air: "transparent",
  empty: "transparent",
};
```

Add to `BLOCK_LABELS`:
```typescript
export const BLOCK_LABELS: Record<BlockType, string> = {
  wall: "Wall",
  floor: "Floor",
  roof: "Roof",
  window: "Window",
  door: "Door",
  plant: "Plant",
  table: "Table",
  metal: "Metal",
  concrete: "Concrete",
  barrel: "Barrel",
  pipe: "Pipe",
  air: "Air",
  empty: "Erase",
};
```

**Step 3: Update BlockType in types.ts**

In `lib/types.ts`, update the BlockType union (line 2):
```typescript
export type BlockType = "wall" | "floor" | "roof" | "window" | "door" | "plant" | "table" | "metal" | "concrete" | "barrel" | "pipe" | "air" | "empty";
```

Add new HostAction values (line 66-77) — add `"kickPlayer"`:
```typescript
export type HostAction =
  | "startRound"
  | "pause"
  | "resume"
  | "skipToReveal"
  | "nextReveal"
  | "prevReveal"
  | "endGame"
  | "startDemo"
  | "endDemo"
  | "startDesign"
  | "endDesign"
  | "kickPlayer";
```

Add new ClientMessage variant for leaving:
```typescript
export type ClientMessage =
  | { type: "join"; name: string; isHost?: boolean; reconnectToken?: string }
  | { type: "placeBlock"; row: number; col: number; block: BlockType }
  | { type: "chat"; text: string }
  | { type: "hostAction"; action: HostAction; targetPlayerId?: string }
  | { type: "aiChat"; text: string }
  | { type: "setTeamName"; name: string }
  | { type: "leaveGame" };
```

Add a new ServerMessage for kicks:
```typescript
export type ServerMessage =
  | { type: "state"; state: RoomState }
  | { type: "gridUpdate"; teamId: string; row: number; col: number; height: number; block: BlockType }
  | { type: "chat"; teamId: string; senderId: string; senderName: string; text: string; isAI?: boolean }
  | { type: "aiBuilding"; teamId: string; actions: BuildAction[] }
  | { type: "timer"; timerEnd: number }
  | { type: "phaseChange"; phase: GamePhase }
  | { type: "error"; message: string }
  | { type: "playerJoined"; player: Player }
  | { type: "reconnected"; player: Player }
  | { type: "scores"; teams: { teamId: string; teamName: string; score: number; round: 1 | 2 }[] }
  | { type: "kicked"; message: string };
```

**Step 4: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

This will produce errors in files that reference old block types or PREFERRED_TEAM_SIZE. That's expected — we fix those in subsequent tasks.

**Step 5: Commit**

```bash
git add lib/constants.ts lib/types.ts
git commit -m "feat: update grid to 6x6x6, add new block types, update timings"
```

---

## Task 2: New Block Sprites & Texture Improvements

Draw 4 new sprite types and improve existing sprite fidelity.

**Files:**
- Modify: `lib/sprites.ts`

**Step 1: Add new sprites to SPRITE_TYPES**

Change line 13:
```typescript
export const SPRITE_TYPES = [
  "wall", "floor", "roof", "window", "door", "door_top",
  "plant", "table", "metal", "concrete", "barrel", "pipe",
  "air", "empty",
] as const;
```

**Step 2: Define base colors for new blocks**

In the `SPRITE_COLORS` mapping inside `drawSpriteToImageData()` (or wherever the color lookup is), add:
```typescript
metal:    { r: 138, g: 155, b: 174 },   // steel blue-gray
concrete: { r: 160, g: 160, b: 160 },   // neutral gray
barrel:   { r: 176, g: 120, b: 64 },    // warm brown-orange
pipe:     { r: 110, g: 123, b: 138 },   // dark steel gray
```

**Step 3: Write decoration functions for new blocks**

Add after existing decoration functions:

```typescript
function drawMetalDecorations(
  data: ImageData, left: number[][], right: number[][], top: number[][],
  lr: number, lg: number, lb: number, rr: number, rg: number, rb: number
) {
  // Horizontal rivet lines on left and right faces
  // 2 lines at 1/3 and 2/3 height, with small bright dots for rivets
  const leftInset = insetFace(left, 2);
  const rightInset = insetFace(right, 2);
  // Horizontal dark lines for panel seams
  const darkL = [Math.max(0, lr - 30), Math.max(0, lg - 30), Math.max(0, lb - 30)];
  const darkR = [Math.max(0, rr - 30), Math.max(0, rg - 30), Math.max(0, rb - 30)];
  // Draw 2 horizontal seam lines per face using drawLine
  // Add bright rivet dots at intervals using setPixel
}

function drawConcreteDecorations(
  data: ImageData, left: number[][], right: number[][], top: number[][],
  lr: number, lg: number, lb: number, rr: number, rg: number, rb: number
) {
  // Subtle speckle texture: random darker pixels scattered across faces
  // Thin horizontal form-work lines at 1/3 and 2/3 height
}

function drawBarrelDecorations(
  data: ImageData, left: number[][], right: number[][], top: number[][],
  lr: number, lg: number, lb: number, rr: number, rg: number, rb: number,
  tr: number, tg: number, tb: number
) {
  // Dark horizontal bands (hoops) at top and bottom of each face
  // Vertical wood grain lines between the hoops
  // Top face: circular opening (darker ellipse in center of diamond)
}

function drawPipeDecorations(
  data: ImageData, left: number[][], right: number[][], top: number[][],
  lr: number, lg: number, lb: number, rr: number, rg: number, rb: number,
  tr: number, tg: number, tb: number
) {
  // Cylindrical appearance: bright vertical highlight stripe on right face center
  // Dark edges on left face for shadow
  // Top face: dark circular opening (ring shape)
  // Flange line near top and bottom
}
```

The actual pixel-perfect implementations should follow the existing patterns in `drawWallDecorations`, `drawPlantDecorations` etc. — using `setPixel()`, `drawLine()`, `fillPoly()` with the face geometry as reference.

**Step 4: Wire new decorations into drawSpriteToImageData()**

In the switch/if block that calls decoration functions (around line 420-440), add cases:
```typescript
if (sprite === "metal") {
  drawMetalDecorations(imgData, leftPts, rightPts, topPts, lr, lg, lb, rr, rg, rb);
} else if (sprite === "concrete") {
  drawConcreteDecorations(imgData, leftPts, rightPts, topPts, lr, lg, lb, rr, rg, rb);
} else if (sprite === "barrel") {
  drawBarrelDecorations(imgData, leftPts, rightPts, topPts, lr, lg, lb, rr, rg, rb, tr, tg, tb);
} else if (sprite === "pipe") {
  drawPipeDecorations(imgData, leftPts, rightPts, topPts, lr, lg, lb, rr, rg, rb, tr, tg, tb);
}
```

**Step 5: Improve existing sprite textures**

Enhance existing decoration functions for the larger tile scale (6x6 means ~33% larger tiles on screen):
- `drawWallDecorations`: Add a second mortar line style (alternating brick pattern)
- `drawWindowDecorations`: Add highlight reflection dot on glass
- `drawRoofDecoration`: Add more shingle detail lines (3 instead of 2)
- `drawFloorDecoration`: Make the cross-hatch slightly more visible

These are small additions to existing functions — 2-5 lines each.

**Step 6: Verify sprites render**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

The atlas will automatically include new sprites since it iterates SPRITE_TYPES.

**Step 7: Commit**

```bash
git add lib/sprites.ts
git commit -m "feat: add metal/concrete/barrel/pipe sprites, improve textures"
```

---

## Task 3: Update Block Palette

Add new blocks to the palette and make it scrollable.

**Files:**
- Modify: `components/BlockPalette.tsx`

**Step 1: Update BLOCK_ORDER**

```typescript
const BLOCK_ORDER: BlockType[] = [
  "wall", "floor", "roof", "window", "door",
  "plant", "table", "metal", "concrete", "barrel", "pipe",
  "air", "empty",
];
```

**Step 2: Add mini SVG icons for new blocks**

Add `MiniBlock` already handles arbitrary colors. The new blocks will use the existing `MiniBlock` component with their `BLOCK_COLORS` values. No special icons needed (unlike air/empty which have custom SVGs).

**Step 3: Make palette scrollable**

Replace the outer div's `flex flex-row` with a scrollable container:
```tsx
<div className="bg-[#4a3728]/90 rounded-xl backdrop-blur-sm px-3 py-2 overflow-x-auto"
  role="toolbar"
  aria-label="Block palette"
>
  <div className="flex flex-row gap-1 items-center justify-start min-w-max">
    {BLOCK_ORDER.map(...)}
  </div>
</div>
```

Key changes: `overflow-x-auto` on outer div, `justify-start` and `min-w-max` on inner flex so it scrolls instead of wrapping.

**Step 4: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 5: Commit**

```bash
git add components/BlockPalette.tsx
git commit -m "feat: add new blocks to palette, make scrollable"
```

---

## Task 4: Chess Notation & Grid Axis Labels

Add A-F / 1-6 coordinate system to the grid renderer and update Scout's coordinate mapping.

**Files:**
- Modify: `lib/voxelRenderer.ts`
- Modify: `lib/voxel.ts`
- Modify: `lib/aiPrompt.ts`
- Modify: `lib/constants.ts`

**Step 1: Add coordinate helpers to constants.ts**

```typescript
/** Convert grid column (0-based) to chess-notation letter (A-F) */
export function colToLetter(col: number): string {
  return String.fromCharCode(65 + col); // A=0, B=1, ...
}

/** Convert grid row (0-based) to chess-notation number (1-6) */
export function rowToNumber(row: number): number {
  return row + 1;
}

/** Convert chess notation like "B3" to {row, col}. Returns null if invalid. */
export function parseChessNotation(notation: string): { row: number; col: number } | null {
  if (notation.length < 2 || notation.length > 2) return null;
  const colChar = notation[0].toUpperCase();
  const rowChar = notation[1];
  const col = colChar.charCodeAt(0) - 65;
  const row = parseInt(rowChar, 10) - 1;
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE || isNaN(row)) return null;
  return { row, col };
}
```

**Step 2: Draw axis labels in the voxel renderer**

In `lib/voxelRenderer.ts`, add a function to draw axis labels on the ground plane edges:

```typescript
function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  rotation: Rotation,
) {
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(42, 37, 32, 0.35)";

  // Column letters (A-F) along the top edge
  for (let c = 0; c < GRID_SIZE; c++) {
    const { x, y } = gridToScreen(-0.7, c, rotation);
    ctx.fillText(colToLetter(c), x, y + TILE_H / 2);
  }

  // Row numbers (1-6) along the left edge
  for (let r = 0; r < GRID_SIZE; r++) {
    const { x, y } = gridToScreen(r, -0.7, rotation);
    ctx.fillText(String(rowToNumber(r)), x, y + TILE_H / 2);
  }
}
```

Call this after drawing the ground plane (after step 1 in `renderVoxelGrid`, around line 237) but before drawing blocks:
```typescript
// 1.5 Draw axis labels
drawAxisLabels(ctx, rotation);
```

Import `colToLetter`, `rowToNumber` from constants.

**Step 3: Update Scout's system prompt with chess notation**

In `lib/aiPrompt.ts`, update `buildSystemPrompt()`:

Replace the coordinate description in the rules section:
```typescript
## Grid Coordinate System
The grid uses chess-style notation: columns A-${colToLetter(GRID_SIZE - 1)} (left to right) and rows 1-${GRID_SIZE} (back to front).
- A1 is the back-left corner
- ${colToLetter(GRID_SIZE - 1)}${GRID_SIZE} is the front-right corner
- Always refer to positions using this notation (e.g., "B3", "D1")

Example: "Place a wall at B3" means column B, row 3.
```

Update the grid data format to include chess notation:
```typescript
if (cell !== "empty") layerCells.push(\`${colToLetter(c)}${rowToNumber(r)}:${cell}\`);
```

So grid data reads like: `Layer 0: A1:wall A2:wall B1:floor` instead of `(0,0):wall (1,0):wall`.

Update the `<actions>` instruction:
```typescript
To place blocks, include a JSON array in your response wrapped in <actions> tags:
<actions>[{"row":0,"col":0,"block":"wall"},{"row":0,"col":1,"block":"wall"}]</actions>

Note: In <actions> JSON, use numeric row/col (0-indexed). In your text to players, always use chess notation (A1, B3, etc.).
```

Update the rules section:
```typescript
- Use chess notation (A1, B3, etc.) in all text communication with the team
- In <actions> tags, use numeric row (0-based) and col (0-based)
```

**Step 4: Update progress context to use chess notation**

In `buildProgressContext()`, no changes needed — it only reports aggregate stats, not individual positions.

**Step 5: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 6: Commit**

```bash
git add lib/constants.ts lib/voxelRenderer.ts lib/voxel.ts lib/aiPrompt.ts
git commit -m "feat: add chess notation A1-F6 with axis labels on grid"
```

---

## Task 5: Click Precision & Floor Erase Fix

Fix height-aware hit testing so tall stacks are easier to click, and expand floor block hit areas.

**Files:**
- Modify: `components/VoxelGrid.tsx`
- Modify: `lib/voxel.ts`

**Step 1: Add height-aware screenToGrid**

In `lib/voxel.ts`, add a new function that checks multiple height levels:

```typescript
/**
 * Height-aware screen-to-grid conversion.
 * Checks columns from tallest to shortest — if a click falls on the visible
 * top face of a tall stack, pick that column instead of the ground tile behind it.
 */
export function screenToGridWithHeight(
  screenX: number,
  screenY: number,
  rotation: Rotation,
  grid: Grid,
): { row: number; col: number } | null {
  // First try: standard ground-plane hit test
  const ground = screenToGrid(screenX, screenY, rotation);

  // Check all columns with blocks, from tallest to shortest
  // For each column with height > 0, test if the click point is within
  // the top face diamond at that stack height
  for (let h = MAX_HEIGHT - 1; h >= 1; h--) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const stack = grid[r]?.[c];
        if (!stack || stack[h] === "empty") continue;

        // Calculate the screen position of this block's top face
        const { rr, rc } = rotateCoords(r, c, rotation);
        const { x, y } = gridToScreen(r, c, rotation);

        // Cumulative height offset
        let heightOffset = 0;
        for (let below = 0; below <= h; below++) {
          heightOffset += (stack[below] === "floor" ? FLOOR_H : BLOCK_H);
        }

        // Top face diamond at this height
        const topY = y - heightOffset;
        const hw = TILE_W / 2;
        const hh = TILE_H / 2;

        // Point-in-diamond test
        const dx = Math.abs(screenX - x);
        const dy = Math.abs(screenY - (topY + hh));
        if (dx / hw + dy / hh <= 1) {
          return { row: r, col: c };
        }
      }
    }
  }

  // Fall back to ground-plane detection
  return ground.row >= 0 && ground.row < GRID_SIZE && ground.col >= 0 && ground.col < GRID_SIZE
    ? ground
    : null;
}
```

Import `BLOCK_H`, `FLOOR_H` from sprites, and `Grid` from types, `MAX_HEIGHT`, `GRID_SIZE` from constants.

**Step 2: Update VoxelGrid to use height-aware hit testing**

In `components/VoxelGrid.tsx`, update `canvasToGrid()` to use the new function:

```typescript
import { screenToGridWithHeight } from "@/lib/voxel";
```

In the `canvasToGrid` function, replace the `screenToGrid` call with:
```typescript
const result = screenToGridWithHeight(isoX, isoY, rotation, grid);
if (!result) return null;
const { row, col } = result;
```

Where `grid` is the grid prop passed to VoxelGrid.

**Step 3: Expand floor block hit area in erase mode**

This is already handled by the height-aware detection — when erasing, the click targets the column regardless of the topmost block's visual height. The ground-plane fallback covers floor blocks since they occupy the same ground tile.

No additional changes needed — the height-aware test already prioritizes the tallest visible block in each column.

**Step 4: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`
Test manually: stack 4-5 blocks high, verify clicking the top face picks the right column.

**Step 5: Commit**

```bash
git add components/VoxelGrid.tsx lib/voxel.ts
git commit -m "fix: height-aware click detection for tall stacks"
```

---

## Task 6: Pause Button Fix

Fix the pause/resume timer so time doesn't expire during pause.

**Files:**
- Modify: `party/index.ts`

**Step 1: Add remainingTime tracking**

Add a class property:
```typescript
export default class GameRoom implements Party.Server {
  state: RoomState;
  hostId: string | null = null;
  timerInterval: ReturnType<typeof setInterval> | null = null;
  pausedRemainingMs: number | null = null;  // NEW
```

**Step 2: Update pause handler**

```typescript
case "pause": {
  if (this.state.timerEnd) {
    this.pausedRemainingMs = Math.max(0, this.state.timerEnd - Date.now());
  }
  this.stopTimer();
  this.state.timerEnd = null;  // Clear so clients show paused state
  break;
}
```

**Step 3: Update resume handler**

```typescript
case "resume": {
  if (this.pausedRemainingMs != null && this.pausedRemainingMs > 0) {
    this.state.timerEnd = Date.now() + this.pausedRemainingMs;
    this.pausedRemainingMs = null;
    this.startTimer();
  }
  break;
}
```

**Step 4: Clear pausedRemainingMs on phase transitions**

In `handleHostAction`, at the start of `startRound`, `startDesign`, `startDemo`, `endGame`, add:
```typescript
this.pausedRemainingMs = null;
```

**Step 5: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 6: Commit**

```bash
git add party/index.ts
git commit -m "fix: pause/resume preserves remaining time correctly"
```

---

## Task 7: Team Management — Strict 2-Player, Kick, Exit, Roster Lock

**Files:**
- Modify: `party/gameState.ts`
- Modify: `party/index.ts`
- Modify: `components/HostView.tsx`
- Modify: `components/PlayerView.tsx`
- Modify: `components/GameHeader.tsx`
- Modify: `app/page.tsx`

**Step 1: Remove rebalanceTeams from gameState.ts**

Delete the entire `rebalanceTeams()` function and its call sites in `startRound()` and `startDesign()`. With strict 2-player teams, we don't rebalance.

Update `addPlayer()` to use `MAX_TEAM_SIZE` directly (since PREFERRED_TEAM_SIZE is removed):
```typescript
let teamId = Object.keys(state.teams).find(
  (tid) => state.teams[tid].players.length < MAX_TEAM_SIZE
);
```

Remove the `PREFERRED_TEAM_SIZE` import.

**Step 2: Add kickPlayer function to gameState.ts**

```typescript
export function kickPlayer(state: RoomState, playerId: string): boolean {
  const player = state.players[playerId];
  if (!player) return false;

  const team = state.teams[player.teamId];
  if (team) {
    team.players = team.players.filter(pid => pid !== playerId);

    // If team is now empty, remove it
    if (team.players.length === 0) {
      delete state.teams[player.teamId];
    } else {
      // Promote next player to architect if needed
      const hasArchitect = team.players.some(pid =>
        state.players[pid]?.role === "architect" && state.players[pid]?.connected
      );
      if (!hasArchitect && team.players.length > 0) {
        const nextPlayer = team.players.find(pid => state.players[pid]?.connected);
        if (nextPlayer) state.players[nextPlayer].role = "architect";
      }
    }
  }

  delete state.players[playerId];
  return true;
}
```

**Step 3: Handle kickPlayer and leaveGame in party/index.ts**

Import `kickPlayer` from gameState.

Add to `handleHostAction`:
```typescript
case "kickPlayer": {
  // msg has targetPlayerId via the ClientMessage union update
  // We need to pass it through — update the handleHostAction signature
  break;
}
```

Actually, since hostAction passes through `msg.action` as a string, we need to handle the targetPlayerId differently. Update the `onMessage` hostAction case:

```typescript
case "hostAction": {
  if (sender.id !== this.hostId) {
    this.send(sender, { type: "error", message: "Not authorized" });
    return;
  }
  if (msg.action === "kickPlayer" && msg.targetPlayerId) {
    const targetConn = this.room.getConnection(msg.targetPlayerId);
    if (targetConn) {
      this.send(targetConn, { type: "kicked", message: "You've been removed by the host" });
    }
    kickPlayer(this.state, msg.targetPlayerId);
    this.broadcastState();
  } else {
    this.handleHostAction(msg.action);
  }
  break;
}
```

Add `leaveGame` handling:
```typescript
case "leaveGame": {
  const player = this.state.players[sender.id];
  if (!player) return;
  removePlayer(this.state, sender.id);
  // Also fully delete them (not just disconnect)
  delete this.state.players[sender.id];
  const team = this.state.teams[player.teamId];
  if (team && team.players.length === 0) {
    delete this.state.teams[player.teamId];
  }
  this.broadcastState();
  break;
}
```

**Step 4: Lock team rosters after round 1 starts**

In `party/gameState.ts`, remove the `rebalanceTeams(state)` call from `startRound()`. Teams are set when the game starts and don't change mid-session. The role-swapping logic in `startRound()` for round 2 stays.

**Step 5: Add kick button to host lobby view**

In `components/HostView.tsx`, in the `PlayerPip` component or wherever players are listed in the lobby, add an X button:

```tsx
{phase === "lobby" && (
  <button
    onClick={() => send({
      type: "hostAction",
      action: "kickPlayer",
      targetPlayerId: player.id,
    })}
    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ember/80 text-warm-white text-xs flex items-center justify-center hover:bg-ember"
    aria-label={`Remove ${player.name}`}
  >
    ×
  </button>
)}
```

**Step 6: Add odd-player warning and disable start buttons on host**

In `components/HostView.tsx`, in the LobbyView, add a warning:

```tsx
const connectedCount = Object.values(state.players).filter(p => p.connected && !p.id).length;
// Actually count all non-host connected players
const playerCount = Object.values(state.players).filter(p => p.connected).length;
const isOdd = playerCount % 2 !== 0;
```

Render warning if odd:
```tsx
{isOdd && playerCount > 0 && (
  <div className="bg-[#b89f65]/20 border border-[#b89f65]/40 rounded px-4 py-2 text-center">
    <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-[#8b5e3c]">
      Odd number of players ({playerCount}) — one player won't have a partner.
      Remove a player or wait for one more.
    </span>
  </div>
)}
```

Pass `disabled` prop to HostControls when odd:
```tsx
<HostControls phase={state.phase} send={send} hasDesigns={...} disabled={isOdd && playerCount > 0} />
```

In `HostControls.tsx`, accept `disabled?: boolean` prop and disable start buttons:
```tsx
{phase === "lobby" && (
  <>
    <HostButton label="Practice Round" action="startDemo" send={send} variant="secondary" />
    {hasDesigns ? (
      <HostButton label="Start Round 1" action="startRound" send={send} variant="primary" disabled={disabled} />
    ) : (
      <HostButton label="Start Design Phase" action="startDesign" send={send} variant="primary" disabled={disabled} />
    )}
  </>
)}
```

Add `disabled` to `HostButton`:
```tsx
function HostButton({ label, action, send, variant = "primary", disabled = false }) {
  return (
    <motion.button
      onClick={() => !disabled && send({ type: "hostAction", action })}
      disabled={disabled}
      className={[
        // ...existing classes...
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
      // ...
    >
```

**Step 7: Add exit button to GameHeader**

In `components/GameHeader.tsx`, accept a new prop `onExit`:

```tsx
interface GameHeaderProps {
  phase: GamePhase;
  teamName?: string;
  role?: "architect" | "builder";
  timerEnd?: number | null;
  onExit?: () => void;
}
```

Add exit icon in the header bar (right side, before timer):
```tsx
{onExit && (
  <button
    onClick={onExit}
    className={`p-1.5 rounded ${isRound2 ? "text-[#e8e0d0]/50 hover:text-[#e8e0d0]" : "text-[#2a2520]/40 hover:text-[#2a2520]"} transition-colors`}
    aria-label="Leave game"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
)}
```

**Step 8: Add exit confirmation and handling in PlayerView**

In `components/PlayerView.tsx`, add exit state and handler:

```typescript
const [showExitConfirm, setShowExitConfirm] = useState(false);

const handleExit = useCallback(() => {
  setShowExitConfirm(true);
}, []);

const handleExitConfirm = useCallback(() => {
  send({ type: "leaveGame" });
  window.location.href = "/";
}, [send]);
```

Add exit confirmation overlay (render at top level of each phase return):
```tsx
{showExitConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-[#f0ebe0] rounded-xl p-6 mx-6 text-center space-y-4">
      <p className="font-[family-name:var(--font-pixel)] text-[12px] text-[#2a2520]">
        Leave this game?
      </p>
      <p className="font-[family-name:var(--font-body)] text-sm text-[#2a2520]/60">
        You won't be able to rejoin.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setShowExitConfirm(false)}
          className="px-4 py-2 rounded font-[family-name:var(--font-pixel)] text-[9px] tracking-wider bg-[#e8e0d0] text-[#2a2520] hover:bg-[#d4cfc4]"
        >
          Stay
        </button>
        <button
          onClick={handleExitConfirm}
          className="px-4 py-2 rounded font-[family-name:var(--font-pixel)] text-[9px] tracking-wider bg-ember text-warm-white hover:bg-rust"
        >
          Leave
        </button>
      </div>
    </div>
  </div>
)}
```

Pass `onExit={handleExit}` to every `<GameHeader>` instance.

**Step 9: Handle kicked message in play page**

In the play page component (likely `app/play/[code]/page.tsx`), listen for `kicked` messages and redirect:
```typescript
if (msg.type === "kicked") {
  window.location.href = "/?kicked=true";
}
```

In `app/page.tsx`, show a message if `?kicked=true` is in the URL:
```tsx
const searchParams = useSearchParams();
const wasKicked = searchParams.get("kicked") === "true";

// In render:
{wasKicked && (
  <div className="bg-ember/10 border border-ember/30 rounded px-4 py-2 text-center mb-4">
    <span className="font-[family-name:var(--font-pixel)] text-[9px] text-ember">
      You were removed from the game by the host.
    </span>
  </div>
)}
```

**Step 10: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 11: Commit**

```bash
git add party/gameState.ts party/index.ts components/HostView.tsx components/HostControls.tsx components/PlayerView.tsx components/GameHeader.tsx app/page.tsx
git commit -m "feat: strict 2-player teams, host kick, player exit, odd warning"
```

---

## Task 8: Chat in Design Phase

Enable the chat panel during the design phase.

**Files:**
- Modify: `components/PlayerView.tsx`

**Step 1: Update showChat condition**

In `PlayerView.tsx`, find:
```typescript
const showChat = phase === "round1" || phase === "round2";
```

Change to:
```typescript
const showChat = phase === "round1" || phase === "round2" || phase === "design";
```

**Step 2: Add chat to design phase render**

Currently the design phase renders without a chat panel. Update the design phase return block to include chat:

```tsx
if (isDesign) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f0ebe0]">
      {showExitConfirm && (/* exit overlay */)}
      <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} onExit={handleExit} />
      {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={false} />}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 min-w-0 p-3 gap-2">
          <div className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center py-1 px-2 rounded text-[#8b5e3c]/70 bg-[#8b5e3c]/10">
            Design your building! Another team will try to recreate it.
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {teamGrid ? (
              <VoxelGrid grid={teamGrid} onCellClick={handleCellClick} selectedBlock={selectedBlock} readOnly={false} newCells={newCells} className="w-full h-full max-h-[45vh] md:max-h-full" />
            ) : (
              <div className="font-[family-name:var(--font-pixel)] text-[10px] text-[#2a2520]/40">Loading...</div>
            )}
          </div>
          <div className="shrink-0">
            <BlockPalette selected={selectedBlock} onSelect={setSelectedBlock} />
          </div>
        </div>
        {/* Chat panel for design coordination */}
        <div className="shrink-0 h-48 md:h-auto md:w-80 p-3 pt-0 md:pt-3">
          <ChatPanel
            messages={messages}
            onSend={handleSendChat}
            isRound2={false}
            disabled={false}
            teamName={teamName}
            isAIThinking={false}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 4: Commit**

```bash
git add components/PlayerView.tsx
git commit -m "feat: enable chat in design phase for team coordination"
```

---

## Task 9: Scout AI Overhaul

Major improvements to Scout's system prompt, action logging, undo support, and response quality.

**Files:**
- Modify: `lib/aiPrompt.ts`
- Modify: `app/api/ai/chat/route.ts`
- Modify: `party/index.ts`
- Modify: `party/gameState.ts`

**Step 1: Add action log to team state**

In `lib/types.ts`, add to the Team interface:
```typescript
export interface Team {
  // ...existing fields...
  aiActionLog: { row: number; col: number; block: BlockType; timestamp: number }[];
}
```

In `party/gameState.ts`, initialize in `addPlayer()` where teams are created:
```typescript
aiActionLog: [],
```

And in `resetToLobby()`, clear it:
```typescript
team.aiActionLog = [];
```

**Step 2: Track AI actions in party/index.ts**

In the HTTP `onRequest` handler where AI build actions are applied, add logging:

After the `placeBlock()` loop (around line 218-226):
```typescript
// Log AI actions for undo support
const team = this.state.teams[teamId];
if (team) {
  for (const action of actions) {
    team.aiActionLog.push({
      row: action.row,
      col: action.col,
      block: action.block as BlockType,
      timestamp: Date.now(),
    });
    // Keep only last 10
    if (team.aiActionLog.length > 10) {
      team.aiActionLog = team.aiActionLog.slice(-10);
    }
  }
}
```

**Step 3: Pass action log to AI endpoint**

In `components/PlayerView.tsx`, update the AI chat request body:
```typescript
body: JSON.stringify({
  text,
  roomCode: state.code,
  teamId,
  playerId,
  targetGrid: team?.roundTarget ?? state.currentTarget,
  aiActionLog: team?.aiActionLog ?? [],
}),
```

In `app/api/ai/chat/route.ts`, receive and pass to prompt:
```typescript
const { roomCode, teamId, text, playerId, history, teamGrid, targetGrid: clientTarget, aiActionLog } = await req.json();
```

**Step 4: Overhaul the system prompt**

In `lib/aiPrompt.ts`, rewrite `buildSystemPrompt()`:

```typescript
export function buildSystemPrompt(target: Grid, round: 1 | 2, aiActionLog?: { row: number; col: number; block: string }[]): string {
  const targets = round === 1 ? ROUND_1_TARGETS : ROUND_2_TARGETS;
  const descriptions = round === 1 ? ROUND_1_DESCRIPTIONS : ROUND_2_DESCRIPTIONS;
  const idx = targets.findIndex(t => JSON.stringify(t) === JSON.stringify(target));
  const desc = idx >= 0
    ? descriptions[idx]
    : "This is a custom player-designed structure. Study the grid data below to understand its layout and guide the team in recreating it accurately.";

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
      gridStr += `\nLayer ${h} (ground=${h === 0 ? "yes" : "no"}): ${layerCells.join(" ")}`;
    }
  }

  let actionLogStr = "";
  if (aiActionLog && aiActionLog.length > 0) {
    actionLogStr = `\n\n## Recent Build Actions (last ${aiActionLog.length})\n`;
    actionLogStr += aiActionLog.map((a, i) =>
      `${i + 1}. ${colToLetter(a.col)}${rowToNumber(a.row)}: ${a.block}`
    ).join("\n");
    actionLogStr += "\nPlayers may ask you to undo recent actions. To undo, place 'empty' at those coordinates.";
  }

  return `You are Scout, an AI construction robot assistant for the "Blueprint Telephone" game by 500 Acres.

You are helping a team build a structure using Skylark 250-inspired blocks on a ${GRID_SIZE}x${GRID_SIZE} isometric grid with up to ${MAX_HEIGHT} layers.

## The Target Structure
${desc}

## Grid Coordinate System
The grid uses chess-style notation: columns A-${colToLetter(GRID_SIZE - 1)} (left to right) and rows 1-${GRID_SIZE} (back to front).
- A1 is the back-left corner
- ${colToLetter(GRID_SIZE - 1)}${GRID_SIZE} is the front-right corner
- Always use this notation when communicating with the team (e.g., "B3", "D1")

Grid data by layer — chess notation:blockType (only non-empty cells):
${gridStr}

## Block Types Available
- wall: Brown wall block (exterior/interior walls)
- floor: Light stone floor (ground, paths, platforms)
- roof: Green slanted roof with shingle details (top of buildings)
- window: Gold semi-transparent window with glass pattern (walls with glass)
- door: Reddish door — auto-stacks 2 blocks high (building entrances)
- plant: Green leafy plant (gardens, landscaping)
- table: Oak wooden table (interior furniture)
- metal: Steel/iron block (workshops, industrial structures)
- concrete: Gray concrete (foundations, garages, utility)
- barrel: Wooden barrel (storage, workshops)
- pipe: Steel pipe (plumbing, industrial detail)
- air: Invisible scaffolding — takes up space but doesn't render. Use to elevate blocks.
- empty: Removes topmost block at that position
${actionLogStr}

## Your Capabilities & Rules

**CRITICAL — Always build when asked:**
When a player asks you to build, place, or construct ANYTHING, you MUST include <actions> tags with block placements. Never respond with just text when building is requested. If the request is ambiguous, place your best interpretation AND ask what to adjust.

**CRITICAL — Never show code or JSON to players:**
Your text responses must be natural, friendly language only. Never include raw JSON, arrays, coordinates in code format, or technical output. The <actions> tags are parsed by the system and never shown to players.

**Intent Detection:**
Determine what the player wants:
- BUILD: Place blocks. Always include <actions>.
- DESCRIBE: Explain the target structure using chess notation.
- FIX: Adjust existing blocks. Include <actions> to fix.
- UNDO: Reverse recent actions. Place "empty" at those positions via <actions>.
- QUESTION: Answer about the game, blocks, or strategy.

**High-level commands:**
When asked to "build a house" or "make a glass tower" etc., interpret creatively:
- Generate a reasonable multi-block structure
- Use appropriate block types
- Place it in a logical position on the grid
- Describe what you built

To place blocks, include a JSON array wrapped in <actions> tags:
<actions>[{"row":0,"col":0,"block":"wall"},{"row":0,"col":1,"block":"wall"}]</actions>

In <actions>, row and col are 0-indexed integers. In your TEXT to players, always use chess notation (A1, B3, etc.).

## Important Notes
- Doors auto-stack 2 blocks high. One door action creates both blocks.
- Keep text SHORT (1-3 sentences) — this is a timed game!
- Be enthusiastic, encouraging, and clear
- When asked to undo, check the Recent Build Actions list and place "empty" at those coordinates
- You are a friendly robot construction assistant — warm but efficient`;
}
```

**Step 5: Update buildSystemPrompt call in route.ts**

```typescript
let systemPrompt = buildSystemPrompt(target, 2, aiActionLog);
```

**Step 6: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 7: Commit**

```bash
git add lib/aiPrompt.ts lib/types.ts app/api/ai/chat/route.ts party/index.ts party/gameState.ts components/PlayerView.tsx
git commit -m "feat: overhaul Scout AI — chess notation, always build, undo support"
```

---

## Task 10: Step-by-Step Walkthrough Tutorial

Replace the auto-dismiss overlay with a multi-slide walkthrough.

**Files:**
- Modify: `components/TutorialOverlay.tsx`
- Modify: `components/PlayerView.tsx`

**Step 1: Rewrite TutorialOverlay as multi-slide walkthrough**

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WalkthroughSlide {
  icon: string;
  title: string;
  body: string;
}

interface TutorialOverlayProps {
  role: "architect" | "builder";
  isRound2: boolean;
  isDesign?: boolean;
  onDismiss: () => void;
}

function getSlides(role: "architect" | "builder", isRound2: boolean, isDesign: boolean): WalkthroughSlide[] {
  if (isDesign) {
    return [
      { icon: "🏗", title: "Design Phase!", body: "Your team will design a building for another team to recreate." },
      { icon: "🤝", title: "Build Together", body: "Everyone on your team can place blocks. Use chat to coordinate!" },
      { icon: "⏱", title: "Go!", body: "You have 2 minutes. Make it creative!" },
    ];
  }

  if (isRound2) {
    return [
      { icon: "🔄", title: `You're the ${role === "architect" ? "Architect" : "Builder"}!`,
        body: role === "architect"
          ? "You can see the target. Guide your team and Scout to recreate it."
          : "Place blocks on the grid. Your Architect and Scout will guide you." },
      { icon: "🤖", title: "Meet Scout", body: "Scout is your AI robot assistant. It can describe the target, place blocks, and answer questions." },
      { icon: "💬", title: "Try These Prompts",
        body: role === "architect"
          ? '"Scout, describe the whole building" · "Scout, build the ground floor" · "Fix the roof at D3"'
          : '"Scout, build a row of walls from A1 to F1" · "Scout, what goes at B3?" · "Scout, undo the last 2 changes"' },
      { icon: "⏱", title: "Go!", body: "3 minutes on the clock. Work together!" },
    ];
  }

  // Round 1
  return [
    { icon: role === "architect" ? "👁" : "🔨", title: `You're the ${role === "architect" ? "Architect" : "Builder"}!`,
      body: role === "architect"
        ? "Only you can see the target structure. Describe it to your Builder using chat."
        : "You'll place blocks on the grid. Your Architect will tell you what to build via chat." },
    { icon: "🧱", title: "How to Build", body: "Tap a block type from the palette below, then tap a grid tile to place it. Use coordinates like B3 to communicate." },
    { icon: "💬", title: "Communication is Key",
      body: role === "architect"
        ? "Use chess notation (A1, B3) to give precise directions. Start with the foundation!"
        : "Ask your Architect where to start. Confirm block types and positions." },
    { icon: "⏱", title: "Go!", body: "3 minutes on the clock. Good luck!" },
  ];
}

export default function TutorialOverlay({ role, isRound2, isDesign = false, onDismiss }: TutorialOverlayProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = getSlides(role, isRound2, isDesign);
  const isLast = slideIndex === slides.length - 1;
  const slide = slides[slideIndex];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${isRound2 ? "bg-[#1a1510]/90" : "bg-[#2a2520]/85"}`} />

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slideIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex flex-col items-center gap-4 px-8 max-w-sm text-center"
        >
          <span className="text-4xl">{slide.icon}</span>
          <h2 className={`font-[family-name:var(--font-pixel)] text-[14px] tracking-wider ${
            isRound2 ? "text-[#6b8f71]" : "text-[#b89f65]"
          }`}>
            {slide.title}
          </h2>
          <p className={`font-[family-name:var(--font-body)] text-sm leading-relaxed ${
            isRound2 ? "text-[#e8e0d0]/80" : "text-[#e8e0d0]/90"
          }`}>
            {slide.body}
          </p>

          {/* Progress dots */}
          <div className="flex gap-2 mt-2">
            {slides.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${
                i === slideIndex
                  ? (isRound2 ? "bg-[#6b8f71]" : "bg-[#b89f65]")
                  : "bg-white/20"
              }`} />
            ))}
          </div>

          {/* Button */}
          <button
            onClick={() => isLast ? onDismiss() : setSlideIndex(s => s + 1)}
            className={`mt-2 px-6 py-2.5 rounded font-[family-name:var(--font-pixel)] text-[10px] tracking-wider uppercase ${
              isRound2
                ? "bg-[#3d6b4f] text-[#e8e0d0] hover:bg-[#4a8060]"
                : "bg-[#8b5e3c] text-[#e8e0d0] hover:bg-[#a06a42]"
            }`}
          >
            {isLast ? "Let's Go!" : "Next"}
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
```

**Step 2: Update PlayerView to pass isDesign to TutorialOverlay**

Update the tutorial trigger to also fire for design phase:
```typescript
useEffect(() => {
  if ((isPlaying || isDesign) && !sessionStorage.getItem(`tutorialSeen-${phase}`)) {
    setShowTutorial(true);
    sessionStorage.setItem(`tutorialSeen-${phase}`, "true");
  }
}, [isPlaying, isDesign, phase]);
```

Update the overlay rendering:
```tsx
{showTutorial && role && (
  <TutorialOverlay
    role={role}
    isRound2={isRound2}
    isDesign={isDesign}
    onDismiss={() => setShowTutorial(false)}
  />
)}
```

Make sure the tutorial shows in the design phase return block too (not just the active round block).

**Step 3: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 4: Commit**

```bash
git add components/TutorialOverlay.tsx components/PlayerView.tsx
git commit -m "feat: replace auto-dismiss tutorial with step-by-step walkthrough"
```

---

## Task 11: Block Type Legend

Add an info panel showing all block types.

**Files:**
- Modify: `components/BlockPalette.tsx`

**Step 1: Add legend overlay component**

Add a `BlockLegend` component inside BlockPalette.tsx:

```tsx
function BlockLegend({ onClose }: { onClose: () => void }) {
  const blocks: { type: BlockType; desc: string }[] = [
    { type: "wall", desc: "Walls & structure" },
    { type: "floor", desc: "Ground & paths" },
    { type: "roof", desc: "Building tops" },
    { type: "window", desc: "Glass windows" },
    { type: "door", desc: "Entrances (2-high)" },
    { type: "plant", desc: "Landscaping" },
    { type: "table", desc: "Furniture" },
    { type: "metal", desc: "Industrial surfaces" },
    { type: "concrete", desc: "Foundations" },
    { type: "barrel", desc: "Storage drums" },
    { type: "pipe", desc: "Plumbing & pipes" },
    { type: "air", desc: "Invisible scaffold" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full mb-2 left-0 right-0 bg-[#4a3728] rounded-xl p-3 shadow-lg z-20"
      onClick={onClose}
    >
      <p className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#b89f65] mb-2 text-center">
        Block Types
      </p>
      <div className="grid grid-cols-3 gap-2">
        {blocks.map(({ type, desc }) => (
          <div key={type} className="flex items-center gap-1.5">
            <MiniBlock color={BLOCK_COLORS[type]} />
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-[#e8e0d0]">
                {BLOCK_LABELS[type]}
              </span>
              <span className="font-[family-name:var(--font-body)] text-[8px] text-[#e8e0d0]/50 leading-tight">
                {desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
```

**Step 2: Add "?" button and toggle to BlockPalette**

```tsx
export default function BlockPalette({ selected, onSelect }: BlockPaletteProps) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {showLegend && <BlockLegend onClose={() => setShowLegend(false)} />}
      </AnimatePresence>
      <div className="bg-[#4a3728]/90 rounded-xl backdrop-blur-sm px-3 py-2 overflow-x-auto" ...>
        <div className="flex flex-row gap-1 items-center justify-start min-w-max">
          {/* Info button */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-[#b89f65]/20 text-[#b89f65] text-xs font-bold shrink-0"
            aria-label="Block type reference"
          >
            ?
          </button>
          {BLOCK_ORDER.map((blockType) => (/* existing rendering */))}
        </div>
      </div>
    </div>
  );
}
```

Add `useState` and `AnimatePresence` to imports.

**Step 3: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`

**Step 4: Commit**

```bash
git add components/BlockPalette.tsx
git commit -m "feat: add block type legend overlay with ? button"
```

---

## Task 12: Redesign Targets for 6x6x6

Create 8 new target structures for the 6x6 grid with 6 height layers.

**Files:**
- Modify: `lib/targets.ts`

**Step 1: Update the character map in parse3DTarget**

Add new block type characters:
```typescript
const charMap: Record<string, BlockType> = {
  ".": "empty",
  W: "wall",
  F: "floor",
  R: "roof",
  N: "window",
  D: "door",
  P: "plant",
  T: "table",
  M: "metal",
  C: "concrete",
  B: "barrel",
  I: "pipe",   // I for industrial pipe
};
```

**Step 2: Redesign Round 1 targets (4 targets, 6x6 grid)**

Replace all existing Round 1 targets. Each uses a 6-char-wide string per row, 6 rows per layer.

Example structure for COTTAGE (simple cabin):
```typescript
const COTTAGE = parse3DTarget([
  // Layer 0 (ground)
  [
    "......",
    ".WDWW.",
    ".W..W.",
    ".W..W.",
    ".WWWW.",
    "......",
  ],
  // Layer 1
  [
    "......",
    ".WNWW.",
    ".W..W.",
    ".W..W.",
    ".WWNW.",
    "......",
  ],
  // Layer 2 (roof)
  [
    "......",
    ".RRRR.",
    ".RRRR.",
    ".RRRR.",
    ".RRRR.",
    "......",
  ],
]);
```

Design 4 Round 1 targets:
1. **COTTAGE**: Simple 4x4 cabin with door, windows, roof. ~30 blocks.
2. **GARDEN_SHED**: Small 3x3 shed with barrel outside, plants. ~25 blocks.
3. **WORKSHOP**: Uses metal + concrete + pipe. Industrial feel. ~35 blocks.
4. **WATCHTOWER**: Tall 2x2 tower using 4+ layers. ~30 blocks.

Design 4 Round 2 targets (more complex):
1. **FACTORY**: Large L-shape with metal, pipe, barrel. ~50 blocks.
2. **TWO_STORY**: Full 2-story house with interior detail. ~55 blocks.
3. **MARKET**: Open-air market with tables, roof canopy, plants. ~45 blocks.
4. **FORTRESS**: Walls with corner towers, windows. ~50 blocks.

**Step 3: Write descriptions for all 8 targets**

Each description should help Scout communicate about the structure. Include key features, dimensions, and notable block placements.

**Step 4: Update exports**

```typescript
export const ROUND_1_TARGETS: Grid[] = [COTTAGE, GARDEN_SHED, WORKSHOP, WATCHTOWER];
export const ROUND_1_DESCRIPTIONS: string[] = [/* ... */];
export const ROUND_2_TARGETS: Grid[] = [FACTORY, TWO_STORY, MARKET, FORTRESS];
export const ROUND_2_DESCRIPTIONS: string[] = [/* ... */];
```

Keep backward-compat exports and `pickRandomTarget()` — they'll reference the new arrays.

**Step 5: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`
Run: `npx jest --testPathIgnorePatterns=simulate-game` (scoring tests should still pass with new grid dimensions)

**Step 6: Commit**

```bash
git add lib/targets.ts
git commit -m "feat: redesign all 8 targets for 6x6x6 grid with new block types"
```

---

## Task 13: Final Verification & Deploy

**Step 1: Type check**

Run: `npx tsc --noEmit 2>&1 | grep -v simulate-game`
Expected: No errors

**Step 2: Run tests**

Run: `npx jest --testPathIgnorePatterns=simulate-game`
Expected: All pass. If scoring tests fail due to grid size changes, update test fixtures.

**Step 3: Production build**

Run: `npx next build`
Expected: Successful build

**Step 4: Deploy**

```bash
npx vercel --prod --yes
npx partykit deploy
```

**Step 5: Manual verification checklist**

- [ ] 6x6 grid renders correctly with axis labels (A-F, 1-6)
- [ ] All 13 block types appear in palette and render as sprites
- [ ] Palette scrolls horizontally on small screens
- [ ] Block legend "?" button shows overlay
- [ ] Design phase: 2 min timer, all players build, chat works
- [ ] Design → lobby → "Start Round 1" button (no auto-start)
- [ ] Round 1: 3 min timer, architect sees target, builder builds
- [ ] Walkthrough slides appear before each phase (must tap through)
- [ ] Round 2: Scout uses chess notation (A1-F6)
- [ ] Scout builds when asked ("Scout, build a row of walls")
- [ ] Scout doesn't output raw JSON in chat
- [ ] Scout handles undo ("Scout, undo last 3 changes")
- [ ] Pause button works correctly (time doesn't expire during pause)
- [ ] Strict 2-player teams (odd count shows warning, blocks start)
- [ ] Host can kick players in lobby
- [ ] Players can exit with confirmation dialog
- [ ] Clicking tall stacks targets the right column
- [ ] Targets render correctly at 6x6x6 dimensions
- [ ] Team info bar visible throughout all phases

**Step 6: Final commit**

```bash
git add -A
git commit -m "fix: test fixture updates for 6x6x6 grid"
```
