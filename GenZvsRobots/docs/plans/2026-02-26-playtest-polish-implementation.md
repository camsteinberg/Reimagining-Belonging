# Playtest Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 6 post-playtest UX features: top-down view, Scout trigger word + role-based behavior, keyboard block shortcuts, host design visibility, player end-of-game results, and clickable team detail modal.

**Architecture:** All features are client-side or minor API changes — no new server state, no schema changes, no new WebSocket messages. Data already exists on `RoomState`. The features are independent and can be implemented in any order.

**Tech Stack:** Next.js 16 (App Router), React 19, Canvas 2D, PartyKit, Tailwind CSS 4, Framer Motion

---

### Task 1: Top-Down View Toggle

Add a toggle button in `VoxelGrid.tsx` that switches between the existing isometric 3D view and a flat 2D overhead grid. In top-down mode, each cell renders as a colored square showing the topmost block, with coordinate labels (A1–F6) always visible.

**Files:**
- Modify: `components/VoxelGrid.tsx`
- Modify: `lib/voxelRenderer.ts`

**Step 1: Add top-down rendering function to `voxelRenderer.ts`**

Add this function after the existing `drawAxisLabels` function (after line 213 in `lib/voxelRenderer.ts`):

```typescript
// Top-down 2D grid renderer
function renderTopDown(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  width: number,
  height: number,
  showScoring: boolean,
  targetGrid?: Grid,
  hoverCell?: { row: number; col: number } | null,
  hoverBlock?: BlockType,
): void {
  ctx.clearRect(0, 0, width, height);

  const padding = 24;
  const cellSize = Math.min(
    (width - padding * 2) / GRID_SIZE,
    (height - padding * 2) / GRID_SIZE
  );
  const offsetX = (width - cellSize * GRID_SIZE) / 2;
  const offsetY = (height - cellSize * GRID_SIZE) / 2;

  // Block colors matching BLOCK_COLORS from constants
  const COLORS: Record<string, string> = {
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

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      // Find topmost block
      let topBlock: string = "empty";
      for (let h = MAX_HEIGHT - 1; h >= 0; h--) {
        const block = grid[r]?.[c]?.[h];
        if (block && block !== "empty" && block !== "air") {
          topBlock = block;
          break;
        }
      }

      // Draw cell
      if (topBlock !== "empty") {
        ctx.fillStyle = COLORS[topBlock] || "#ccc";
        ctx.fillRect(x, y, cellSize, cellSize);
      } else {
        // Empty cell — checkerboard
        const isDark = (r + c) % 2 === 0;
        ctx.fillStyle = isDark ? "#d4cfc4" : "#cec8bc";
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Cell border
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Scoring overlay
      if (showScoring && targetGrid) {
        let hasCorrect = true;
        let hasMismatch = false;
        for (let h = 0; h < MAX_HEIGHT; h++) {
          const expected = targetGrid[r]?.[c]?.[h];
          const actual = grid[r]?.[c]?.[h];
          if (expected && expected !== "empty" && expected !== "air") {
            if (actual !== expected) { hasMismatch = true; hasCorrect = false; }
          } else if (actual && actual !== "empty" && actual !== "air") {
            hasMismatch = true;
          }
        }
        if (hasMismatch) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
          ctx.fillRect(x, y, cellSize, cellSize);
        } else if (topBlock !== "empty" && hasCorrect) {
          ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }

      // Hover highlight
      if (hoverCell && hoverCell.row === r && hoverCell.col === c) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        // Draw hover block color
        if (hoverBlock && hoverBlock !== "empty" && hoverBlock !== "air") {
          ctx.fillStyle = COLORS[hoverBlock] || "#ccc";
          ctx.globalAlpha = 0.4;
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.globalAlpha = 1;
        }
      }

      // Coordinate label
      ctx.fillStyle = "rgba(42, 37, 32, 0.6)";
      ctx.font = `bold ${Math.max(8, cellSize * 0.22)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${colToLetter(c)}${rowToNumber(r)}`,
        x + cellSize / 2,
        y + cellSize / 2
      );
    }
  }
}
```

**Step 2: Export `renderTopDown` from `voxelRenderer.ts`**

Wrap it as a new exported function. Update the `renderVoxelGrid` function signature and the `RenderOptions` interface to include `topDown`:

Add to the `RenderOptions` interface (after line 17):
```typescript
  topDown?: boolean;
```

At the start of the `renderVoxelGrid` function body (after destructuring `opts` around line 231), add an early return for top-down mode:

```typescript
  if (opts.topDown) {
    renderTopDown(ctx, grid, width, height, showScoring ?? false, targetGrid, hoverCell, hoverBlock);
    return;
  }
```

**Step 3: Add top-down toggle state and button to `VoxelGrid.tsx`**

In `VoxelGrid.tsx`, add a `topDown` state next to the `rotationLocked` state (around line 44):

```typescript
  const [topDown, setTopDown] = useState(false);
```

Pass `topDown` to `renderVoxelGrid` in the `renderRef.current` callback (around line 129):

```typescript
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
```

Update `canvasToGrid` to handle top-down mode. When `topDown` is true, use simple grid math instead of isometric inverse:

In `canvasToGrid` (around line 73), at the start of the function body:

```typescript
      if (topDown) {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleXR = (canvasSize.w * dpr) / rect.width;
        const scaleYR = (canvasSize.h * dpr) / rect.height;
        const canvasX = (clientX - rect.left) * scaleXR;
        const canvasY = (clientY - rect.top) * scaleYR;

        const w = canvasSize.w * dpr;
        const h = canvasSize.h * dpr;
        const padding = 24;
        const cellSize = Math.min(
          (w - padding * 2) / GRID_SIZE,
          (h - padding * 2) / GRID_SIZE
        );
        const offsetX = (w - cellSize * GRID_SIZE) / 2;
        const offsetY = (h - cellSize * GRID_SIZE) / 2;

        const col = Math.floor((canvasX - offsetX) / cellSize);
        const row = Math.floor((canvasY - offsetY) / cellSize);

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          return { row, col };
        }
        return null;
      }
```

Add `topDown` to the dependency array of `canvasToGrid` and `renderRef.current`.

**Step 4: Add the top-down toggle button in the JSX**

Add a button next to the existing rotation toggle button (inside the `<>` fragment around line 292):

```tsx
          {/* Top-down view toggle */}
          <button
            onClick={() => setTopDown((t) => !t)}
            className={[
              "absolute top-2 left-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
              topDown
                ? "bg-[#b89f65]/90 hover:bg-[#b89f65] text-[#2a2520] ring-1 ring-[#b89f65]"
                : "bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] ring-1 ring-[#b89f65]/40",
            ].join(" ")}
            title={topDown ? "Switch to 3D view" : "Switch to top-down 2D view"}
            type="button"
          >
            <span className="text-sm">{topDown ? "3D" : "2D"}</span>
          </button>
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 6: Commit**

```bash
git add components/VoxelGrid.tsx lib/voxelRenderer.ts
git commit -m "feat: top-down 2D view toggle for VoxelGrid"
```

---

### Task 2: Scout Trigger Word + Role-Based Behavior

Only messages starting with "Scout" (case-insensitive) trigger the AI endpoint. All other messages are normal team chat. Pass the sender's role to the API, and adjust the AI system prompt so the Architect's Scout is describe-only (no `<actions>` tags) while the Builder's Scout keeps full build capabilities.

**Files:**
- Modify: `components/PlayerView.tsx:447-472`
- Modify: `app/api/ai/chat/route.ts`
- Modify: `lib/aiPrompt.ts`
- Modify: `components/ChatPanel.tsx:223-227`

**Step 1: Add Scout trigger check in `PlayerView.tsx`**

In `handleSendChat` (around line 447), change the AI trigger from `if (isRound2 ...)` to check for the "Scout" prefix:

```typescript
  const handleSendChat = useCallback(
    (text: string) => {
      // Always send team chat message
      send({ type: "chat", text });

      // Only fire AI endpoint if message starts with "Scout" (case-insensitive)
      const isScoutMessage = text.trim().toLowerCase().startsWith("scout");
      if (isRound2 && isScoutMessage && state.code) {
        setAiThinking(true);
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            roomCode: state.code,
            teamId,
            playerId,
            role,
            targetGrid: team?.roundTarget ?? state.currentTarget,
            aiActionLog: team?.aiActionLog?.slice(-10),
          }),
        }).catch(() => {
          setAiThinking(false);
        });
      }
    },
    [send, isRound2, state.code, teamId, playerId, role, team?.roundTarget, state.currentTarget, team?.aiActionLog]
  );
```

**Step 2: Accept `role` in the API route and pass to prompt builder**

In `app/api/ai/chat/route.ts`, destructure `role` from the request body (line 13):

```typescript
    const { roomCode, teamId, text, playerId, role, history, teamGrid, targetGrid: clientTarget, aiActionLog } = await req.json();
```

Pass `role` to `buildSystemPrompt` (line 36):

```typescript
    let systemPrompt = buildSystemPrompt(target, 2, aiActionLog, role);
```

**Step 3: Add role-based behavior to `lib/aiPrompt.ts`**

Update the `buildSystemPrompt` signature (line 30) to accept `role`:

```typescript
export function buildSystemPrompt(
  target: Grid,
  round: 1 | 2,
  aiActionLog?: { row: number; col: number; block: string }[],
  role?: "architect" | "builder"
): string {
```

At the end of the system prompt string (before the final backtick on line 136), add a role-specific section:

```typescript
${role === "architect" ? `

## IMPORTANT: Architect Mode
You are speaking with the ARCHITECT. The Architect designed this building and needs to DESCRIBE it to their teammate.
- NEVER include <actions> tags. You CANNOT place blocks for the Architect.
- Help the Architect describe their design clearly using chess notation.
- Suggest how to break down the description layer by layer.
- Be a communication coach, not a builder.` : `

## Builder Mode
You are speaking with the BUILDER. The Builder is trying to recreate the Architect's design.
- You CAN place blocks using <actions> tags.
- Help the Builder by placing blocks and describing what to do.
- Follow the Builder's instructions to build sections of the target.`}
```

**Step 4: Update chat placeholder in `ChatPanel.tsx`**

Update the placeholder text (around line 223) to hint about the Scout trigger:

```typescript
  const placeholder = disabled
    ? "Chat disabled"
    : isRound2
    ? "Chat or say \"Scout...\" for AI help"
    : "Chat with your team...";
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 6: Commit**

```bash
git add components/PlayerView.tsx app/api/ai/chat/route.ts lib/aiPrompt.ts components/ChatPanel.tsx
git commit -m "feat: Scout trigger word prefix + role-based AI behavior"
```

---

### Task 3: Keyboard Shortcuts for Block Selection

Number keys 1-9 and 0 map to block types during building phases. Show number hints on palette buttons.

**Files:**
- Modify: `components/BlockPalette.tsx`
- Modify: `components/PlayerView.tsx`

**Step 1: Add keyboard shortcut map to `BlockPalette.tsx`**

Add a constant after `BLOCK_ORDER` (after line 176):

```typescript
const HOTKEY_MAP: Record<string, BlockType> = {
  "1": "wall",
  "2": "floor",
  "3": "roof",
  "4": "window",
  "5": "door",
  "6": "concrete",
  "7": "plant",
  "8": "metal",
  "9": "table",
  "0": "empty",
};

const BLOCK_HOTKEYS: Record<BlockType, string> = Object.fromEntries(
  Object.entries(HOTKEY_MAP).map(([key, block]) => [block, key])
) as Record<BlockType, string>;
```

Export `HOTKEY_MAP` so `PlayerView.tsx` can use it:

```typescript
export { HOTKEY_MAP };
```

**Step 2: Show hotkey hint on palette buttons**

In the button JSX for each block (around line 325, the text label span), add a hotkey indicator:

```tsx
              {/* Text label + hotkey */}
              <span
                className={[
                  "font-[family-name:var(--font-pixel)] text-[7px] leading-tight",
                  "select-none",
                  isSelected ? "text-[#b89f65]" : "text-[#e8e0d0]/80",
                ].join(" ")}
              >
                {BLOCK_HOTKEYS[blockType] ? `${BLOCK_HOTKEYS[blockType]}:` : ""}{label}
              </span>
```

**Step 3: Add keyboard listener in `PlayerView.tsx`**

Import `HOTKEY_MAP` from BlockPalette:

```typescript
import BlockPalette, { HOTKEY_MAP } from "./BlockPalette";
```

Wait — we can't import from BlockPalette since it's a `"use client"` component. Instead, define the hotkey map inline or duplicate it. Better approach: add a `useEffect` for keyboard shortcuts directly in `PlayerView.tsx`.

Add a `useEffect` after the existing effects (around line 350, after the cleanup effect):

```typescript
  // Keyboard shortcuts for block selection (number keys 1-0)
  useEffect(() => {
    if (!isPlaying && !isDemo && !isDesign) return;
    // Only builders during rounds, or everyone during demo/design
    if (isPlaying && !isBuilder) return;

    const HOTKEYS: Record<string, BlockType> = {
      "1": "wall",
      "2": "floor",
      "3": "roof",
      "4": "window",
      "5": "door",
      "6": "concrete",
      "7": "plant",
      "8": "metal",
      "9": "table",
      "0": "empty",
    };

    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in chat input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const block = HOTKEYS[e.key];
      if (block) {
        setSelectedBlock(block);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isDemo, isDesign, isBuilder]);
```

**Step 4: Add hotkey hints to `BlockPalette.tsx` button labels**

This is self-contained in BlockPalette. Update the label span in the button map (around line 324-330):

Replace the `{label}` text with:

```tsx
                {BLOCK_HOTKEYS[blockType] && (
                  <span className="text-[#b89f65]/50 mr-0.5">{BLOCK_HOTKEYS[blockType]}</span>
                )}
                {label}
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 6: Commit**

```bash
git add components/BlockPalette.tsx components/PlayerView.tsx
git commit -m "feat: number key shortcuts for block selection (1-0)"
```

---

### Task 4: Host Sees Individual Player Designs During Design Phase

During the design phase, `TeamMosaic` shows individual player design tiles instead of team-based tiles. Each tile renders a player's `designGrid` with their name and team name.

**Files:**
- Modify: `components/TeamMosaic.tsx`

**Step 1: Add a `PlayerDesignCard` component**

Add after the existing `TeamCard` component (after line 128):

```typescript
function PlayerDesignCard({
  player,
  teamName,
  index,
}: {
  player: Player;
  teamName: string;
  index: number;
}) {
  if (!player.designGrid) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="flex flex-col rounded-lg border overflow-hidden bg-charcoal/70 backdrop-blur-sm border-gold/30"
    >
      {/* Player name + team badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-bark/40">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider uppercase leading-tight text-gold truncate">
            {player.name}
          </span>
          <span className="font-[family-name:var(--font-pixel)] text-[6px] tracking-wider uppercase text-cream/40 truncate">
            {teamName}
          </span>
        </div>
        {player.connected && (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-70" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage" />
          </span>
        )}
      </div>

      {/* Mini VoxelGrid of their designGrid */}
      <div className="flex-1 p-1 min-h-0">
        <VoxelGrid
          grid={player.designGrid}
          readOnly
          className="w-full h-full"
        />
      </div>
    </motion.div>
  );
}
```

**Step 2: Update the `TeamMosaic` component to switch modes**

Replace the `TeamMosaic` component body (starting at line 130) to handle design phase:

```typescript
export default function TeamMosaic({ teams, players, phase }: TeamMosaicProps) {
  const isDesign = phase === "design";

  if (isDesign) {
    // During design phase, show individual player design tiles
    const designPlayers = Object.values(players).filter(
      (p) => p.connected && p.designGrid != null
    );

    if (designPlayers.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-cream/30 font-[family-name:var(--font-pixel)] text-[10px]">
          Players are designing...
        </div>
      );
    }

    return (
      <div
        className={[
          "grid gap-3 h-full",
          designPlayers.length <= 2
            ? "grid-cols-2"
            : designPlayers.length <= 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        ].join(" ")}
      >
        {designPlayers.map((player, i) => (
          <PlayerDesignCard
            key={player.id}
            player={player}
            teamName={teams[player.teamId]?.name ?? "—"}
            index={i}
          />
        ))}
      </div>
    );
  }

  // Non-design: existing team-based view
  const teamList = Object.values(teams);

  if (teamList.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-cream/30 font-[family-name:var(--font-pixel)] text-[10px]">
        No teams yet
      </div>
    );
  }

  return (
    <div
      className={[
        "grid gap-3 h-full",
        teamList.length <= 2
          ? "grid-cols-2"
          : teamList.length <= 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      ].join(" ")}
    >
      {teamList.map((team, i) => (
        <TeamCard
          key={team.id}
          team={team}
          players={players}
          index={i}
          phase={phase}
        />
      ))}
    </div>
  );
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 4: Commit**

```bash
git add components/TeamMosaic.tsx
git commit -m "feat: host sees individual player designs during design phase"
```

---

### Task 5: Player End-of-Game Results on Phone

In the summary phase, replace the bare "Thank You" screen with a scrollable results section showing the team's target, scores, player designs, and the 500 Acres closing as a footer.

**Files:**
- Modify: `components/PlayerView.tsx:148-168` (WaitingSummary component)
- Modify: `components/PlayerView.tsx:511-519` (summary phase render)

**Step 1: Update `WaitingSummary` to accept state props**

Replace the `WaitingSummary` component (lines 148-168) with:

```typescript
function WaitingSummary({ team, player, allPlayers }: {
  team?: Team;
  player?: Player;
  allPlayers?: Record<string, Player>;
}) {
  // Gather player designs from the team
  const teamPlayerDesigns = team && allPlayers
    ? team.players
        .map(pid => allPlayers[pid])
        .filter((p): p is Player => p != null && p.designGrid != null)
    : [];

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-[#1a1510]">
      <div className="flex flex-col items-center gap-5 px-4 py-6">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.2em] uppercase text-[#6b8f71]">
          Game Complete
        </span>

        {/* Team scores */}
        {team && team.round1Score != null && team.round2Score != null && (
          <div className="w-full max-w-xs">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#e8e0d0]/40 text-center mb-2">
              {team.name} &mdash; Scores
            </p>
            <div className="flex justify-around gap-4 px-4 py-3 rounded-lg border border-white/10 bg-white/5">
              <div className="flex flex-col items-center gap-1">
                <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#8b5e3c]/70">
                  Round 1
                </span>
                <span className="font-[family-name:var(--font-pixel)] text-2xl text-[#b89f65]">
                  {team.round1Score}%
                </span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[#e8e0d0]/20 text-lg">&rarr;</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#6b8f71]">
                  Round 2
                </span>
                <span className="font-[family-name:var(--font-pixel)] text-2xl text-[#6b8f71]">
                  {team.round2Score}%
                </span>
              </div>
            </div>
            {/* Improvement delta */}
            {(team.round2Score ?? 0) > (team.round1Score ?? 0) && (
              <p className="font-[family-name:var(--font-pixel)] text-[9px] text-[#b89f65] text-center mt-2">
                +{(team.round2Score ?? 0) - (team.round1Score ?? 0)}% improvement!
              </p>
            )}
          </div>
        )}

        {/* Target preview */}
        {team?.roundTarget && (
          <div className="w-full max-w-xs">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#e8e0d0]/40 text-center mb-2">
              Target
            </p>
            <div className="h-32 rounded-lg border border-white/10 bg-white/5 p-1">
              <VoxelGrid grid={team.roundTarget} readOnly className="w-full h-full" />
            </div>
          </div>
        )}

        {/* Player designs gallery */}
        {teamPlayerDesigns.length > 0 && (
          <div className="w-full max-w-sm">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#e8e0d0]/40 text-center mb-2">
              Player Designs
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {teamPlayerDesigns.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-32 h-28 rounded-lg border border-white/10 bg-white/5 p-1">
                    <VoxelGrid grid={p.designGrid!} readOnly className="w-full h-full" />
                  </div>
                  <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#e8e0d0]/60">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 500 Acres closing — smaller footer */}
        <div className="mt-4 pt-4 border-t border-white/10 w-full max-w-xs text-center">
          <p className="font-[family-name:var(--font-serif)] text-xs leading-relaxed text-[#e8e0d0]/50 italic">
            500 Acres is building AI-powered pipelines so Gen Z can construct real homes &mdash;
            using the same kind of AI collaboration you just experienced.
          </p>
          <a
            href="https://500acres.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-[#6b8f71] underline underline-offset-4 mt-2 inline-block"
          >
            500acres.org
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update the summary phase render to pass props**

Replace the summary phase block (lines 511-519):

```tsx
  if (phase === "summary") {
    return (
      <div className="flex flex-col h-dvh overflow-hidden bg-[#1a1510]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={true} />}
        <WaitingSummary team={team} player={player} allPlayers={state.players} />
      </div>
    );
  }
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 4: Commit**

```bash
git add components/PlayerView.tsx
git commit -m "feat: player end-of-game results with scores, target, and designs"
```

---

### Task 6: Clickable Team Detail on Host Results Screen

Make leaderboard rows clickable in `FinalSummary`. Clicking opens a modal showing team details: players, designs, round builds vs target with scoring overlays, and score improvement.

**Files:**
- Modify: `components/FinalSummary.tsx`
- Modify: `components/HostView.tsx:522-527` (pass `players` to FinalSummary)

**Step 1: Add `players` prop to `FinalSummary`**

Update the interface and component (lines 6-8 and 71):

```typescript
interface FinalSummaryProps {
  teams: Team[];
  players?: Record<string, Player>;
}
```

Import Player type and VoxelGrid (line 4):

```typescript
import type { Team, Player } from "@/lib/types";
import VoxelGrid from "./VoxelGrid";
```

Update the component signature:

```typescript
export default function FinalSummary({ teams, players }: FinalSummaryProps) {
```

**Step 2: Add team detail modal state and component**

Add after the `DeltaBadge` component (after line 56):

```typescript
function TeamDetailModal({
  entry,
  players,
  onClose,
}: {
  entry: RankedTeam;
  players: Record<string, Player>;
  onClose: () => void;
}) {
  const team = entry.team;
  const teamPlayers = team.players
    .map(pid => players[pid])
    .filter(Boolean) as Player[];

  const designPlayers = teamPlayers.filter(p => p.designGrid != null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-charcoal border border-gold/30 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-[family-name:var(--font-pixel)] text-lg text-gold tracking-wider">
              {team.name}
            </h2>
            <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 tracking-wider uppercase mt-1">
              {teamPlayers.map(p => p.name).join(" & ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-cream/40 hover:text-cream hover:bg-white/10 transition-colors text-lg"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Scores summary */}
        <div className="flex items-center justify-center gap-8 px-6 py-4 border-b border-white/10">
          <div className="text-center">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest mb-1">Round 1</p>
            <p className="font-[family-name:var(--font-pixel)] text-2xl text-cream/60">{entry.r1}%</p>
          </div>
          <span className="text-cream/20 text-2xl">&rarr;</span>
          <div className="text-center">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest mb-1">Round 2</p>
            <p className="font-[family-name:var(--font-pixel)] text-2xl text-sage">{entry.r2}%</p>
          </div>
          <div className="text-center">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest mb-1">Change</p>
            <p className="text-xl"><DeltaBadge delta={entry.delta} /></p>
          </div>
        </div>

        {/* Player designs */}
        {designPlayers.length > 0 && (
          <div className="px-6 py-4 border-b border-white/10">
            <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/30 uppercase tracking-widest mb-3 text-center">
              Player Designs
            </p>
            <div className="grid grid-cols-2 gap-4">
              {designPlayers.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <div className="w-full h-40 rounded-lg border border-white/10 bg-white/5 p-1">
                    <VoxelGrid grid={p.designGrid!} readOnly className="w-full h-full" />
                  </div>
                  <span className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/60">
                    {p.name}&apos;s design
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round builds with scoring overlay */}
        <div className="px-6 py-4">
          <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/30 uppercase tracking-widest mb-3 text-center">
            Builds vs Target
          </p>

          {/* Round 1 */}
          {team.roundTarget && (
            <div className="mb-4">
              <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest mb-2">
                Round 1 — {entry.r1}%
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full h-32 rounded-lg border border-white/10 bg-white/5 p-1">
                    <VoxelGrid grid={team.roundTarget} readOnly className="w-full h-full" />
                  </div>
                  <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/30">Target</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full h-32 rounded-lg border border-white/10 bg-white/5 p-1">
                    <VoxelGrid
                      grid={team.grid}
                      readOnly
                      showScoring
                      targetGrid={team.roundTarget}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/30">Build</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

**Step 3: Add modal state and make rows clickable**

In the `FinalSummary` component, add state for the selected team (after `const topTeam = ranked[0];` on line 75):

```typescript
  const [selectedTeam, setSelectedTeam] = useState<RankedTeam | null>(null);
```

Add the `useState` import — it's already imported via `motion` from framer-motion. Actually, we need to add it from React. Update the import at the top of the file:

```typescript
import { useState } from "react";
```

Add the modal render and AnimatePresence at the end of the component, just before the closing `</div>` (around line 277):

```tsx
        {/* Team detail modal */}
        {players && (
          <AnimatePresence>
            {selectedTeam && (
              <TeamDetailModal
                entry={selectedTeam}
                players={players}
                onClose={() => setSelectedTeam(null)}
              />
            )}
          </AnimatePresence>
        )}
```

Make each leaderboard row clickable. In the `ranked.map(...)` section (around line 146), add `onClick` and `cursor-pointer` to the `motion.div`:

Change the className to include `cursor-pointer` and add an `onClick`:

```tsx
              <motion.div
                key={entry.team.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                onClick={() => players && setSelectedTeam(entry)}
                className={[
                  "flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
                  players ? "cursor-pointer hover:bg-white/10" : "",
                  isTop
                    ? "border-gold/40 bg-gold/8"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
```

**Step 4: Pass `players` from `HostView.tsx` to `FinalSummary`**

In `SummaryView` (around line 527):

```tsx
        <FinalSummary teams={teams} players={state.players} />
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 6: Commit**

```bash
git add components/FinalSummary.tsx components/HostView.tsx
git commit -m "feat: clickable team detail modal on host results screen"
```

---

## Final Verification

Run all checks:

```bash
npx tsc --noEmit
npx next build
npx jest --testPathIgnorePatterns=simulate-game
```

All should pass clean.

## Summary of Changes

| Feature | Files Modified |
|---------|---------------|
| Top-down view toggle | `VoxelGrid.tsx`, `voxelRenderer.ts` |
| Scout trigger + roles | `PlayerView.tsx`, `route.ts`, `aiPrompt.ts`, `ChatPanel.tsx` |
| Keyboard shortcuts | `BlockPalette.tsx`, `PlayerView.tsx` |
| Host design visibility | `TeamMosaic.tsx` |
| Player results | `PlayerView.tsx` |
| Clickable team detail | `FinalSummary.tsx`, `HostView.tsx` |
