# Blueprint Telephone — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 17-minute Jackbox-style multiplayer game where teams build isometric structures, demonstrating the power of AI-assisted communication for the 500 Acres forum on Friday Feb 27.

**Architecture:** Next.js 15 App Router with Partykit for real-time WebSocket rooms. Claude Sonnet 4.6 as AI co-builder. Isometric 2.5D grid via CSS transforms. No database — in-memory game state on Partykit server.

**Tech Stack:** Next.js 15, Partykit, Anthropic SDK, Tailwind CSS 4, Framer Motion, TypeScript

**Design Preferences:** Use `frontend-design` skill for all UI components — SimCity pixel aesthetic, warm/homey, polished animations. Use web testing skill at QA checkpoints.

**Design Doc:** `docs/plans/2026-02-23-blueprint-telephone-design.md`

---

## Dependency Graph

```
Task 1 (Scaffold) ──→ Task 2 (Types) ──┬──→ Task 3 (Partykit Server)
                                        ├──→ Task 4 (Isometric Grid)
                                        ├──→ Task 5 (Block Palette)
                                        ├──→ Task 6 (Chat Component)
                                        └──→ Task 11 (Scoring Engine)

Task 3 ──┬──→ Task 7 (Lobby & Join)
         ├──→ Task 9 (Host View)
         └──→ Task 10 (AI Integration)

Tasks 4,5,6 ──→ Task 8 (Player Game View)

Tasks 4,11 ──→ Task 12 (Reveal System)

Tasks 8,9,12 ──→ Task 13 (Visual Polish)

Everything ──→ Task 14 (Deploy & QA)
```

**Parallel lanes:**
- Lane A: Tasks 1→2→3→7→9 (server + host)
- Lane B: Tasks 1→2→4→5→8 (grid + player UI)
- Lane C: Tasks 1→2→6→10 (chat + AI)
- Lane D: Tasks 1→2→11→12 (scoring + reveal)
- Lane E: Task 13 (polish, after lanes A-D merge)
- Lane F: Task 14 (deploy)

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `partykit.json`
- Create: `.env.local`
- Create: `.gitignore`
- Create: `vercel.json`

**Step 1: Initialize Next.js project**

Run from `/Users/camsteinberg/Reimagining-Belonging/GenZvsRobots`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Select defaults. This creates the base Next.js 15 app with App Router.

**Step 2: Install dependencies**

```bash
npm install partykit partysocket @anthropic-ai/sdk framer-motion
npm install -D @types/node
```

**Step 3: Configure Tailwind with 500 Acres palette**

Replace `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-cream: #e8e0d0;
  --color-warm-white: #f5f1ea;
  --color-rust: #8b5e3c;
  --color-gold: #b89f65;
  --color-charcoal: #2a2520;
  --color-forest: #3d6b4f;
  --color-navy: #3a5a6e;
  --color-sage: #6b8f71;
  --color-moss: #365f45;
  --color-clay: #b8755d;
  --color-amber: #d4a84b;
  --color-ember: #c45d3e;
  --color-bark: #4a3728;

  --font-display: "Playfair Display", serif;
  --font-body: "Inter", sans-serif;
  --font-serif: "EB Garamond", serif;
  --font-pixel: "Press Start 2P", monospace;
}

@layer base {
  body {
    @apply bg-cream text-charcoal font-body antialiased;
  }
}
```

**Step 4: Update `app/layout.tsx` with fonts**

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter, EB_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blueprint Telephone | 500 Acres",
  description: "Can Gen Z build with robots? A live multiplayer building game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${garamond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Step 5: Create Partykit config**

Create `partykit.json`:

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "blueprint-telephone",
  "main": "party/index.ts",
  "compatibilityDate": "2024-09-01"
}
```

**Step 6: Create environment file**

Create `.env.local`:

```
ANTHROPIC_API_KEY=your-key-here
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999
```

**Step 7: Create `.gitignore`**

```
node_modules/
.next/
.env.local
.env*.local
dist/
.partykit/
```

**Step 8: Create `vercel.json`**

```json
{
  "rewrites": [
    { "source": "/((?!api|_next|favicon).*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

**Step 9: Verify it runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000

**Step 10: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind and Partykit config"
```

---

### Task 2: Shared Types & Game Constants

**Files:**
- Create: `lib/types.ts`
- Create: `lib/constants.ts`
- Create: `lib/targets.ts`

**Step 1: Create shared types**

Create `lib/types.ts`:

```typescript
// === Block Types ===
export type BlockType = "wall" | "floor" | "roof" | "window" | "door" | "empty";

// === Grid ===
export type Cell = BlockType;
export type Grid = Cell[][]; // 8x8, grid[row][col]

// === Players ===
export type Role = "architect" | "builder";

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: Role;
  connected: boolean;
}

// === Teams ===
export interface Team {
  id: string;
  name: string;
  players: string[]; // player IDs
  grid: Grid;
  round1Grid: Grid | null; // snapshot after round 1
  round1Score: number | null;
  round2Score: number | null;
}

// === Game Phases ===
export type GamePhase =
  | "lobby"
  | "round1"
  | "reveal1"
  | "interstitial"
  | "round2"
  | "finalReveal"
  | "summary";

// === Room State (server-side, synced to clients) ===
export interface RoomState {
  code: string;
  phase: GamePhase;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  currentTarget: Grid | null;
  round: 1 | 2;
  timerEnd: number | null; // unix timestamp
  hostConnected: boolean;
}

// === WebSocket Messages ===
export type ClientMessage =
  | { type: "join"; name: string; isHost?: boolean }
  | { type: "placeBlock"; row: number; col: number; block: BlockType }
  | { type: "chat"; text: string }
  | { type: "hostAction"; action: HostAction }
  | { type: "aiChat"; text: string };

export type HostAction =
  | "startRound"
  | "pause"
  | "resume"
  | "skipToReveal"
  | "nextReveal"
  | "prevReveal"
  | "endGame";

export type ServerMessage =
  | { type: "state"; state: RoomState }
  | { type: "gridUpdate"; teamId: string; row: number; col: number; block: BlockType }
  | { type: "chat"; teamId: string; senderId: string; senderName: string; text: string; isAI?: boolean }
  | { type: "aiBuilding"; teamId: string; actions: BuildAction[] }
  | { type: "timer"; timerEnd: number }
  | { type: "phaseChange"; phase: GamePhase }
  | { type: "error"; message: string }
  | { type: "playerJoined"; player: Player }
  | { type: "scores"; teams: { teamId: string; teamName: string; score: number; round: 1 | 2 }[] };

export interface BuildAction {
  row: number;
  col: number;
  block: BlockType;
}

// === AI Response (parsed from Claude) ===
export interface AIResponse {
  text: string;
  actions: BuildAction[];
}

// === Scoring ===
export interface CellResult {
  row: number;
  col: number;
  expected: BlockType;
  actual: BlockType;
  correct: boolean;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  round1Score: number;
  round2Score: number;
  improvement: number;
  cellResults: CellResult[];
}
```

**Step 2: Create game constants**

Create `lib/constants.ts`:

```typescript
import type { BlockType } from "./types";

export const GRID_SIZE = 8;
export const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const TEAM_NAMES = [
  "Cabin Crew", "The Framers", "Block Party", "Roof Raisers",
  "Team Timber", "The Builders", "CNC Squad", "Pod People",
];
export const MAX_TEAM_SIZE = 3;
export const MIN_TEAM_SIZE = 2;

export const BLOCK_COLORS: Record<BlockType, string> = {
  wall: "#8b5e3c",
  floor: "#e8e0d0",
  roof: "#3d6b4f",
  window: "#b89f65",
  door: "#b8755d",
  empty: "transparent",
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  wall: "Wall",
  floor: "Floor",
  roof: "Roof",
  window: "Window",
  door: "Door",
  empty: "Erase",
};

export function createEmptyGrid(): import("./types").Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "empty" as BlockType)
  );
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

**Step 3: Create target structures**

Create `lib/targets.ts`:

```typescript
import type { Grid, BlockType } from "./types";

// Helper: create grid from visual template
// W=wall, F=floor, R=roof, N=window, D=door, .=empty
function parseTarget(template: string[]): Grid {
  const charMap: Record<string, BlockType> = {
    "W": "wall", "F": "floor", "R": "roof",
    "N": "window", "D": "door", ".": "empty",
  };
  return template.map(row =>
    row.split("").map(ch => charMap[ch] || "empty")
  );
}

// Round 1: Simple L-shaped house (~18 blocks)
export const ROUND_1_TARGET: Grid = parseTarget([
  "RRRRR...",
  "WNWWN...",
  "WFFFW...",
  "WDFFW...",
  "WWWWWRR.",
  "....WNWW",
  "....WFFW",
  "....WWWW",
]);

// Round 2: Two-room house with detail (~28 blocks)
export const ROUND_2_TARGET: Grid = parseTarget([
  ".RRRRRR.",
  ".NWWNWN.",
  ".WFFWFFW",
  ".WFFWFFW",
  ".WFFDFFW",
  ".WFFWFFW",
  ".WDNWWWW",
  "..RRRR..",
]);

// Description for AI system prompt
export const ROUND_1_DESCRIPTION = `An L-shaped single-story house viewed from above on an 8x8 grid.
Main section (left): 5 columns wide, 4 rows tall. Roof across the top row.
Walls on the perimeter with windows at positions (1,0) and (1,4).
Door at (3,0). Interior filled with floor.
Wing (right): extends from row 4, 4 columns wide, 4 rows tall.
Roof at row 4 columns 5-6. Window at (5,4). Walls around perimeter. Floor inside.`;

export const ROUND_2_DESCRIPTION = `A larger two-room house viewed from above on an 8x8 grid.
Main rectangular shape roughly centered, 6 columns wide, spanning most rows.
Interior dividing wall creating two rooms (left and right).
Multiple windows on the facade. Doors on different walls for each room.
Roof sections at top and bottom. More complex than Round 1 with ~28 blocks total.`;
```

**Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add shared types, constants, and target structures"
```

---

### Task 3: Partykit Server — Room & State Management

**Files:**
- Create: `party/index.ts`
- Create: `party/gameState.ts`

**Step 1: Create game state manager**

Create `party/gameState.ts`:

```typescript
import type {
  RoomState, Player, Team, Grid, GamePhase, BlockType, Role,
} from "../lib/types";
import {
  createEmptyGrid, generateRoomCode, TEAM_NAMES, MAX_TEAM_SIZE, GRID_SIZE, ROUND_DURATION_MS,
} from "../lib/constants";
import { ROUND_1_TARGET, ROUND_2_TARGET } from "../lib/targets";

export function createRoomState(): RoomState {
  return {
    code: generateRoomCode(),
    phase: "lobby",
    players: {},
    teams: {},
    currentTarget: null,
    round: 1,
    timerEnd: null,
    hostConnected: false,
  };
}

export function addPlayer(state: RoomState, id: string, name: string): Player {
  // Find or create a team with space
  let teamId = Object.keys(state.teams).find(
    tid => state.teams[tid].players.length < MAX_TEAM_SIZE
  );

  if (!teamId) {
    teamId = `team-${Object.keys(state.teams).length}`;
    const teamIndex = Object.keys(state.teams).length;
    state.teams[teamId] = {
      id: teamId,
      name: TEAM_NAMES[teamIndex % TEAM_NAMES.length],
      players: [],
      grid: createEmptyGrid(),
      round1Grid: null,
      round1Score: null,
      round2Score: null,
    };
  }

  // Assign role: first player in team = architect, rest = builders
  const team = state.teams[teamId];
  const role: Role = team.players.length === 0 ? "architect" : "builder";

  const player: Player = { id, name, teamId, role, connected: true };
  state.players[id] = player;
  team.players.push(id);

  return player;
}

export function removePlayer(state: RoomState, id: string): void {
  const player = state.players[id];
  if (!player) return;
  player.connected = false;
}

export function startRound(state: RoomState): void {
  if (state.phase === "lobby" || state.phase === "reveal1" || state.phase === "interstitial") {
    const isRound2 = state.phase === "interstitial";
    state.round = isRound2 ? 2 : 1;
    state.phase = isRound2 ? "round2" : "round1";
    state.currentTarget = isRound2 ? ROUND_2_TARGET : ROUND_1_TARGET;
    state.timerEnd = Date.now() + ROUND_DURATION_MS;

    // Reset grids for the new round
    for (const team of Object.values(state.teams)) {
      // Save round 1 grid before resetting for round 2
      if (isRound2) {
        team.round1Grid = team.grid.map(row => [...row]);
      }
      team.grid = createEmptyGrid();
    }

    // Swap roles for round 2
    if (isRound2) {
      for (const player of Object.values(state.players)) {
        player.role = player.role === "architect" ? "builder" : "architect";
      }
    }
  }
}

export function endRound(state: RoomState): void {
  if (state.phase === "round1") {
    state.phase = "reveal1";
    state.timerEnd = null;
  } else if (state.phase === "round2") {
    state.phase = "finalReveal";
    state.timerEnd = null;
  }
}

export function advancePhase(state: RoomState): void {
  const transitions: Partial<Record<GamePhase, GamePhase>> = {
    reveal1: "interstitial",
    interstitial: "round2",
    finalReveal: "summary",
  };
  const next = transitions[state.phase];
  if (next) state.phase = next;
}

export function placeBlock(
  state: RoomState,
  teamId: string,
  row: number,
  col: number,
  block: BlockType
): boolean {
  const team = state.teams[teamId];
  if (!team) return false;
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  if (state.phase !== "round1" && state.phase !== "round2") return false;

  team.grid[row][col] = block;
  return true;
}

export function calculateScore(build: Grid, target: Grid): number {
  let correct = 0;
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Only count cells that have something in the target
      if (target[r][c] !== "empty") {
        total++;
        if (build[r][c] === target[r][c]) correct++;
      }
      // Penalize extra blocks not in target
      if (target[r][c] === "empty" && build[r][c] !== "empty") {
        total++;
        // correct stays the same (this cell is wrong)
      }
    }
  }

  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function calculateAllScores(state: RoomState): void {
  const target = state.currentTarget;
  if (!target) return;

  for (const team of Object.values(state.teams)) {
    if (state.round === 1) {
      team.round1Score = calculateScore(team.grid, target);
    } else {
      team.round2Score = calculateScore(team.grid, ROUND_2_TARGET);
    }
  }
}
```

**Step 2: Create Partykit server**

Create `party/index.ts`:

```typescript
import type * as Party from "partykit/server";
import type { ClientMessage, ServerMessage, RoomState } from "../lib/types";
import {
  createRoomState, addPlayer, removePlayer,
  startRound, endRound, advancePhase, placeBlock, calculateAllScores,
} from "./gameState";

export default class GameRoom implements Party.Server {
  state: RoomState;
  hostId: string | null = null;
  timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = createRoomState();
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current state to new connection
    this.send(conn, { type: "state", state: this.state });
  }

  onClose(conn: Party.Connection) {
    if (conn.id === this.hostId) {
      this.state.hostConnected = false;
    }
    removePlayer(this.state, conn.id);
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        if (msg.isHost) {
          this.hostId = sender.id;
          this.state.hostConnected = true;
        } else {
          const player = addPlayer(this.state, sender.id, msg.name);
          this.broadcast({
            type: "playerJoined",
            player,
          });
        }
        this.broadcastState();
        break;
      }

      case "placeBlock": {
        const player = this.state.players[sender.id];
        if (!player || player.role !== "builder") return;
        const placed = placeBlock(this.state, player.teamId, msg.row, msg.col, msg.block);
        if (placed) {
          this.broadcast({
            type: "gridUpdate",
            teamId: player.teamId,
            row: msg.row,
            col: msg.col,
            block: msg.block,
          });
        }
        break;
      }

      case "chat": {
        const chatPlayer = this.state.players[sender.id];
        if (!chatPlayer) return;
        this.broadcastToTeam(chatPlayer.teamId, {
          type: "chat",
          teamId: chatPlayer.teamId,
          senderId: chatPlayer.id,
          senderName: chatPlayer.name,
          text: msg.text,
        });
        // Also send to host for activity feed
        if (this.hostId) {
          const hostConn = this.room.getConnection(this.hostId);
          if (hostConn) {
            this.send(hostConn, {
              type: "chat",
              teamId: chatPlayer.teamId,
              senderId: chatPlayer.id,
              senderName: chatPlayer.name,
              text: msg.text,
            });
          }
        }
        break;
      }

      case "hostAction": {
        if (sender.id !== this.hostId) return;
        this.handleHostAction(msg.action);
        break;
      }

      case "aiChat": {
        // This is handled by the Next.js API route, which calls
        // back into the room via HTTP to broadcast AI responses.
        // Players send aiChat to the API route, not directly here.
        break;
      }
    }
  }

  // HTTP handler for AI responses to push into the room
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "POST") {
      const body = await req.json() as {
        type: "aiResponse";
        teamId: string;
        text: string;
        actions: { row: number; col: number; block: string }[];
      };

      if (body.type === "aiResponse") {
        // Apply build actions to grid
        for (const action of body.actions) {
          placeBlock(
            this.state,
            body.teamId,
            action.row,
            action.col,
            action.block as any
          );
        }

        // Broadcast AI chat message
        this.broadcastToTeam(body.teamId, {
          type: "chat",
          teamId: body.teamId,
          senderId: "scout",
          senderName: "Scout",
          text: body.text,
          isAI: true,
        });

        // Broadcast grid updates
        if (body.actions.length > 0) {
          this.broadcast({
            type: "aiBuilding",
            teamId: body.teamId,
            actions: body.actions as any,
          });
        }

        this.broadcastState();
        return new Response("OK");
      }
    }

    return new Response("Not found", { status: 404 });
  }

  handleHostAction(action: string) {
    switch (action) {
      case "startRound":
        startRound(this.state);
        this.startTimer();
        break;
      case "pause":
        this.stopTimer();
        break;
      case "resume":
        this.startTimer();
        break;
      case "skipToReveal":
        this.stopTimer();
        calculateAllScores(this.state);
        endRound(this.state);
        break;
      case "nextReveal":
        advancePhase(this.state);
        break;
      case "endGame":
        this.state.phase = "summary";
        break;
    }
    this.broadcastState();
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.state.timerEnd && Date.now() >= this.state.timerEnd) {
        this.stopTimer();
        calculateAllScores(this.state);
        endRound(this.state);
        this.broadcastState();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }

  broadcastState() {
    this.broadcast({ type: "state", state: this.state });
  }

  broadcastToTeam(teamId: string, msg: ServerMessage) {
    const team = this.state.teams[teamId];
    if (!team) return;
    const msgStr = JSON.stringify(msg);
    for (const playerId of team.players) {
      const conn = this.room.getConnection(playerId);
      if (conn) conn.send(msgStr);
    }
  }
}
```

**Step 3: Verify Partykit server starts**

```bash
npx partykit dev
```

Expected: Partykit dev server starts on localhost:1999

**Step 4: Commit**

```bash
git add party/ lib/
git commit -m "feat: add Partykit server with room management and game state"
```

---

### Task 4: Isometric Grid Component

> **REQUIRED SKILL:** Use `frontend-design` skill for this component. SimCity pixel aesthetic, warm colors, bouncy placement animations.

**Files:**
- Create: `components/IsometricGrid.tsx`
- Create: `components/IsometricBlock.tsx`
- Create: `lib/isometric.ts`

**Step 1: Create isometric math utilities**

Create `lib/isometric.ts`:

```typescript
// Convert grid coordinates (row, col) to isometric screen position (px, py)
// Using a standard isometric projection: 2:1 ratio diamond tiles
export const TILE_WIDTH = 48; // pixels
export const TILE_HEIGHT = 24; // half of width for 2:1 iso
export const BLOCK_HEIGHT = 20; // how tall blocks appear

export function gridToIso(row: number, col: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  };
}

export function isoToGrid(screenX: number, screenY: number): { row: number; col: number } {
  // Inverse of gridToIso
  const col = Math.round(
    (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  );
  const row = Math.round(
    (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  );
  return { row, col };
}

// Total canvas size needed for an 8x8 grid
export const GRID_PIXEL_WIDTH = TILE_WIDTH * 8 + TILE_WIDTH;
export const GRID_PIXEL_HEIGHT = TILE_HEIGHT * 8 + BLOCK_HEIGHT + TILE_HEIGHT;
```

**Step 2: Create IsometricBlock component**

Create `components/IsometricBlock.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import type { BlockType } from "@/lib/types";
import { BLOCK_COLORS } from "@/lib/constants";
import { TILE_WIDTH, TILE_HEIGHT, BLOCK_HEIGHT } from "@/lib/isometric";

interface IsometricBlockProps {
  block: BlockType;
  isNew?: boolean;
  isAIPlaced?: boolean;
  isCorrect?: boolean | null; // null = no scoring shown
}

export default function IsometricBlock({
  block,
  isNew = false,
  isAIPlaced = false,
  isCorrect = null,
}: IsometricBlockProps) {
  if (block === "empty") return null;

  const color = BLOCK_COLORS[block];
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;
  const bh = block === "floor" ? 4 : BLOCK_HEIGHT;

  // Isometric faces as SVG polygons
  const topFace = `${0},${-bh} ${hw},${hh - bh} ${0},${TILE_HEIGHT - bh} ${-hw},${hh - bh}`;
  const leftFace = `${-hw},${hh - bh} ${0},${TILE_HEIGHT - bh} ${0},${TILE_HEIGHT} ${-hw},${hh}`;
  const rightFace = `${hw},${hh - bh} ${0},${TILE_HEIGHT - bh} ${0},${TILE_HEIGHT} ${hw},${hh}`;

  // Color variations for 3D shading
  const topColor = color;
  const leftColor = adjustBrightness(color, -30);
  const rightColor = adjustBrightness(color, -15);

  // Scoring overlay
  let overlay = "none";
  if (isCorrect === true) overlay = "rgba(54, 95, 69, 0.4)"; // moss
  if (isCorrect === false) overlay = "rgba(196, 93, 62, 0.4)"; // ember

  return (
    <motion.g
      initial={isNew ? { y: -30, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 15,
        mass: 0.8,
      }}
    >
      {/* Left face */}
      <polygon points={leftFace} fill={leftColor} stroke={adjustBrightness(color, -40)} strokeWidth="0.5" />
      {/* Right face */}
      <polygon points={rightFace} fill={rightColor} stroke={adjustBrightness(color, -40)} strokeWidth="0.5" />
      {/* Top face */}
      <polygon points={topFace} fill={topColor} stroke={adjustBrightness(color, -40)} strokeWidth="0.5" />

      {/* Block details */}
      {block === "window" && (
        <polygon
          points={`${0},${-bh + 4} ${hw - 6},${hh - bh + 2} ${0},${TILE_HEIGHT - bh} ${-hw + 6},${hh - bh + 2}`}
          fill="#d4e4f7"
          opacity={0.7}
        />
      )}
      {block === "door" && (
        <rect
          x={-4} y={-bh + 6} width={8} height={bh - 2}
          fill={adjustBrightness(color, -40)}
          rx={3}
        />
      )}

      {/* AI shimmer effect */}
      {isAIPlaced && (
        <motion.polygon
          points={topFace}
          fill="rgba(107, 143, 113, 0.3)"
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Scoring overlay */}
      {overlay !== "none" && (
        <polygon points={topFace} fill={overlay} />
      )}
    </motion.g>
  );
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
```

**Step 3: Create IsometricGrid component**

Create `components/IsometricGrid.tsx`:

```tsx
"use client";

import { useCallback } from "react";
import type { Grid, BlockType } from "@/lib/types";
import { GRID_SIZE } from "@/lib/constants";
import { gridToIso, TILE_WIDTH, TILE_HEIGHT, GRID_PIXEL_WIDTH, GRID_PIXEL_HEIGHT, isoToGrid } from "@/lib/isometric";
import IsometricBlock from "./IsometricBlock";

interface IsometricGridProps {
  grid: Grid;
  onCellClick?: (row: number, col: number) => void;
  selectedBlock?: BlockType;
  readOnly?: boolean;
  showScoring?: boolean;
  targetGrid?: Grid | null;
  aiPlacedCells?: Set<string>; // "row,col" strings
  className?: string;
}

export default function IsometricGrid({
  grid,
  onCellClick,
  selectedBlock,
  readOnly = false,
  showScoring = false,
  targetGrid,
  aiPlacedCells,
  className = "",
}: IsometricGridProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (readOnly || !onCellClick) return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;

      // Convert screen coords to SVG viewBox coords
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX + viewBox.x;
      const svgY = (e.clientY - rect.top) * scaleY + viewBox.y;

      // Center offset (grid is centered in the viewBox)
      const offsetX = GRID_PIXEL_WIDTH / 2;
      const offsetY = TILE_HEIGHT;

      const { row, col } = isoToGrid(svgX - offsetX, svgY - offsetY);

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        onCellClick(row, col);
      }
    },
    [readOnly, onCellClick]
  );

  const centerX = GRID_PIXEL_WIDTH / 2;
  const centerY = TILE_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${GRID_PIXEL_WIDTH} ${GRID_PIXEL_HEIGHT}`}
      className={`w-full h-full max-h-[50vh] ${className}`}
      onClick={handleClick}
      style={{ cursor: readOnly ? "default" : "pointer" }}
    >
      {/* Grid base / ground plane */}
      {Array.from({ length: GRID_SIZE }).map((_, row) =>
        Array.from({ length: GRID_SIZE }).map((_, col) => {
          const { x, y } = gridToIso(row, col);
          const hw = TILE_WIDTH / 2;
          const hh = TILE_HEIGHT / 2;
          const points = `${0},${0} ${hw},${hh} ${0},${TILE_HEIGHT} ${-hw},${hh}`;

          return (
            <polygon
              key={`base-${row}-${col}`}
              points={points}
              transform={`translate(${centerX + x}, ${centerY + y})`}
              fill={(row + col) % 2 === 0 ? "#d4cfc4" : "#cec8bc"}
              stroke="#b8b2a6"
              strokeWidth="0.5"
              opacity={0.6}
            />
          );
        })
      )}

      {/* Blocks — render back-to-front for correct overlap */}
      {Array.from({ length: GRID_SIZE }).map((_, row) =>
        Array.from({ length: GRID_SIZE }).map((_, col) => {
          const block = grid[row][col];
          if (block === "empty") return null;

          const { x, y } = gridToIso(row, col);
          const isAI = aiPlacedCells?.has(`${row},${col}`) ?? false;
          const isCorrect = showScoring && targetGrid
            ? grid[row][col] === targetGrid[row][col]
            : null;

          return (
            <g
              key={`block-${row}-${col}`}
              transform={`translate(${centerX + x}, ${centerY + y})`}
            >
              <IsometricBlock
                block={block}
                isAIPlaced={isAI}
                isCorrect={isCorrect}
              />
            </g>
          );
        })
      )}
    </svg>
  );
}
```

**Step 4: Commit**

```bash
git add components/ lib/isometric.ts
git commit -m "feat: add isometric grid and block rendering components"
```

---

### Task 5: Block Palette Component

> **REQUIRED SKILL:** Use `frontend-design` skill. Pixel art styled block previews with selected state.

**Files:**
- Create: `components/BlockPalette.tsx`

**Step 1: Create BlockPalette**

Create `components/BlockPalette.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import type { BlockType } from "@/lib/types";
import { BLOCK_COLORS, BLOCK_LABELS } from "@/lib/constants";

interface BlockPaletteProps {
  selected: BlockType;
  onSelect: (block: BlockType) => void;
}

const PALETTE_BLOCKS: BlockType[] = ["wall", "floor", "roof", "window", "door", "empty"];

export default function BlockPalette({ selected, onSelect }: BlockPaletteProps) {
  return (
    <div className="flex gap-2 justify-center p-2 bg-bark/90 rounded-xl backdrop-blur-sm">
      {PALETTE_BLOCKS.map((block) => (
        <motion.button
          key={block}
          onClick={() => onSelect(block)}
          whileTap={{ scale: 0.9 }}
          className={`
            flex flex-col items-center gap-1 px-3 py-2 rounded-lg
            transition-all duration-150
            ${selected === block
              ? "bg-gold/30 ring-2 ring-gold shadow-lg shadow-gold/20"
              : "bg-warm-white/10 hover:bg-warm-white/20"
            }
          `}
          aria-label={`Select ${BLOCK_LABELS[block]} block`}
          aria-pressed={selected === block}
        >
          {/* Mini isometric block preview */}
          <svg width="28" height="28" viewBox="-16 -16 32 32">
            {block === "empty" ? (
              // Eraser icon
              <g>
                <line x1="-6" y1="-6" x2="6" y2="6" stroke="#f5f1ea" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="-6" x2="-6" y2="6" stroke="#f5f1ea" strokeWidth="2" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                {/* Mini iso block */}
                <polygon
                  points="0,-8 12,0 0,8 -12,0"
                  fill={BLOCK_COLORS[block]}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="0.5"
                />
                <polygon
                  points="-12,0 0,8 0,14 -12,6"
                  fill={adjustBrightness(BLOCK_COLORS[block], -30)}
                />
                <polygon
                  points="12,0 0,8 0,14 12,6"
                  fill={adjustBrightness(BLOCK_COLORS[block], -15)}
                />
              </g>
            )}
          </svg>
          <span className="text-[10px] text-warm-white/80 font-pixel leading-none">
            {BLOCK_LABELS[block]}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
```

**Step 2: Commit**

```bash
git add components/BlockPalette.tsx
git commit -m "feat: add block palette with pixel art previews"
```

---

### Task 6: Chat Component

> **REQUIRED SKILL:** Use `frontend-design` skill. Round 1 = notebook style, Round 2 = clean with robot glow.

**Files:**
- Create: `components/ChatPanel.tsx`

**Step 1: Create ChatPanel**

Create `components/ChatPanel.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAI?: boolean;
  timestamp: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isRound2: boolean;
  disabled?: boolean;
  teamName?: string;
}

export default function ChatPanel({
  messages,
  onSend,
  isRound2,
  disabled = false,
  teamName,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className={`
      flex flex-col h-full rounded-xl overflow-hidden border
      ${isRound2
        ? "bg-charcoal/95 border-sage/30"
        : "bg-warm-white/90 border-rust/20"
      }
    `}>
      {/* Header */}
      <div className={`
        px-3 py-2 text-xs font-pixel tracking-wider
        ${isRound2
          ? "bg-sage/20 text-sage"
          : "bg-rust/10 text-rust"
        }
      `}>
        {teamName || "Team Chat"}
        {isRound2 && (
          <span className="ml-2 text-[10px] animate-pulse">
            Scout online
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.isAI ? "items-start" : ""}`}
            >
              {/* Avatar */}
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0
                ${msg.isAI
                  ? "bg-sage text-warm-white"
                  : "bg-rust/20 text-rust"
                }
              `}>
                {msg.isAI ? "S" : msg.senderName[0].toUpperCase()}
              </div>

              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <span className={`
                  text-[10px] font-bold block mb-0.5
                  ${msg.isAI
                    ? "text-sage"
                    : isRound2 ? "text-warm-white/60" : "text-charcoal/60"
                  }
                `}>
                  {msg.senderName}
                  {msg.isAI && " (Robot)"}
                </span>
                <p className={`
                  text-sm leading-relaxed break-words
                  ${msg.isAI
                    ? "text-sage/90 bg-sage/10 rounded-lg px-2 py-1"
                    : isRound2 ? "text-warm-white/90" : "text-charcoal"
                  }
                `}>
                  {msg.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-inherit">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              disabled
                ? "Chat disabled"
                : isRound2
                  ? "Ask Scout to build something..."
                  : "Describe what to build..."
            }
            disabled={disabled}
            className={`
              flex-1 px-3 py-2 rounded-lg text-sm outline-none
              ${isRound2
                ? "bg-charcoal border border-sage/30 text-warm-white placeholder:text-warm-white/30 focus:border-sage"
                : "bg-cream border border-rust/20 text-charcoal placeholder:text-charcoal/30 focus:border-rust"
              }
            `}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={`
              px-3 py-2 rounded-lg text-sm font-bold transition-all
              ${isRound2
                ? "bg-sage text-warm-white hover:bg-sage/80 disabled:bg-sage/20"
                : "bg-rust text-warm-white hover:bg-rust/80 disabled:bg-rust/20"
              }
              disabled:cursor-not-allowed
            `}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ChatPanel.tsx
git commit -m "feat: add chat panel with Round 1/Round 2 visual modes"
```

---

### Task 7: Lobby & Join Flow

> **REQUIRED SKILL:** Use `frontend-design` skill. Beautiful terrain background, satisfying join animations, pixel font room code.

**Files:**
- Create: `app/page.tsx` (home — create or join)
- Create: `app/join/[code]/page.tsx` (join with name)
- Create: `app/lobby/[code]/page.tsx` (waiting room)
- Create: `lib/usePartySocket.ts` (shared WebSocket hook)

**Step 1: Create WebSocket hook**

Create `lib/usePartySocket.ts`:

```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PartySocket from "partysocket";
import type { ClientMessage, ServerMessage, RoomState } from "./types";

export function usePartySocket(roomCode: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);
  const listenersRef = useRef<((msg: ServerMessage) => void)[]>([]);

  useEffect(() => {
    if (!roomCode) return;

    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
    const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "ws" : "wss";

    const socket = new PartySocket({
      host,
      room: roomCode.toLowerCase(),
      protocol,
    });

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));

    socket.addEventListener("message", (e) => {
      const msg: ServerMessage = JSON.parse(e.data);
      if (msg.type === "state") {
        setState(msg.state);
      }
      for (const listener of listenersRef.current) {
        listener(msg);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode]);

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const onMessage = useCallback((listener: (msg: ServerMessage) => void) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l !== listener);
    };
  }, []);

  return { state, connected, send, onMessage, socket: socketRef };
}
```

**Step 2: Create home page (create/join)**

Create `app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { generateRoomCode } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = () => {
    const code = generateRoomCode();
    router.push(`/host/${code}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 4) {
      router.push(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream relative overflow-hidden">
      {/* Background terrain (implemented in Task 13) */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream to-sage/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center space-y-8 p-8"
      >
        <div className="space-y-2">
          <h1 className="font-display text-5xl md:text-7xl text-charcoal">
            Blueprint Telephone
          </h1>
          <p className="font-serif text-xl text-charcoal/60 italic">
            Can Gen Z build with robots?
          </p>
          <p className="text-sm text-charcoal/40">
            A 500 Acres interactive experience
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Host button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="px-8 py-4 bg-rust text-warm-white rounded-xl font-display text-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Host a Game
          </motion.button>

          {/* Join form */}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="CODE"
              maxLength={4}
              className="w-28 px-4 py-4 text-center font-pixel text-2xl tracking-widest bg-warm-white border-2 border-charcoal/20 rounded-xl outline-none focus:border-rust uppercase"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={joinCode.length !== 4}
              className="px-6 py-4 bg-forest text-warm-white rounded-xl font-display text-xl disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Join
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
```

**Step 3: Create join page (enter name)**

Create `app/join/[code]/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const [name, setName] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Store name in sessionStorage, navigate to game
    sessionStorage.setItem("playerName", name.trim());
    sessionStorage.setItem("roomCode", code);
    router.push(`/play/${code}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 p-8"
      >
        <div>
          <p className="text-sm text-charcoal/40 mb-1">Joining room</p>
          <p className="font-pixel text-4xl tracking-widest text-rust">{code}</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            autoFocus
            className="w-64 px-4 py-3 text-center font-body text-lg bg-warm-white border-2 border-charcoal/20 rounded-xl outline-none focus:border-forest"
          />
          <div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!name.trim()}
              className="px-8 py-3 bg-forest text-warm-white rounded-xl font-display text-xl disabled:opacity-30"
            >
              Let's Build
            </motion.button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
```

**Step 4: Create player game page (shell — full implementation in Task 8)**

Create `app/play/[code]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";

export default function PlayPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { state, connected, send } = usePartySocket(code);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (connected && !joined) {
      const name = sessionStorage.getItem("playerName") || "Anonymous";
      send({ type: "join", name });
      setJoined(true);
    }
  }, [connected, joined, send]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="font-pixel text-charcoal/40 animate-pulse">Connecting...</p>
      </div>
    );
  }

  // Full game view implemented in Task 8
  return (
    <div className="min-h-screen bg-cream p-4">
      <p className="font-pixel text-sm text-charcoal/40">
        Room: {code} | Phase: {state.phase} | Connected: {String(connected)}
      </p>
      <pre className="text-xs mt-4 overflow-auto">{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add app/ lib/usePartySocket.ts
git commit -m "feat: add lobby, join flow, and player game shell with WebSocket hook"
```

---

### Task 8: Player Game View (Architect & Builder)

> **REQUIRED SKILL:** Use `frontend-design` skill. Mobile-first layout, responsive, polished.

**Files:**
- Modify: `app/play/[code]/page.tsx`
- Create: `components/GameHeader.tsx`
- Create: `components/Timer.tsx`
- Create: `components/PlayerView.tsx`

**Step 1: Create Timer component**

Create `components/Timer.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  endTime: number | null;
  className?: string;
}

export default function Timer({ endTime, className = "" }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endTime) return;

    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isLow = remaining < 30000 && remaining > 0;

  return (
    <div className={`font-pixel text-center ${isLow ? "text-ember animate-pulse" : "text-charcoal"} ${className}`}>
      <span className="text-3xl tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
```

**Step 2: Create GameHeader**

Create `components/GameHeader.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import type { GamePhase } from "@/lib/types";
import Timer from "./Timer";

interface GameHeaderProps {
  phase: GamePhase;
  round: 1 | 2;
  timerEnd: number | null;
  teamName?: string;
  role?: string;
}

const PHASE_LABELS: Partial<Record<GamePhase, string>> = {
  lobby: "Waiting for host...",
  round1: "ROUND 1: OLD SCHOOL",
  reveal1: "Results",
  interstitial: "Get ready...",
  round2: "ROUND 2: WITH ROBOTS",
  finalReveal: "Final Results",
  summary: "Game Over",
};

export default function GameHeader({ phase, round, timerEnd, teamName, role }: GameHeaderProps) {
  const isRound2 = phase === "round2";

  return (
    <motion.div
      layout
      className={`
        p-3 rounded-xl text-center space-y-1
        ${isRound2
          ? "bg-forest/10 border border-sage/30"
          : "bg-rust/5 border border-rust/10"
        }
      `}
    >
      <p className={`
        font-pixel text-xs tracking-widest
        ${isRound2 ? "text-sage" : "text-rust"}
      `}>
        {PHASE_LABELS[phase] || phase}
      </p>

      {teamName && (
        <p className="text-sm text-charcoal/60">
          {teamName} &middot; <span className="capitalize font-bold">{role}</span>
        </p>
      )}

      {(phase === "round1" || phase === "round2") && (
        <Timer endTime={timerEnd} />
      )}
    </motion.div>
  );
}
```

**Step 3: Create PlayerView — the main game view**

Create `components/PlayerView.tsx`:

```tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { RoomState, BlockType, ServerMessage } from "@/lib/types";
import IsometricGrid from "./IsometricGrid";
import BlockPalette from "./BlockPalette";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import GameHeader from "./GameHeader";

interface PlayerViewProps {
  state: RoomState;
  playerId: string;
  send: (msg: any) => void;
  onMessage: (listener: (msg: ServerMessage) => void) => () => void;
}

export default function PlayerView({ state, playerId, send, onMessage }: PlayerViewProps) {
  const player = state.players[playerId];
  const team = player ? state.teams[player.teamId] : null;
  const isArchitect = player?.role === "architect";
  const isRound2 = state.phase === "round2";
  const isPlaying = state.phase === "round1" || state.phase === "round2";

  const [selectedBlock, setSelectedBlock] = useState<BlockType>("wall");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiPlacedCells, setAiPlacedCells] = useState<Set<string>>(new Set());
  const msgIdCounter = useRef(0);

  // Listen for chat messages and AI build actions
  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "chat" && msg.teamId === player?.teamId) {
        setMessages(prev => [...prev, {
          id: String(++msgIdCounter.current),
          senderId: msg.senderId,
          senderName: msg.senderName,
          text: msg.text,
          isAI: msg.isAI,
          timestamp: Date.now(),
        }]);
      }
      if (msg.type === "aiBuilding" && msg.teamId === player?.teamId) {
        setAiPlacedCells(prev => {
          const next = new Set(prev);
          for (const a of msg.actions) next.add(`${a.row},${a.col}`);
          return next;
        });
      }
    });
  }, [onMessage, player?.teamId]);

  // Clear messages and AI cells on phase change
  useEffect(() => {
    setMessages([]);
    setAiPlacedCells(new Set());
  }, [state.phase]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!isPlaying || isArchitect) return;
    send({ type: "placeBlock", row, col, block: selectedBlock });
  }, [isPlaying, isArchitect, selectedBlock, send]);

  const handleSendChat = useCallback((text: string) => {
    if (isRound2 && text.toLowerCase().includes("scout") || isRound2) {
      // In round 2, all messages go through AI route as well as team chat
      send({ type: "chat", text });
      // Also send to AI
      fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: state.code,
          teamId: player?.teamId,
          message: text,
          round: state.round,
        }),
      });
    } else {
      send({ type: "chat", text });
    }
  }, [isRound2, send, state.code, player?.teamId, state.round]);

  if (!player || !team) {
    return <div className="min-h-screen flex items-center justify-center bg-cream">
      <p className="font-pixel text-charcoal/40 animate-pulse">Joining team...</p>
    </div>;
  }

  return (
    <div className="h-screen flex flex-col bg-cream overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-2">
        <GameHeader
          phase={state.phase}
          round={state.round}
          timerEnd={state.timerEnd}
          teamName={team.name}
          role={player.role}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-2 p-2">
        {/* Grid area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            {isArchitect && state.currentTarget ? (
              <div className="h-full flex flex-col">
                <p className="text-xs font-pixel text-rust text-center mb-1">TARGET (only you can see this)</p>
                <IsometricGrid
                  grid={state.currentTarget}
                  readOnly
                  className="flex-1"
                />
              </div>
            ) : (
              <IsometricGrid
                grid={team.grid}
                onCellClick={handleCellClick}
                selectedBlock={selectedBlock}
                readOnly={isArchitect || !isPlaying}
                aiPlacedCells={aiPlacedCells}
              />
            )}
          </div>

          {/* Palette (builder only, during play) */}
          {!isArchitect && isPlaying && (
            <div className="flex-shrink-0 mt-2">
              <BlockPalette selected={selectedBlock} onSelect={setSelectedBlock} />
            </div>
          )}
        </div>

        {/* Chat panel */}
        {isPlaying && (
          <div className="h-48 md:h-auto md:w-80 flex-shrink-0">
            <ChatPanel
              messages={messages}
              onSend={handleSendChat}
              isRound2={isRound2}
              teamName={team.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Update play page to use PlayerView**

Replace `app/play/[code]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import PlayerView from "@/components/PlayerView";

export default function PlayPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { state, connected, send, onMessage } = usePartySocket(code);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (connected && !joined) {
      const name = sessionStorage.getItem("playerName") || "Anonymous";
      send({ type: "join", name });
      setJoined(true);
    }
  }, [connected, joined, send]);

  // Detect our player ID from state
  useEffect(() => {
    if (!state || playerId) return;
    const name = sessionStorage.getItem("playerName");
    const found = Object.values(state.players).find(p => p.name === name && p.connected);
    if (found) setPlayerId(found.id);
  }, [state, playerId]);

  if (!state || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="font-pixel text-charcoal/40 animate-pulse">Connecting...</p>
      </div>
    );
  }

  return (
    <PlayerView
      state={state}
      playerId={playerId}
      send={send}
      onMessage={onMessage}
    />
  );
}
```

**Step 5: Commit**

```bash
git add components/ app/
git commit -m "feat: add full player game view with architect/builder modes"
```

---

### Task 9: Host Game View

> **REQUIRED SKILL:** Use `frontend-design` skill. Dramatic, projector-friendly. Large type, dark mode, cinematic.

**Files:**
- Create: `app/host/[code]/page.tsx`
- Create: `components/HostView.tsx`
- Create: `components/HostControls.tsx`
- Create: `components/TeamMosaic.tsx`

This task builds the entire host/presenter experience: lobby screen with join code, mosaic view during rounds, control buttons, and activity feed. The host view is designed for projection — high contrast, large elements, minimal clutter.

**Key implementation notes:**
- `HostView.tsx` switches between lobby, active round, and reveal based on `state.phase`
- `TeamMosaic.tsx` renders a grid of mini IsometricGrid components, one per team, with team name labels
- `HostControls.tsx` renders phase-appropriate buttons (Start Round, Skip to Reveal, Next, etc.)
- The lobby displays room code in massive font-pixel type with the join URL
- Player names animate in with staggered pop-in as they join
- Activity feed at bottom shows recent chat messages from all teams (scrolling ticker)

**Step 1: Create all host components with full implementation**

**Step 2: Create host page route**

**Step 3: Commit**

```bash
git add app/host/ components/HostView.tsx components/HostControls.tsx components/TeamMosaic.tsx
git commit -m "feat: add host view with mosaic, controls, and activity feed"
```

---

### Task 10: AI Integration

**Files:**
- Create: `app/api/ai/chat/route.ts`
- Create: `lib/aiPrompt.ts`
- Create: `lib/parseAIActions.ts`

**Step 1: Create AI system prompt builder**

Create `lib/aiPrompt.ts`:

```typescript
import type { Grid, BlockType } from "./types";
import { GRID_SIZE } from "./constants";
import { ROUND_1_DESCRIPTION, ROUND_2_DESCRIPTION } from "./targets";

export function buildSystemPrompt(target: Grid, round: 1 | 2): string {
  const desc = round === 1 ? ROUND_1_DESCRIPTION : ROUND_2_DESCRIPTION;
  const gridStr = target
    .map((row, r) =>
      row.map((cell, c) => `(${r},${c}):${cell}`).filter(s => !s.endsWith(":empty")).join(" ")
    )
    .filter(row => row.length > 0)
    .join("\n");

  return `You are Scout, an AI construction robot assistant for the "Blueprint Telephone" game by 500 Acres.

You are helping a team build a structure using Skylark 250-inspired blocks on an ${GRID_SIZE}x${GRID_SIZE} isometric grid.

## The Target Structure
${desc}

Grid data (row,col):blockType — only non-empty cells shown:
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
<actions>[{"row":0,"col":0,"block":"wall"},{"row":0,"col":1,"block":"wall"}]</actions>

## Rules
- You can see the TARGET structure but NOT what the builders have placed so far
- Keep text responses SHORT (1-3 sentences) — this is a timed game
- Be enthusiastic, encouraging, and clear
- Use grid coordinates (row, col) starting from (0,0) at top-left
- When asked to build, include <actions> tags with the block placements
- When asked to describe, give clear spatial descriptions
- You are a friendly robot construction assistant — warm but efficient`;
}
```

**Step 2: Create AI action parser**

Create `lib/parseAIActions.ts`:

```typescript
import type { BuildAction, AIResponse, BlockType } from "./types";

const VALID_BLOCKS = new Set<string>(["wall", "floor", "roof", "window", "door", "empty"]);

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
            item.row >= 0 && item.row < 8 &&
            item.col >= 0 && item.col < 8
          ) {
            actions.push({
              row: item.row,
              col: item.col,
              block: item.block as BlockType,
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
```

**Step 3: Create API route**

Create `app/api/ai/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/aiPrompt";
import { parseAIResponse } from "@/lib/parseAIActions";
import { ROUND_1_TARGET, ROUND_2_TARGET } from "@/lib/targets";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { roomCode, teamId, message, round } = await req.json();

    if (!roomCode || !teamId || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Only allow AI in round 2
    if (round !== 2) {
      return NextResponse.json({ error: "AI not available this round" }, { status: 403 });
    }

    const target = round === 2 ? ROUND_2_TARGET : ROUND_1_TARGET;
    const systemPrompt = buildSystemPrompt(target, round);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const aiText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    const parsed = parseAIResponse(aiText);

    // Push AI response into the Partykit room via HTTP
    const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
    const partyProtocol = partyHost.startsWith("localhost") || partyHost.startsWith("127.") ? "http" : "https";

    await fetch(`${partyProtocol}://${partyHost}/party/${roomCode.toLowerCase()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "aiResponse",
        teamId,
        text: parsed.text,
        actions: parsed.actions,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
```

**Step 4: Write tests for AI action parser**

Create `__tests__/parseAIActions.test.ts`:

```typescript
import { parseAIResponse } from "@/lib/parseAIActions";

describe("parseAIResponse", () => {
  it("extracts actions from <actions> tags", () => {
    const text = 'Sure! Building the walls now. <actions>[{"row":0,"col":0,"block":"wall"},{"row":0,"col":1,"block":"wall"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.text).toBe("Sure! Building the walls now.");
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toEqual({ row: 0, col: 0, block: "wall" });
  });

  it("returns empty actions when no tags present", () => {
    const result = parseAIResponse("Just describing the structure.");
    expect(result.text).toBe("Just describing the structure.");
    expect(result.actions).toHaveLength(0);
  });

  it("rejects invalid block types", () => {
    const text = '<actions>[{"row":0,"col":0,"block":"lava"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(0);
  });

  it("rejects out-of-bounds coordinates", () => {
    const text = '<actions>[{"row":10,"col":0,"block":"wall"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(0);
  });
});
```

**Step 5: Commit**

```bash
git add app/api/ lib/aiPrompt.ts lib/parseAIActions.ts __tests__/
git commit -m "feat: add AI integration with Claude API, action parsing, and tests"
```

---

### Task 11: Scoring Engine

**Files:**
- Create: `lib/scoring.ts`
- Create: `__tests__/scoring.test.ts`

**Step 1: Write scoring tests**

Create `__tests__/scoring.test.ts`:

```typescript
import { calculateDetailedScore } from "@/lib/scoring";
import type { Grid } from "@/lib/types";
import { createEmptyGrid } from "@/lib/constants";

describe("calculateDetailedScore", () => {
  it("returns 100% for perfect match", () => {
    const target: Grid = createEmptyGrid();
    target[0][0] = "wall";
    target[0][1] = "wall";
    const build = createEmptyGrid();
    build[0][0] = "wall";
    build[0][1] = "wall";
    const result = calculateDetailedScore(build, target);
    expect(result.percentage).toBe(100);
  });

  it("returns 0% for completely wrong build", () => {
    const target: Grid = createEmptyGrid();
    target[0][0] = "wall";
    target[0][1] = "roof";
    const build = createEmptyGrid();
    build[0][0] = "roof";
    build[0][1] = "wall";
    const result = calculateDetailedScore(build, target);
    expect(result.percentage).toBe(0);
  });

  it("penalizes extra blocks", () => {
    const target: Grid = createEmptyGrid();
    target[0][0] = "wall";
    const build = createEmptyGrid();
    build[0][0] = "wall";
    build[1][1] = "wall"; // extra
    const result = calculateDetailedScore(build, target);
    expect(result.percentage).toBe(50); // 1 correct out of 2 evaluated
  });

  it("returns cell-by-cell results", () => {
    const target: Grid = createEmptyGrid();
    target[0][0] = "wall";
    const build = createEmptyGrid();
    build[0][0] = "floor"; // wrong type
    const result = calculateDetailedScore(build, target);
    expect(result.cells[0]).toEqual({
      row: 0, col: 0, expected: "wall", actual: "floor", correct: false,
    });
  });
});
```

**Step 2: Implement scoring**

Create `lib/scoring.ts`:

```typescript
import type { Grid, CellResult, BlockType } from "./types";
import { GRID_SIZE } from "./constants";

export interface DetailedScore {
  percentage: number;
  correct: number;
  total: number;
  cells: CellResult[];
}

export function calculateDetailedScore(build: Grid, target: Grid): DetailedScore {
  const cells: CellResult[] = [];
  let correct = 0;
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const expected = target[r][c];
      const actual = build[r][c];

      // Count cells that should have something
      if (expected !== "empty") {
        total++;
        const isCorrect = actual === expected;
        if (isCorrect) correct++;
        cells.push({ row: r, col: c, expected, actual, correct: isCorrect });
      }

      // Penalize extra blocks
      if (expected === "empty" && actual !== "empty") {
        total++;
        cells.push({ row: r, col: c, expected, actual, correct: false });
      }
    }
  }

  return {
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
    correct,
    total,
    cells,
  };
}
```

**Step 3: Run tests**

```bash
npx jest __tests__/scoring.test.ts --verbose
```

Expected: All 4 tests pass.

**Step 4: Commit**

```bash
git add lib/scoring.ts __tests__/scoring.test.ts
git commit -m "feat: add scoring engine with cell-by-cell comparison and tests"
```

---

### Task 12: Reveal System

> **REQUIRED SKILL:** Use `frontend-design` skill. Cinematic reveals, score gauge animations, confetti on high scores.

**Files:**
- Create: `components/RevealCarousel.tsx`
- Create: `components/ScoreGauge.tsx`
- Create: `components/FinalSummary.tsx`
- Create: `components/RoundComparison.tsx`

This task builds the reveal experience shown on the host screen. Key components:

- `ScoreGauge.tsx`: Animated circular gauge that fills up to the score percentage. Uses Framer Motion `useMotionValue` + `useTransform` for smooth gauge animation.
- `RevealCarousel.tsx`: Shows each team's build next to the target, one at a time. Host clicks "Next" to advance. Each reveal has: target grid (left), team build grid (right), team name, score gauge animating up.
- `RoundComparison.tsx`: For the final reveal — shows Round 1 build (left) vs Round 2 build (right) with the target ghosted. Score delta animates. Cells that improved flash green.
- `FinalSummary.tsx`: Aggregate stats card, improvement leaderboard (sorted by most-improved), closing 500 Acres mission statement, QR code placeholder.

**Step 1: Implement all reveal components with full animations**

**Step 2: Integrate into HostView (modify `components/HostView.tsx` to render reveal components based on phase)**

**Step 3: Commit**

```bash
git add components/RevealCarousel.tsx components/ScoreGauge.tsx components/FinalSummary.tsx components/RoundComparison.tsx
git commit -m "feat: add reveal system with animated scores, comparisons, and final summary"
```

---

### Task 13: Visual Polish & Animations

> **REQUIRED SKILL:** Use `frontend-design` skill for ALL work in this task. This is the aesthetic pass — SimCity pixel art, terrain, round transitions, flourishes.

**Files:**
- Create: `components/TerrainBackground.tsx` (trees, mountains SVG backdrop)
- Create: `components/RoundTransition.tsx` (animated interstitial between rounds)
- Create: `components/Confetti.tsx` (particle effect for high scores)
- Modify: `app/globals.css` (pixel font import, additional animations)
- Modify: multiple components for final visual refinement

This is the polish pass. Key work:

1. **Terrain backdrop**: SVG illustration with layered mountains (sage/forest/moss gradient), stylized pixel trees, subtle parallax. Used behind the grid on player views and as lobby background.

2. **Round transition**: Full-screen animated interstitial between Round 1 reveal and Round 2. Displays 500 Acres branding card: *"In 2026, 500 Acres is training Gen Z to build real homes using CNC-cut Skylark 250 blocks. Now let's see what happens when you add robots."* Animated text reveal, subtle particle effects.

3. **Round 1 vs Round 2 visual shift**: Round 1 UI has warm, sketch-like quality (slightly desaturated, paper texture). Round 2 UI is clean, sharp, with sage/green glow accents. The transition between rounds should be noticeable and satisfying.

4. **Confetti/particles**: Triggered on the final reveal when scores are high. Warm-colored particles (gold, rust, sage) falling and floating.

5. **Import pixel font**: Add "Press Start 2P" from Google Fonts for game UI elements.

6. **Loading states**: Skeleton loaders, pulse animations, connecting indicators.

7. **Sound**: Optional — consider adding subtle UI sounds via `<audio>` elements (block place, timer warning, reveal fanfare). Audio files can be small base64-encoded or fetched from public/.

**Step 1: Implement terrain, transitions, confetti, and global style updates**

**Step 2: Refine existing components with final visual polish**

**Step 3: Commit**

```bash
git add components/ app/globals.css public/
git commit -m "feat: add visual polish — terrain, transitions, confetti, SimCity aesthetic"
```

---

### Task 14: Deploy & QA

> **REQUIRED SKILL:** Use web testing skill for QA checkpoints.

**Files:**
- Modify: `vercel.json`
- Modify: `package.json` (build scripts)
- Create: `partykit.json` (production config)

**Step 1: Configure Partykit for production**

Update `partykit.json` with production settings. Deploy Partykit:

```bash
npx partykit deploy
```

Note the production URL and update `NEXT_PUBLIC_PARTYKIT_HOST` in Vercel env vars.

**Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_PARTYKIT_HOST` (production Partykit URL)

**Step 3: QA Checklist**

Run through complete game flow:

- [ ] Home page loads, can create room
- [ ] Join URL works, name entry works
- [ ] Lobby shows players joining with animations
- [ ] Host "Start Game" begins Round 1 with timer
- [ ] Architect sees target, Builder sees blank grid
- [ ] Block placement works on mobile and desktop
- [ ] Chat messages send and receive within team
- [ ] Timer counts down and round ends at 0
- [ ] Reveal shows builds vs target with score animation
- [ ] Interstitial card displays between rounds
- [ ] Round 2 starts with role swap
- [ ] AI (Scout) responds to messages with text + build actions
- [ ] AI-placed blocks appear on grid with shimmer effect
- [ ] Final reveal shows Round 1 vs Round 2 comparison
- [ ] Score deltas and improvement leaderboard display
- [ ] Summary screen with 500 Acres branding shows
- [ ] Works on mobile (iPhone Safari + Android Chrome)
- [ ] Works with remote players joining from different network
- [ ] No console errors in production build

**Step 4: Commit final production config**

```bash
git add -A
git commit -m "feat: production deployment configuration and QA verification"
```

---

## QA Checkpoints

Run the web testing skill at these milestones:
1. **After Task 7**: Lobby + join flow works end-to-end
2. **After Task 8 + 9**: Full game loop works (host + players, no AI)
3. **After Task 10**: AI integration works in Round 2
4. **After Task 12**: Reveal system works with scoring
5. **After Task 14**: Full production deploy QA
