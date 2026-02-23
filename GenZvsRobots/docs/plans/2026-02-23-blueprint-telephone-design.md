# Blueprint Telephone — Game Design Document

## Date: 2026-02-23

## Overview

A 17-minute Jackbox-style multiplayer game for the 500 Acres monthly forum (Friday, Feb 27 2026). Demonstrates that communication + AI transforms what Gen Z can build — directly supporting the 500 Acres thesis that AI-powered instruction pipelines let young people construct homes they couldn't build alone.

**Working title**: Blueprint Telephone
**Audience**: 10-25 panelists (experts, mentors, students), hybrid (in-person + remote)
**Duration**: ~17 minutes
**Deploy target**: Vercel

---

## Game Concept

Teams of 2-3 split into **Architects** (who see a target structure) and **Builders** (who see a blank isometric grid). The Architect must communicate what to build.

- **Round 1 ("Old School")**: Text chat only. Architects describe; Builders interpret and place blocks manually. Results are hilariously imperfect.
- **Round 2 ("With Robots")**: New target, but now every team gets **Scout**, an AI co-builder (Claude Sonnet 4.6) that can describe, instruct, AND physically place blocks on the grid from natural language. The improvement is dramatic.

The side-by-side reveal shows average scores jumping from ~35% to ~90%, viscerally demonstrating the power of AI-assisted communication.

---

## Game Flow

| Phase | Time | Description |
|-------|------|-------------|
| **Lobby** | 2 min | Host projects room code. Players join on phones/laptops. Auto-assign teams + roles. |
| **Round 1: Old School** | 5 min | Target visible to Architect only. Builders place blocks via isometric grid. Text chat only. |
| **Reveal 1** | 2 min | Side-by-side builds vs target. Score animation. Host commentary. |
| **Round 2: With Robots** | 5 min | New (harder) target. Scout AI joins as co-builder. Can describe, instruct, AND build. |
| **Final Reveal** | 3 min | Round 1 vs Round 2 comparison. Score deltas. Aggregate stats. Mission tie-in. |

**Role rotation**: Architect role swaps between rounds so everyone experiences both perspectives.

---

## The Building Interface

### Isometric 2.5D Grid
- **8x8 cell grid** rendered in isometric projection (Monument Valley / SimCity aesthetic)
- Pixel art style — warm, homey, slightly retro-futuristic
- Grid sits on a stylized terrain: watercolor trees, distant mountain silhouettes (Firewatch meets architectural diagram)
- Evocative of 500 Acres' national park-adjacent land

### Block Palette (6 types)
| Block | Visual Style | Color |
|-------|-------------|-------|
| **Wall** | Solid isometric cube | Rust `#8b5e3c` |
| **Floor** | Flat hatched panel | Cream `#e8e0d0` |
| **Roof** | Angled/pitched piece | Forest `#3d6b4f` |
| **Window** | Cube with cutout | Gold `#b89f65` |
| **Door** | Cube with arch | Clay `#b8755d` |
| **Empty** | Eraser | Transparent |

### Interaction Model
- **Mobile**: Tap palette to select block type, tap grid cell to place. Tap again to remove.
- **Desktop**: Click or drag-and-drop from palette to grid.
- **Grid snapping**: Blocks always snap to cells. No freeform positioning.

### Player Views
- **Architect**: Target structure displayed as filled grid + text chat panel. Cannot interact with Builder's grid. In Round 2: Scout AI in the chat.
- **Builder**: Blank grid + block palette + chat panel. In Round 2: can also prompt Scout directly.
- **Host**: Mosaic of all teams' grids + timer + phase banner. Target hidden during building.

---

## AI Integration (Round 2)

### Scout — The AI Co-Builder
Powered by Claude Sonnet 4.6 via server-side API proxy. Scout can:

1. **Describe**: "What does the target look like?" → detailed description
2. **Instruct**: "What should I build next?" → step-by-step guidance
3. **Build**: "Place walls along the left side" → blocks materialize on the grid in real-time
4. **Interpret vision**: "Make it look like a cabin with a big front window" → AI translates to block placements
5. **Fix**: "Move the door over one" → AI adjusts

### Mechanic
- AI responses include structured action commands alongside text
- Server parses responses for build actions, emits WebSocket events to update the grid
- Blocks placed by Scout animate with a "digital shimmer" effect
- Both Architects AND Builders can prompt Scout
- No message limit — teams can go wild. The point is to demonstrate transformative capability.

### System Prompt Context
The AI receives the target grid data as JSON in its system prompt. It can see the target but NOT the Builder's current progress, preserving the need for human coordination.

### Cost
~50 API calls total per forum session. ~$0.50-1.00 at Sonnet pricing.

---

## Scoring & Reveal

### Scoring
- Cell-by-cell comparison: each cell correct (right block type + position) or wrong
- Score = percentage match
- Displayed as gauge animation: "Team Cabin Crew: 34%" → "91%"

### Reveal 1 (After Round 1)
1. Timer hits zero, grids freeze
2. Host screen transitions to reveal carousel
3. Target fades in left, each team's build appears right (one by one, host-paced)
4. Score animates up like a gauge
5. Quick leaderboard

### Final Reveal (After Round 2)
1. Split-screen: Round 1 build (left) vs Round 2 build (right), target ghosted behind
2. Score delta animates: "34% → 91% (+57)"
3. Improved cells flash green, consistent cells glow gold
4. Team improvement leaderboard (rewards most-improved, not highest score)
5. Aggregate stat card: "Average R1: 38% → Average R2: 87%. That's what robots do."

---

## Host/Presenter Experience

### Host URL
`/host` — password-protected or unique host code

### Screen Phases
1. **Lobby**: Room code, player join animation, team assignments, "Start Game" button. Beautiful terrain background.
2. **Round Active**: Mosaic of all grids (live-updating), countdown timer, phase banner, activity feed (anonymized chat snippets).
3. **Reveal**: Carousel with "Next Team" / "Show Results" buttons for paced dramatic reveals.
4. **Final Summary**: Aggregate stats, closing mission statement, QR code to 500 Acres site.

### Controls
- Start Round / Pause / Skip to Reveal / Next-Back / End Game
- Single device — host laptop connected to projector

---

## Visual Design & Aesthetic

### Core Aesthetic: SimCity Pixel Art meets Warm Architectural
- Isometric pixel art style — retro-futuristic yet homey
- Warm, inviting palette (not cold/techy)
- Animations and flourishes throughout for polish
- "Firewatch meets SimCity" environmental framing

### Color Palette (from 500 Acres brand)
| Role | Color | Hex |
|------|-------|-----|
| Backgrounds | Cream / Warm White | `#e8e0d0` / `#f5f1ea` |
| Primary blocks | Rust | `#8b5e3c` |
| Accents & scores | Gold | `#b89f65` |
| Robot/AI glow | Sage / Forest | `#6b8f71` / `#3d6b4f` |
| Text | Charcoal | `#2a2520` |
| Wrong cells | Ember | `#c45d3e` |
| Correct cells | Moss | `#365f45` |

### Typography
- **Playfair Display**: Headers, room code, reveal titles
- **Inter**: UI elements, scores, chat messages
- **EB Garamond**: Closing mission statement
- Consider a pixel/monospace font for the game UI elements to reinforce SimCity aesthetic

### Round Visual Identity
- **Round 1 ("Old School")**: Hand-drawn, sketch-like quality. Kraft paper textures. Notebook-style chat. Subtle wobble on grid lines. Analog, imperfect.
- **Round 2 ("With Robots")**: Clean, precise lines. Sage glow on AI interactions. Digital shimmer on robot-placed blocks. Modern, capable, alive. The transition between rounds feels like "tools arriving on the job site."

### Animation & Flourish Priorities
- Player join "pop in" animations in lobby
- Smooth isometric block placement with subtle bounce
- Scout AI messages stream in with typing indicator
- Robot-placed blocks animate with cascading shimmer
- Score gauges animate up with easing
- Round transition: visual "upgrade" effect
- Reveal carousel with cinematic slide transitions
- Confetti or particle effect on high-scoring Round 2 results

### Mobile-First Layout
- Vertical phone: grid (top 2/3) + palette strip (middle) + chat (bottom 1/3)
- Desktop: grid (left) + chat sidebar (right)
- All touch targets thumb-friendly — no pinching or zooming

---

## Technical Architecture

### Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Server API routes + WebSocket + single Vercel deploy |
| Real-time | Partykit | Vercel-native WebSocket rooms, presence, state sync |
| AI | Anthropic Claude API (Sonnet 4.6) | Fast (<1s response), capable, cost-effective |
| Styling | Tailwind CSS 4 | Matches 500 Acres design system |
| Animations | Framer Motion + CSS | Smooth, performant micro-interactions |
| Isometric rendering | HTML/CSS transforms or PixiJS | Lightweight isometric projection |
| Deploy | Vercel | Instant deploys, env vars, edge functions |

### No Database
Game state lives in-memory on the Partykit server for the session duration. Nothing persists after the forum.

### API Routes
- `POST /api/rooms` — Create room, get 4-letter join code
- `POST /api/rooms/[code]/join` — Player joins with name
- `POST /api/ai/chat` — Proxy to Claude API (Round 2 only), parse response for build actions
- Partykit WebSocket handles: team chat, grid updates, timer sync, phase transitions, AI build actions

### Environment Variables
- `ANTHROPIC_API_KEY` — Claude API key (server-side only)
- `NEXT_PUBLIC_PARTYKIT_HOST` — Partykit server URL

### Target Structures
Pre-designed JSON grid definitions:
- **Round 1**: Simple L-shaped house. ~15-20 blocks. Achievable with clear communication.
- **Round 2**: Two-room structure with angled roof, interior wall, multiple windows. ~25-30 blocks. Harder but tractable with AI.

---

## 500 Acres Integration

### Branding Moments
- **Lobby**: 500 Acres logo in corner. Terrain background evokes the land.
- **Between rounds**: Interstitial card about Skylark 250 blocks and the Gen Z building mission.
- **AI character**: "Scout" with hiking-bot avatar (matching existing Scout AI from main site).
- **Final screen**: Full branding, closing statement, QR code to 500acres.org or sign-up.

### Mission Connection
The closing statement: *"500 Acres is building AI-powered pipelines so Gen Z can construct real homes using CNC-cut Skylark 250 blocks — on beautiful land near national parks, together. You just experienced what that future feels like."*

---

## Design Preferences (from user)
- Use `frontend-design` skill for visual implementation — creative, polished, distinctive
- Use web testing skill for QA checkpoints
- SimCity pixel aesthetic — retro-futuristic yet warm and homey
- Prioritize animations, flourishes, and polish
- The game should feel fun, futuristic, and inviting — not sterile or generic
- Creative design choices encouraged throughout
