# Blueprint Telephone

A 17-minute Jackbox-style multiplayer building game by [500 Acres](https://500acres.org) that demonstrates how AI transforms what Gen Z can build — directly supporting the thesis that AI-powered instruction pipelines let young people construct homes they couldn't build alone.

## Quick Start

```bash
# Development
npm run dev          # Next.js frontend on :3000
npx partykit dev     # WebSocket server on :1999

# Build & Test
npx next build       # Production build
npx tsc --noEmit     # Type check
npx jest             # Run tests (ignore simulate-game.ts)

# Deploy
npx vercel --prod              # Frontend
npx partykit deploy            # WebSocket server
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

## Game Concept

Teams of 2-3 split into **Architects** (who see a target structure) and **Builders** (who see a blank isometric grid). The Architect must communicate what to build.

- **Round 1 ("Old School")**: Text chat only. Architects describe; Builders interpret and place blocks manually.
- **Round 2 ("With Robots")**: New harder target, but now every team gets **Scout**, an AI co-builder (Claude Sonnet 4.6) that can describe, instruct, AND physically place blocks from natural language.

The side-by-side reveal shows scores jumping dramatically, demonstrating the power of AI-assisted communication.

## Game Flow

```
lobby → round1 (5 min) → reveal1 → interstitial → round2 (5 min) → finalReveal → summary
```

| Phase | Duration | Description |
|-------|----------|-------------|
| Lobby | ~2 min | Host projects room code. Players join on phones. Auto-assign teams + roles. |
| Round 1 | 5 min | Target visible to Architect only. Builders place blocks. Text chat only. |
| Reveal 1 | ~2 min | Side-by-side: each team's build vs target. Score animation. |
| Interstitial | ~30s | Cinematic transition — "Now let's try... WITH ROBOTS" |
| Round 2 | 5 min | New harder target. Scout AI joins. Can describe, instruct, AND build. |
| Final Reveal | ~3 min | Round 1 vs Round 2 comparison. Score deltas. Most-improved leaderboard. |
| Summary | — | Aggregate stats. 500 Acres closing statement. |

**Role rotation**: Architects become Builders (and vice versa) between rounds so everyone experiences both perspectives.

## Architecture

### Grid System (3D)

The building grid is an 8x8x4 array: `Grid = Cell[][][]` where `grid[row][col][height]`.

- **Block types**: `wall`, `floor`, `roof`, `window`, `door`, `empty`
- **Auto-stacking**: Clicking a cell places the block on top of the existing stack (up to 4 high)
- **Auto-erase**: Selecting "empty" and clicking removes the topmost block
- **Targets**: 8 pre-designed multi-layer 3D structures (4 per round, randomly selected)

### Rendering

Canvas 2D with pixel-perfect isometric voxel sprites:
- Pre-rendered ImageData sprite atlas with 6 block types × 4 rotations
- Soft color-matched outlines (not black) for a seamless pixel art look
- Height-offset rendering for stacked blocks
- Hover preview at correct stack height
- 4-rotation support with swipe gestures
- SimCity / Habbo Hotel aesthetic — warm, retro-futuristic

### Real-time Communication

PartyKit WebSocket rooms handle:
- Team chat messages (routed per-team)
- Grid updates (individual block placements broadcast to team)
- Timer sync
- Phase transitions
- AI build action broadcasts
- Player join/leave presence

### AI Integration (Round 2)

Scout (Claude Sonnet 4.6) can:
1. **Describe**: Explain the target structure
2. **Instruct**: Give step-by-step building guidance
3. **Build**: Place blocks directly via `<actions>` JSON tags in responses
4. **Fix**: Adjust existing placements

Flow: Player message → `/api/ai/chat` route → Claude API → Parse `<actions>` tags → HTTP POST to PartyKit room → Grid updates + chat broadcast.

The AI sees the target grid data but NOT what builders have placed, preserving the communication challenge.

## Project Structure

```
GenZvsRobots/
├── app/
│   ├── page.tsx                    # Home — Host/Join buttons
│   ├── layout.tsx                  # Root layout, fonts, global CSS
│   ├── host/[code]/page.tsx        # Host view (projector screen)
│   ├── join/[code]/page.tsx        # Player name entry
│   ├── play/[code]/page.tsx        # Player game view
│   └── api/ai/chat/route.ts       # AI endpoint (Claude proxy)
├── components/
│   ├── PlayerView.tsx              # Builder/Architect game interface
│   ├── HostView.tsx                # Host screen (lobby, rounds, reveals, summary)
│   ├── HostControls.tsx            # Host action buttons per phase
│   ├── VoxelGrid.tsx               # Canvas-based isometric grid component
│   ├── IsometricGrid.tsx           # Legacy SVG grid (unused but kept)
│   ├── IsometricBlock.tsx          # Legacy SVG block renderer
│   ├── BlockPalette.tsx            # Block type selector strip
│   ├── ChatPanel.tsx               # Team chat + AI messages
│   ├── GameHeader.tsx              # Phase/role/timer header bar
│   ├── Timer.tsx                   # Countdown timer display
│   ├── TeamMosaic.tsx              # Host view: all teams' grids tiled
│   ├── RevealCarousel.tsx          # Reveal 1: target vs build side-by-side
│   ├── RoundComparison.tsx         # Final reveal: R1 vs R2 comparison
│   ├── FinalSummary.tsx            # Summary: leaderboard + closing statement
│   ├── RoundTransition.tsx         # Cinematic interstitial animation
│   ├── ScoreGauge.tsx              # Animated percentage gauge
│   ├── Confetti.tsx                # Confetti particle overlay
│   └── TerrainBackground.tsx       # Home page terrain SVG backdrop
├── lib/
│   ├── types.ts                    # All TypeScript types (Grid, Player, etc.)
│   ├── constants.ts                # Grid size, colors, helpers, MAX_HEIGHT
│   ├── targets.ts                  # 8 multi-layer 3D target structures
│   ├── scoring.ts                  # Cell-by-cell 3D comparison engine
│   ├── aiPrompt.ts                 # System prompt builder for Scout
│   ├── parseAIActions.ts           # Extract <actions> JSON from AI response
│   ├── usePartySocket.ts           # React hook for PartyKit WebSocket
│   ├── voxelRenderer.ts            # Canvas 2D isometric renderer
│   ├── voxel.ts                    # Isometric math (coordinate transforms)
│   ├── sprites.ts                  # Pixel-perfect ImageData sprite atlas
│   └── isometric.ts                # Legacy isometric coordinate helpers
├── party/
│   ├── index.ts                    # PartyKit server (WebSocket + HTTP handler)
│   └── gameState.ts                # Server-side game state machine
├── __tests__/
│   ├── scoring.test.ts             # Scoring engine tests (3D)
│   └── parseAIActions.test.ts      # AI response parser tests
└── docs/plans/
    ├── *-design.md                 # Game design document
    ├── *-implementation.md         # Implementation plan
    └── *-test-findings-and-fixes.md # Bug audit results
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

## Target Audience & Context

- **Event**: 500 Acres monthly forum, February 27, 2026
- **Audience**: 10-25 panelists (experts, mentors, students), hybrid (in-person + remote)
- **Setup**: Host laptop connected to projector, players join on phones/laptops via room code
- **Purpose**: Demonstrate that communication + AI transforms building capability. The dramatic score improvement between rounds is the thesis in action.

## Scoring

- Cell-by-cell 3D comparison across all 4 height layers
- Score = percentage of cells matching (correct block type at correct position)
- Penalizes extra blocks (built where target has empty)
- Final reveal ranks teams by **most improved** (not highest score), rewarding the learning effect

## Known Issues

See `docs/plans/2026-02-23-test-findings-and-fixes.md` for full audit. Key items:

**Critical (must fix before demo):**
1. Player ID detected by name match — duplicate names cause wrong team binding
2. Host disconnect leaves game stranded (no reconnection)
3. Disconnected players block team slots
4. Role swap breaks with disconnected players

**Fixed in recent commits:**
- reveal1 button restart (Bug #5) — fixed
- JSON.parse try/catch (Bug #6) — fixed
- AI phase check (Bug #7) — fixed
- Lazy Anthropic init (Bug #8) — fixed
- AI conversation history (Bug #11) — fixed (last 10 messages)
- setTimeout cleanup leak (Bug #12) — fixed (cellTimeoutsRef pattern)
- Ghost player removal from team.players (Bug #3) — partially fixed
