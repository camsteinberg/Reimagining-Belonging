# Playtest Polish — Design

## Problem

After playtesting, several UX issues and missing features surfaced: architects can't read coordinates through stacked blocks, Scout responds to every chat message (noisy), players get no results on their phones after the game, the host can't see player designs during design phase, and there's no way to drill into team details on the results screen. Block selection is also click-only with no keyboard shortcuts.

## Features

### 1. Top-Down View Toggle

Add a toggle button next to the rotation unlock button in VoxelGrid. When active, renders a flat 2D overhead projection where all coordinate labels (A1-F6) are visible through any block stack. Each cell shows its top block as a colored square. Solves the "can't see coordinates through stacked blocks" problem.

**Files:** `VoxelGrid.tsx`, `voxelRenderer.ts`, `voxel.ts`

### 2. Scout Trigger Word + Role-Based Behavior

**Trigger word:** Only messages starting with "Scout" (case-insensitive) get sent to the AI endpoint. All other messages are normal team chat. Check client-side in `PlayerView.tsx` before firing the fetch.

**Role-based behavior:** Pass sender's `role` to the AI endpoint. Adjust system prompt:
- Architect's Scout: Describe-only mode. Describes target, suggests plans, explains layouts. Never includes `<actions>` tags.
- Builder's Scout: Full mode (current behavior). Can describe AND place blocks via `<actions>`.

**Files:** `PlayerView.tsx`, `app/api/ai/chat/route.ts`, `lib/aiPrompt.ts`, `ChatPanel.tsx`

### 3. Keyboard Shortcuts for Block Selection

Number keys map to blocks during building phases:

```
1=wall  2=floor  3=roof  4=window  5=door
6=concrete  7=plant  8=metal  9=table  0=empty (erase)
```

Barrel, pipe, air left off hotkeys (rare use, still available via palette click). Show number hint on each palette button.

**Files:** `PlayerView.tsx` or `BlockPalette.tsx`

### 4. Host Sees Individual Player Designs During Design Phase

During design phase, `TeamMosaic` switches from team-based tiles to player-based tiles. Each tile shows a player's `designGrid` with their name and team name as label. Outside design phase, keeps current team-based rendering.

**Files:** `TeamMosaic.tsx`

### 5. Player End-of-Game Results

In the summary phase on player phones, add a scrollable results section above the existing thank-you message:
- Team's target (small VoxelGrid of `team.roundTarget`)
- Team's R1 and R2 scores side by side
- All player designs gallery (scrollable row of small VoxelGrid tiles with names)

500 Acres closing message stays as smaller footer. Pass `state` to `WaitingSummary`.

**Files:** `PlayerView.tsx`

### 6. Clickable Team Detail on Host Results Screen

Make leaderboard rows clickable in `FinalSummary`. Click opens modal showing:
- Team name + players
- Both player designs (side-by-side VoxelGrids)
- Round 1: target + build + score (with scoring overlay)
- Round 2: target + build + score (with scoring overlay)
- Improvement delta

Add `players` prop to FinalSummary.

**Files:** `FinalSummary.tsx`, `HostView.tsx`

## Not Included

No changes to scoring engine, timer system, or phase transitions. No new server-side state — all data already exists on `RoomState`.
