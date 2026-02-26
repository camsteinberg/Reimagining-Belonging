# Blueprint Telephone — Final Polish Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Bring Blueprint Telephone to its final, most playable and polished version for the Friday showcase.

**Context:** Based on comprehensive game testing feedback. The game works but needs grid improvements, new blocks, Scout AI refinements, better instructions, bug fixes, and player management features.

---

## 1. Grid System Overhaul

- **Grid size:** 8x8 → **6x6**
- **Max height:** 4 → **6**
- **Coordinate system:** Chess notation — columns A-F, rows 1-6. Cell "B3" = column B, row 3.
- **Axis labels:** Rendered on the ground plane at edges of the isometric grid in the pixel font, subtle color.
- **Scout integration:** System prompt uses chess notation exclusively. Natural language says "B3" not "(row:2, col:1)". `<actions>` JSON still uses numeric row/col internally.
- **Click targeting:** 6x6 tiles are larger on screen. Recalibrate `screenToGrid()` to account for block height when clicking tall stacks — check columns from tallest to shortest in draw order so clicking the visible top face of a tall stack picks that column, not the ground tile behind it.
- **Timings:** Design phase = 2 min, Rounds = 3 min each.
- **All existing targets** must be redesigned for 6x6x6 grid.

## 2. New Blocks & Improved Textures

**New utility/workshop blocks:**
- **metal** — Steel/iron for workshops, sheds, industrial structures
- **concrete** — Gray concrete for foundations, garages, utility buildings
- **barrel** — Round barrel/drum for workshops, storage areas
- **pipe** — Cylindrical pipe for plumbing, industrial detail

**Texture improvements:** Redraw all sprites at higher fidelity for larger tile size. Sharper mortar lines on walls, crisper glass on windows, more defined shingle detail on roofs.

**Palette update:** With 13+ block types, the palette scrolls horizontally. Player swipes to see all blocks.

**Block type legend:** "?" button near the palette opens a reference overlay showing all blocks with mini sprite + name + one-word description. Tap anywhere to dismiss.

## 3. Team Management

- **Strict 2-player teams:** No 3-player exception. Always exactly 2.
- **Odd player warning:** Host sees yellow warning banner when player count is odd. Start buttons disabled until resolved.
- **Team roster locking:** `rebalanceTeams()` only runs before first round. Once round 1 starts, team rosters are locked for the session. Roles still swap between rounds.
- **Host kick:** Each player in the host lobby has an "X" button. Sends `kickPlayer` action, removes player, redirects them to home with message.
- **Player exit:** Exit icon in GameHeader (all phases). Confirmation dialog: "Leave this game?" with Stay/Leave. On confirm: `removePlayer()`, redirect to home. Remaining teammate gets "Your partner left" notice.

## 4. Chat & Design Phase

- **Chat in design phase:** Enable chat panel during design so teammates can coordinate ("Let's make a workshop!").
- **No Scout in design:** Chat is player-to-player only. Scout appears only in Round 2.
- **Design flow unchanged:** Host clicks "Start Design Phase" from lobby → 2 min build → returns to lobby → host clicks "Start Round 1".

## 5. Scout AI Overhaul

**Chess notation:** All communication uses A1-F6. Prompt includes mapping: "Column A = leftmost, Column F = rightmost. Row 1 = back, Row 6 = front."

**Always build when asked:** "When a player asks you to build something, ALWAYS include `<actions>` tags. Never respond with just text when the player wants blocks placed. If ambiguous, place your best interpretation AND ask a clarifying question."

**No raw code:** "Never show raw JSON, code, or coordinate arrays in your text. Your text should be natural, friendly language only."

**Clarifying questions:** "If a request is vague ('build a house'), make a reasonable attempt AND ask what to adjust. If specific ('place glass at B2'), just do it. Always bias toward action over clarification."

**High-level commands:** Scout interprets creative requests ("build a glass house") as multi-block builds, generating a reasonable structure.

**Build action log with undo:** Server tracks last 10 Scout-placed actions per team. Included in conversation context. "Undo last 3" → Scout generates `<actions>` placing "empty" at those coordinates.

**Intent detection:** Scout categorizes messages as: describe, build, fix, undo, or question. Determines intent first, then acts.

## 6. UI & UX Improvements

**Step-by-step walkthrough (replaces 5-second overlay):**
- **Round 1:** (1) "You're the [role]!" + explanation, (2) "How to build" + visual, (3) "Use chat + coordinates like B3!", (4) "Go!"
- **Round 2:** (1) "Roles swapped!", (2) "Meet Scout" + intro, (3) Example prompts, (4) "Go!"
- **Design:** (1) "Design a building for the other team!", (2) "Everyone builds + chat to coordinate!", (3) "Go!"
- Players must tap through all slides. No auto-dismiss.

**Pause button fix:** On pause, store `remainingTime = timerEnd - Date.now()`. On resume, set `timerEnd = Date.now() + remainingTime`. Currently pause doesn't adjust timerEnd, so the timer may "expire" during pause.

**Click precision for tall stacks:** During hit-testing, check columns from tallest to shortest. If click falls within visible top face of a tall stack, pick that column.

**Floor tile erase fix:** In erase mode, expand hit area for floor-height blocks to match normal block size — entire ground tile is the click target.

## 7. Player Management & Navigation

**Exit button:** Door/exit icon in top-right of GameHeader, all phases. Confirmation dialog in pixel font: "Leave this game?" with Stay/Leave. On confirm: removePlayer(), redirect to `/`.

**Host kick in lobby:** "X" button per player in host team roster. `kickPlayer` host action → server removes player → sends error message → client redirects to home.

**Odd player warning:** Yellow banner on host screen when player count is odd. Start buttons disabled.

## 8. Target Redesigns (6x6x6)

**Round 1 targets** (simpler):
- Small cabin (walls, floor, roof, door, window)
- Garden shed (walls, floor, roof, barrel, plant)
- Workshop (metal, concrete, door, table, window)
- Watchtower (tall, walls, window, roof)

**Round 2 targets** (complex, showcase AI):
- Factory (metal, concrete, pipe, barrel, windows)
- Two-story house (full height, doors, windows, roof, plants)
- Market stall (tables, roof, open sides, plants)
- Fortress (walls, windows, multiple heights)

New utility blocks appear in at least half the targets.

---

## Files Affected (Estimated)

| File | Changes |
|------|---------|
| `lib/constants.ts` | GRID_SIZE=6, MAX_HEIGHT=6, new timings, new block colors/labels |
| `lib/types.ts` | New BlockType entries, new HostAction (kickPlayer), new ClientMessage (leaveGame) |
| `lib/sprites.ts` | 4 new block sprite drawings, improved textures on all existing sprites |
| `lib/targets.ts` | Complete rewrite — 8 new targets for 6x6x6 |
| `lib/voxelRenderer.ts` | Axis label rendering, improved hit-testing |
| `lib/voxel.ts` | Updated coordinate transforms for 6x6 |
| `lib/aiPrompt.ts` | Chess notation, stronger build directives, undo log context, intent detection |
| `lib/scoring.ts` | Update for new grid dimensions (should just work via constants) |
| `party/gameState.ts` | Strict 2-player teams, kick player, lock rosters, action log, remove rebalance on later rounds |
| `party/index.ts` | kickPlayer action, leaveGame message, pause fix, design chat |
| `components/PlayerView.tsx` | Exit button, design chat, walkthrough integration |
| `components/HostView.tsx` | Kick buttons, odd player warning |
| `components/HostControls.tsx` | Disable start when odd players |
| `components/VoxelGrid.tsx` | Height-aware click detection, axis labels |
| `components/BlockPalette.tsx` | Scrollable palette, new blocks |
| `components/ChatPanel.tsx` | Enable in design phase |
| `components/GameHeader.tsx` | Exit button |
| `components/TutorialOverlay.tsx` | Complete rewrite → step-by-step walkthrough |
| `app/api/ai/chat/route.ts` | Action log tracking, pass to prompt |
| `app/page.tsx` | Handle kicked-player redirect message |
