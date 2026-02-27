# Blueprint Telephone

A Jackbox-style multiplayer building game by [500 Acres](https://500acres.org) that demonstrates how AI transforms what Gen Z can build — directly supporting the thesis that AI-powered instruction pipelines let young people construct homes they couldn't build alone.

## Quick Start

```bash
# Development (run both in parallel)
npm run dev          # Next.js frontend on :3000
npx partykit dev     # WebSocket server on :1999

# Build & Test
npx next build       # Production build
npx tsc --noEmit     # Type check (ignore simulate-game.ts errors — missing @types/ws)
npx jest             # Run tests (ignore simulate-game.ts — requires running PartyKit)

# Deploy
npx vercel --prod              # Frontend → blueprint-telephone.vercel.app
npx partykit deploy            # WebSocket → blueprint-telephone.camsteinberg.partykit.dev
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| React | React | 19.2.3 |
| Real-time | PartyKit (WebSocket rooms) | 0.0.115 |
| AI | Anthropic Claude API (Sonnet 4.6) | SDK 0.78.0 |
| Styling | Tailwind CSS | 4.x |
| Animations | Framer Motion | 12.34.3 |
| Rendering | Canvas 2D with pixel-perfect ImageData sprites | Custom |
| Testing | Jest + ts-jest | 30.2.0 |
| Deploy | Vercel (frontend) + PartyKit (WebSocket) | — |

**No database.** All game state lives in-memory on the PartyKit server for the session duration.

## Environment Variables

- `ANTHROPIC_API_KEY` — Claude API key (server-side only, required for Round 2 AI)
- `PARTYKIT_HOST` / `NEXT_PUBLIC_PARTYKIT_HOST` — PartyKit server URL (defaults to `blueprint-telephone.camsteinberg.partykit.dev`)
- `PARTY_SECRET` — Shared secret for API→PartyKit HTTP communication (defaults to `dev-secret`)

## Game Concept

Teams of 2 split into **Architects** (who see a target structure) and **Builders** (who see a blank isometric grid). The Architect must communicate what to build via text chat.

- **Design Phase** (optional): Each player independently builds their own creative structure. These become the targets for the rounds.
- **Round 1 ("Old School")**: Text chat only. Architects describe their own design; Builders interpret and place blocks manually.
- **Round 2 ("With Robots")**: Roles swap. Now every team gets **Scout**, an AI co-builder (Claude Sonnet 4.6) that can describe, instruct, AND physically place blocks from natural language.

The side-by-side reveal shows scores jumping dramatically, demonstrating the power of AI-assisted communication.

## Game Flow

```
lobby → [design (2 min)] → lobby → round1 (3 min) → reveal1 → interstitial → round2 (3 min) → finalReveal → summary
         optional                                       roles swap here
```

| Phase | Duration | Description |
|-------|----------|-------------|
| Lobby | ~2 min | Host projects room code. Players join on phones. Auto-assign to strict 2-player teams. |
| Design | 2 min | Each player builds their OWN creation on a personal grid. Optional — host clicks "Start Design Phase". |
| Demo | 60s | Free-build practice. Optional — host clicks "Practice Round". |
| Round 1 | 3 min | Architect sees their own design as target (or prepopulated target if no design phase). Builder sees blank grid. Text chat only. |
| Reveal 1 | ~2 min | Side-by-side: each team's build vs target. Score animation. Host clicks through teams. |
| Interstitial | ~30s | Cinematic transition — "Now let's try... WITH ROBOTS". Roles swap automatically. |
| Round 2 | 3 min | New architect sees THEIR design as target. Scout AI joins chat. Can describe, instruct, AND build. |
| Final Reveal | ~3 min | Round 1 vs Round 2 comparison. Score deltas. Most-improved leaderboard. |
| Summary | — | Aggregate stats. 500 Acres closing statement. Clickable team detail modals. |

**Role rotation**: Architects become Builders (and vice versa) between rounds so everyone experiences both perspectives.

**Design → Target flow**: Each player builds independently during design. When a round starts, the team's architect's `designGrid` becomes the team's `roundTarget`. The architect describes what THEY built to their builder teammate.

## Architecture

### Grid System (3D)

The building grid is a 6x6x6 array: `Grid = Cell[][][]` where `grid[row][col][height]`.

- **13 block types**: `wall`, `floor`, `roof`, `window`, `door`, `plant`, `table`, `metal`, `concrete`, `barrel`, `pipe`, `air`, `empty`
- **Auto-stacking**: Clicking a cell places the block on top of the existing stack (up to 6 high)
- **Auto-erase**: Selecting "empty" and clicking removes the topmost block
- **Door auto-stack**: Doors auto-place 2 blocks high; erasing removes both
- **Air blocks**: Invisible scaffolding — takes up space but doesn't render or affect score
- **Targets**: 8 pre-designed multi-layer 3D structures (4 per round), or player-designed targets from the design phase
- **Coordinate system**: Chess-style notation — columns A-F (left to right), rows 1-6 (back to front)

### Rendering

Canvas 2D with pixel-perfect isometric voxel sprites:
- Pre-rendered ImageData sprite atlas with 13 block types × 4 rotations
- Soft color-matched outlines (not black) for a seamless pixel art look
- Height-offset rendering for stacked blocks
- Hover preview at correct stack height with ghost block
- 4-rotation support with swipe gestures or button controls
- **2D top-down view**: Toggleable flat overhead view with coordinate labels in every cell
- **3D axis labels**: Column letters (A-F) and row numbers (1-6) rendered with background pills for visibility
- SimCity / Habbo Hotel aesthetic — warm, retro-futuristic
- DPR-aware scaling for Retina displays

### Real-time Communication

PartyKit WebSocket rooms handle:
- Team chat messages (routed per-team)
- Grid updates (individual block placements broadcast to team)
- Design grid updates (per-player during design phase)
- Timer sync (pause/resume supported)
- Phase transitions
- AI build action broadcasts
- Player join/leave/reconnect presence

### AI Integration (Round 2 Only)

Scout (Claude Sonnet 4.6) has role-based behavior:

**Builder's Scout** can:
1. **Build**: Place blocks directly via `<actions>` JSON tags in responses
2. **Describe**: Explain the target structure in plain language
3. **Fix**: Adjust existing placements
4. **Undo**: Remove recently placed blocks

**Architect's Scout** can only:
1. **Describe**: Help the architect describe their design to the builder
2. **Coach**: Suggest simple descriptions ("Tell them: walls along the back, floors in the middle")
3. **CANNOT** place blocks (no `<actions>` tags allowed)

**Trigger**: Only messages starting with "Scout" (case-insensitive) are sent to the AI endpoint. All other messages are regular team chat.

**Flow**: Player message → `/api/ai/chat` route → Claude API (max_tokens: 150) → Parse `<actions>` tags → HTTP POST to PartyKit room → Grid updates + chat broadcast.

**Prompt design**: Strict brevity rules — 1-sentence max responses, no coordinates in player-facing text, plain spatial language ("back wall" not "A1-A6"), BAD vs GOOD examples embedded in prompt.

**Error handling**: Parser handles multiple `<actions>` blocks and whitespace. Failed PartyKit push retries with text-only fallback. Client clears "thinking" indicator after 20 seconds. Rate limit: 3 seconds per team.

### Host Controls

| Phase | Available Actions |
|-------|-------------------|
| Lobby | Practice Round, Start Design Phase, Start Round 1, Kick Player |
| Design | End Design Phase, Pause/Resume |
| Demo | End Practice, Pause/Resume |
| Round 1/2 | Skip to Reveal, Pause/Resume |
| Reveal 1 | Continue (next team), Previous team |
| Interstitial | Start Round 2 |
| Final Reveal | Show Summary |
| Summary | Play Again |

### Keyboard Shortcuts

Block selection via number keys (active during building phases):
```
1=Wall  2=Floor  3=Roof  4=Window  5=Door  6=Concrete  7=Plant  8=Metal  9=Table  0=Erase
```

Only active for Builders during round play, and for all players during design/demo. Disabled when chat input is focused.

### Tutorial System

Phase-specific walkthrough overlays appear on first entry to each phase (tracked via `sessionStorage`):
- **Design**: "Build your own creation! Your teammate will try to recreate it later."
- **Round 1 Architect**: "You designed this building! Describe it to your Builder using coordinates."
- **Round 1 Builder**: "Your teammate designed a building. Listen to their descriptions and recreate it!"
- **Round 2**: "Roles swapped! Scout the AI robot can help. Try 'Scout, build the ground floor'."

### Chat Tips

Collapsible tip panels in the chat area, specific to role and phase:
- Tips start **expanded** when chat is empty
- **Auto-collapse** after the first message arrives
- **"?" button** in chat header lets players re-open tips anytime
- Round 1 tips: describe/listen guidance (no Scout references)
- Round 2 Architect tips: describing + Scout can help describe
- Round 2 Builder tips: building + Scout can build for you

## Project Structure

```
GenZvsRobots/
├── app/
│   ├── page.tsx                    # Home — Host/Join buttons
│   ├── layout.tsx                  # Root layout, fonts, global CSS
│   ├── host/[code]/page.tsx        # Host view (projector screen)
│   ├── join/[code]/page.tsx        # Player name entry
│   ├── play/[code]/page.tsx        # Player game view
│   └── api/ai/chat/route.ts       # AI endpoint (Claude proxy + action dispatch)
├── components/
│   ├── PlayerView.tsx              # Builder/Architect game interface (main player UI)
│   ├── HostView.tsx                # Host screen (lobby, rounds, reveals, summary)
│   ├── HostControls.tsx            # Host action buttons per phase
│   ├── VoxelGrid.tsx               # Canvas-based isometric grid component (2D/3D)
│   ├── BlockPalette.tsx            # Block type selector strip with hotkey hints
│   ├── ChatPanel.tsx               # Team chat + AI messages + collapsible tips
│   ├── GameHeader.tsx              # Phase/role/timer header bar
│   ├── Timer.tsx                   # Countdown timer display
│   ├── TutorialOverlay.tsx         # Phase-specific walkthrough slides
│   ├── TeamMosaic.tsx              # Host view: all teams' grids + player designs
│   ├── RevealCarousel.tsx          # Reveal 1: target vs build side-by-side
│   ├── RoundComparison.tsx         # Final reveal: R1 vs R2 comparison
│   ├── FinalSummary.tsx            # Summary: leaderboard + team detail modals
│   ├── RoundTransition.tsx         # Cinematic interstitial animation
│   ├── ScoreGauge.tsx              # Animated percentage gauge
│   ├── Confetti.tsx                # Confetti particle overlay
│   └── TerrainBackground.tsx       # Home page terrain SVG backdrop
├── lib/
│   ├── types.ts                    # All TypeScript types (Grid, Player, Team, etc.)
│   ├── constants.ts                # GRID_SIZE=6, MAX_HEIGHT=6, durations, helpers
│   ├── targets.ts                  # 8 multi-layer 3D target structures (4 per round)
│   ├── scoring.ts                  # Cell-by-cell 3D comparison engine
│   ├── aiPrompt.ts                 # System prompt builder for Scout (brevity-focused)
│   ├── parseAIActions.ts           # Extract <actions> JSON from AI response (multi-block)
│   ├── usePartySocket.ts           # React hook for PartyKit WebSocket + state sync
│   ├── voxelRenderer.ts            # Canvas 2D isometric + top-down renderer
│   ├── voxel.ts                    # Isometric math (coordinate transforms, rotations)
│   └── sprites.ts                  # Pixel-perfect ImageData sprite atlas
├── party/
│   ├── index.ts                    # PartyKit server (WebSocket + HTTP handler)
│   └── gameState.ts                # Server-side game state machine (all phase logic)
├── __tests__/
│   ├── scoring.test.ts             # Scoring engine tests (15 tests)
│   ├── parseAIActions.test.ts      # AI response parser tests (15 tests)
│   └── simulate-game.ts            # Integration test (requires running PartyKit, ignore)
└── docs/plans/                     # Design docs and implementation plans
```

## Visual Design

### Aesthetic
SimCity pixel art meets warm architectural — retro-futuristic yet homey. "Firewatch meets SimCity."

### Color Palette (500 Acres brand)

| Role | Color | Hex |
|------|-------|-----|
| Backgrounds | Cream / Warm White | `#e8e0d0` / `#f5f1ea` |
| Primary blocks | Rust (Wall) | `#8b5e3c` |
| Accents & scores | Gold | `#b89f65` |
| Robot/AI glow | Sage / Forest | `#6b8f71` / `#3d6b4f` |
| Text | Charcoal | `#2a2520` |
| Wrong cells | Ember | `#c45d3e` |
| Correct cells | Moss | `#365f45` |

### Typography
- **Pixel font** (`--font-pixel`): Headers, UI labels, room codes, game text
- **Body font** (`--font-body`): Chat messages, descriptions
- **Serif font** (`--font-serif`): Closing mission statement

### Round Visual Identity
- **Round 1 ("Old School")**: Warm cream backgrounds, rust/gold accents. Analog, imperfect feel.
- **Round 2 ("With Robots")**: Dark backgrounds (`#1a1510`), sage/forest accents, digital shimmer on AI-placed blocks. Modern, capable, alive.

## Scoring

- Cell-by-cell 3D comparison across all 6 height layers
- `air` blocks treated as `empty` for scoring (invisible scaffolding doesn't count)
- Score = percentage of cells matching (correct block type at correct position)
- Penalizes extra blocks (built where target has empty)
- Final reveal ranks teams by **most improved** (R2 score - R1 score), not highest score — rewarding the learning effect

## Target Audience & Context

- **Event**: 500 Acres monthly forum, February 27, 2026
- **Audience**: 10-25 panelists (experts, mentors, students), hybrid (in-person + remote)
- **Setup**: Host laptop connected to projector, players join on phones/laptops via room code
- **Purpose**: Demonstrate that communication + AI transforms building capability. The dramatic score improvement between rounds is the thesis in action.

## Key Implementation Details

### Per-Player Design System
- Each `Player` has a `designGrid: Grid | null` field
- During design phase, `placeBlock()` routes to `player.designGrid` instead of `team.grid`
- `designGridUpdate` WebSocket messages sync individual player designs
- On `startRound()`, the team's architect's `designGrid` becomes `team.roundTarget`
- Host view (TeamMosaic) shows individual `PlayerDesignCard` components during design

### State Machine (gameState.ts)
- All phase transitions go through exported functions: `startDesign`, `endDesign`, `startDemo`, `endDemo`, `startRound`, `endRound`, `advancePhase`, `resetToLobby`
- `placeBlock()` accepts `playerId` parameter to route design-phase blocks to player grids
- `calculateAllScores()` compares `team.grid` against `team.roundTarget` for each team
- Reconnection via `reconnectToken` (stored in localStorage on player's device)

### WebSocket Message Types
- **Client→Server**: `join`, `placeBlock`, `chat`, `hostAction`, `aiChat`, `setTeamName`, `setTheme`, `leaveGame`
- **Server→Client**: `state`, `gridUpdate`, `designGridUpdate`, `chat`, `aiBuilding`, `timer`, `phaseChange`, `error`, `playerJoined`, `reconnected`, `scores`, `kicked`

## Known Issues

- `simulate-game.ts` test requires a running PartyKit server — always fails in CI. Ignore it.
- TypeScript errors in `simulate-game.ts` for missing `@types/ws` — pre-existing, doesn't affect build.
