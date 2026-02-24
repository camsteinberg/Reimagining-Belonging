# Blueprint Telephone — Demo Polish Implementation Plan

> **For Claude:** Execute using a multi-agent team with 5 parallel workstreams.

**Goal:** Transform the working Blueprint Telephone prototype into a polished, presentation-ready experience for the February 27, 2026 forum demo with 10-25 panelists.

**Architecture:** 5 parallel agent lanes, each owning distinct files to avoid merge conflicts. A foundation task updates shared types first, then all lanes execute concurrently.

**Demo Date:** Friday, February 27, 2026

---

## Pre-Flight: Already Fixed Bugs

These bugs from the test findings are **already fixed** in the current codebase and require NO work:

| Bug | Status | Evidence |
|-----|--------|----------|
| #1 Player ID by socket | Fixed | `play/[code]/page.tsx:37` uses `socket.current?.id` |
| #5 Reveal1 button restart | Fixed | `HostControls.tsx:68` uses `nextReveal` |
| #6 JSON.parse try/catch | Fixed | `usePartySocket.ts:66` has try/catch |
| #7 AI phase check | Fixed | `party/index.ts:165` checks `phase !== "round2"` |
| #8 Lazy Anthropic init | Fixed | `route.ts:19` creates client inside handler |
| #9 Timer race condition | Fixed | `party/index.ts:260` checks phase in callback |
| #11 AI conversation history | Fixed | `route.ts:28` supports history parameter |
| #12 setTimeout cleanup | Fixed | `PlayerView.tsx:48-54` cellTimeoutsRef pattern |
| #13 Activity feed names | Fixed | `host/[code]/page.tsx:35` uses team name lookup |
| #16 Hardcoded target scoring | Fixed | `gameState.ts:199` uses `state.currentTarget` |

---

## Foundation Task (Run First, Before Parallel Lanes)

### Task 0: Update Shared Types

**Files:**
- Modify: `lib/types.ts`

**Changes:**
Add `reconnect` client message type for player reconnection:

```typescript
export type ClientMessage =
  | { type: "join"; name: string; isHost?: boolean; reconnectToken?: string }
  | { type: "placeBlock"; row: number; col: number; block: BlockType }
  | { type: "chat"; text: string }
  | { type: "hostAction"; action: HostAction }
  | { type: "aiChat"; text: string };
```

Add `hostAction` types for demo mode:

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
  | "endDemo";
```

Add `demo` to GamePhase:

```typescript
export type GamePhase =
  | "lobby"
  | "demo"
  | "round1"
  | "reveal1"
  | "interstitial"
  | "round2"
  | "finalReveal"
  | "summary";
```

---

## Lane A: Server Resilience

**Agent Name:** `server-hardening`
**Owns:** `party/index.ts`, `party/gameState.ts`
**No conflicts with other lanes.**

### A1. Host Reconnection

**File:** `party/index.ts`

In `onMessage`, update the `join` case to allow host re-registration at any time:

```typescript
case "join": {
  if (msg.isHost) {
    this.hostId = sender.id;
    this.state.hostConnected = true;
    // If timer was paused due to host disconnect, don't auto-resume
    // Host can manually resume with the pause/resume controls
  } else {
    // ... existing player join logic
  }
  this.broadcastState();
  break;
}
```

In `onClose`, pause timer when host disconnects:

```typescript
onClose(conn: Party.Connection) {
  if (conn.id === this.hostId) {
    this.state.hostConnected = false;
    this.stopTimer(); // Pause game when host drops
  }
  removePlayer(this.state, conn.id);
  this.broadcastState();
}
```

In `app/host/[code]/page.tsx`, update the join logic to always send join on connect (not just once):

```typescript
useEffect(() => {
  if (connected) {
    send({ type: "join", name: "Host", isHost: true });
  }
}, [connected, send]);
```

Remove the `hasJoined` ref guard so host can re-register on reconnect.

### A2. Player Reconnection (Server Side)

**File:** `party/index.ts`, `party/gameState.ts`

In gameState, add a `reconnectPlayer` function:

```typescript
export function reconnectPlayer(
  state: RoomState,
  newId: string,
  reconnectToken: string
): Player | null {
  // Find player matching this reconnect token
  const oldPlayer = Object.values(state.players).find(
    p => p.reconnectToken === reconnectToken && !p.connected
  );
  if (!oldPlayer) return null;

  // Transfer to new connection ID
  const team = state.teams[oldPlayer.teamId];
  if (team) {
    team.players = team.players.map(pid => pid === oldPlayer.id ? newId : pid);
  }

  // Move player record to new ID
  delete state.players[oldPlayer.id];
  const newPlayer = { ...oldPlayer, id: newId, connected: true };
  state.players[newId] = newPlayer;

  return newPlayer;
}
```

Add `reconnectToken` to the Player interface in types.ts (add to foundation task):

```typescript
export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: Role;
  connected: boolean;
  reconnectToken?: string;
}
```

In `addPlayer`, generate a reconnect token:

```typescript
const token = Math.random().toString(36).slice(2, 10);
const player: Player = { id, name, teamId, role, connected: true, reconnectToken: token };
```

In `party/index.ts` join handler, check for reconnection:

```typescript
case "join": {
  if (msg.isHost) {
    // ... host logic
  } else if (msg.reconnectToken) {
    const player = reconnectPlayer(this.state, sender.id, msg.reconnectToken);
    if (player) {
      this.send(sender, { type: "reconnected", player });
      this.broadcastState();
      break;
    }
    // Fallthrough to normal join if token doesn't match
  }
  // Normal join...
}
```

### A3. Solo Architect Fix

**File:** `party/gameState.ts`

In `startRound`, after role swap, ensure solo teams keep their player as architect:

```typescript
// After the general role swap loop:
for (const team of Object.values(state.teams)) {
  const connectedPlayers = team.players
    .map(pid => state.players[pid])
    .filter(p => p && p.connected);

  if (connectedPlayers.length === 1) {
    connectedPlayers[0].role = "architect";
  }
}
```

### A4. Minimum Player Count Check

**File:** `party/gameState.ts`

In `startRound`, add a guard:

```typescript
export function startRound(state: RoomState): boolean {
  // ... existing phase check ...

  const playerCount = Object.values(state.players).filter(p => p.connected).length;
  if (playerCount === 0) return false;

  // ... rest of function
  return true;
}
```

Update `party/index.ts` to check the return value and send error if needed.

### A5. Demo Mode (Practice Round)

**File:** `party/gameState.ts`, `party/index.ts`

Add `startDemo` and `endDemo` functions:

```typescript
export function startDemo(state: RoomState): void {
  if (state.phase !== "lobby") return;
  state.phase = "demo";
  state.timerEnd = Date.now() + 60_000; // 60 seconds

  // Reset all grids for free-build
  for (const team of Object.values(state.teams)) {
    team.grid = createEmptyGrid();
  }
}

export function endDemo(state: RoomState): void {
  if (state.phase !== "demo") return;
  state.phase = "lobby";
  state.timerEnd = null;

  // Clear demo builds
  for (const team of Object.values(state.teams)) {
    team.grid = createEmptyGrid();
  }
}
```

In `party/index.ts`, handle in `handleHostAction`:

```typescript
case "startDemo": {
  startDemo(this.state);
  this.startTimer();
  break;
}
case "endDemo": {
  this.stopTimer();
  endDemo(this.state);
  break;
}
```

Also allow block placement during `demo` phase (update `placeBlock` phase check):

```typescript
if (state.phase !== "round1" && state.phase !== "round2" && state.phase !== "demo") {
  return { placed: false, height: -1 };
}
```

### A6. PartyKit HTTP Auth

**File:** `party/index.ts`, `app/api/ai/chat/route.ts`

In `party/index.ts` `onRequest`, verify a shared secret:

```typescript
const secret = req.headers.get("x-party-secret");
const expectedSecret = process.env.PARTY_SECRET || "dev-secret";
if (secret !== expectedSecret) {
  return new Response("Unauthorized", { status: 401, headers: this.corsHeaders() });
}
```

In `app/api/ai/chat/route.ts`, add the header:

```typescript
await fetch(`${partyProtocol}://${partyHost}/party/${roomCode.toLowerCase()}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-party-secret": process.env.PARTY_SECRET || "dev-secret",
  },
  body: JSON.stringify({ ... }),
});
```

---

## Lane B: Player & Chat UX

**Agent Name:** `player-ux`
**Owns:** `components/PlayerView.tsx`, `components/ChatPanel.tsx`, `components/BlockPalette.tsx`, `components/GameHeader.tsx`, `app/play/[code]/page.tsx`, `app/join/[code]/page.tsx`, new `components/TutorialOverlay.tsx`
**No conflicts with other lanes.**

### B1. Player Reconnection (Client Side)

**File:** `app/join/[code]/page.tsx`, `app/play/[code]/page.tsx`

In join page, generate and store a reconnect token:

```typescript
function handleSubmit(e: FormEvent) {
  // ... existing validation ...
  const token = Math.random().toString(36).slice(2, 10);
  sessionStorage.setItem("playerName", trimmed);
  sessionStorage.setItem("roomCode", code);
  sessionStorage.setItem("reconnectToken", token);
  window.location.href = `/play/${code}`;
}
```

In play page, send the token with the join message:

```typescript
useEffect(() => {
  if (connected && playerName && !joinSentRef.current) {
    joinSentRef.current = true;
    const token = sessionStorage.getItem("reconnectToken") || undefined;
    send({ type: "join", name: playerName, reconnectToken: token });
  }
}, [connected, playerName, send]);
```

### B2. Onboarding Tutorial Overlay

**New File:** `components/TutorialOverlay.tsx`

```typescript
interface TutorialOverlayProps {
  role: "architect" | "builder";
  isRound2: boolean;
  onDismiss: () => void;
}
```

Show for 5 seconds, auto-dismiss, dismissible by tap. Use sessionStorage to only show once per session.

Builder message: "Tap a block type below, then tap the grid to place it. Your Architect will tell you what to build!"
Architect message: "You can see the target. Use the chat to describe it to your team!"
Round 2 addition: "Scout the Robot is here to help!"

Style: Semi-transparent overlay with warm brand colors, pixel font, animated hand/chat icons.

**File:** `components/PlayerView.tsx`

Add state and render the overlay at round start:

```typescript
const [showTutorial, setShowTutorial] = useState(false);

useEffect(() => {
  if (isPlaying && !sessionStorage.getItem("tutorialSeen")) {
    setShowTutorial(true);
    sessionStorage.setItem("tutorialSeen", "true");
  }
}, [isPlaying]);
```

### B3. Waiting States for Non-Active Phases

**File:** `components/PlayerView.tsx`

Currently shows "Waiting..." during non-playing phases. Replace with rich content per phase:

```typescript
// After the main grid/chat content, add phase-specific views:
if (phase === "reveal1") {
  return <WaitingReveal teamName={teamName} score={team?.round1Score} />;
}
if (phase === "interstitial") {
  return <WaitingInterstitial role={role} />;
}
if (phase === "finalReveal") {
  return <WaitingFinalReveal team={team} />;
}
if (phase === "summary") {
  return <WaitingSummary />;
}
```

Each is a small inline component with:
- reveal1: "Your host is revealing Round 1 results!" + score if available
- interstitial: "Round 2 is coming — you'll have AI help this time!" + new role preview
- finalReveal: Team's R1 vs R2 score comparison
- summary: 500 Acres closing statement

### B4. AI Typing Indicator

**File:** `components/ChatPanel.tsx`

Add a `isAIThinking` prop:

```typescript
interface ChatPanelProps {
  // ... existing props
  isAIThinking?: boolean;
}
```

Render a thinking indicator at the bottom of the message list:

```typescript
{isAIThinking && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-2 px-2 py-1"
  >
    <div className="h-6 w-6 rounded-full bg-[#6b8f71] flex items-center justify-center text-[10px] font-bold text-[#f5f1ea]">S</div>
    <div className="flex gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-bounce" style={{animationDelay: "0ms"}} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-bounce" style={{animationDelay: "150ms"}} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-bounce" style={{animationDelay: "300ms"}} />
    </div>
  </motion.div>
)}
```

In PlayerView, track AI thinking state:

```typescript
const [aiThinking, setAiThinking] = useState(false);
```

Set `aiThinking = true` when sending a message in Round 2, set `false` when an AI chat message arrives.

### B5. Emoji Quick Reactions

**File:** `components/ChatPanel.tsx`

Add a row of quick-reaction buttons above the text input:

```typescript
const QUICK_REACTIONS = ["👍", "❓", "🎉", "👉", "🤖"];
```

Render as a horizontal strip of small tappable buttons. Tap sends the emoji as a chat message via `onSend`.

### B6. Mobile Layout Refinements

**File:** `components/PlayerView.tsx`, `components/BlockPalette.tsx`

- Add haptic feedback: `navigator.vibrate?.(10)` in `handleCellClick`
- Increase block palette touch targets if below 48px
- Consider tab-based layout on narrow screens (use media query or container width)

### B7. Demo Phase Player View

**File:** `components/PlayerView.tsx`

Handle `demo` phase: all players are builders, no target, no chat. Show "Practice Mode — Try placing blocks!" header. Allow block placement (no role restriction in demo).

---

## Lane C: AI & Targets Enhancement

**Agent Name:** `ai-enhancement`
**Owns:** `app/api/ai/chat/route.ts`, `lib/aiPrompt.ts`, `lib/targets.ts`, `lib/parseAIActions.ts`
**No conflicts with other lanes.**

### C1. Rich Natural-Language Target Descriptions

**File:** `lib/targets.ts`

Update all 8 target descriptions (ROUND_1_DESCRIPTIONS, ROUND_2_DESCRIPTIONS) with rich spatial language:

For each target, include:
1. What the building looks like ("A cozy rectangular cottage with...")
2. Spatial layout ("Walls form the perimeter, floor fills the interior, door faces south...")
3. Layer-by-layer building strategy ("Start with ground-floor walls and floor, then add upper walls with windows, then cap with roof")
4. Key features ("The door is at the bottom-center of the south wall, windows are on the east and west sides")

Example for COTTAGE:
```
"The Cottage is a cozy rectangular building, 6 columns wide and 6 rows tall, centered on the grid.
Layer 0 (ground floor): Walls form the perimeter with floor tiles filling the interior. A double-wide door is centered on the south wall (row 6, cols 3-4).
Layer 1 (upper floor): Same wall perimeter, but windows replace some wall sections on the east and west sides (rows 2,4 on cols 1 and 6).
Layer 2 (roof): A solid roof covers the entire building footprint.
Building strategy: Start with the ground-floor walls in a rectangle, fill the interior with floor, add the door. Then build the upper walls with windows. Finally, cap everything with roof blocks."
```

### C2. AI Conversation Context (Grid State)

**File:** `app/api/ai/chat/route.ts`, `lib/aiPrompt.ts`

Add the team's current grid state to the AI request. The client needs to send the grid, or the server can pass it via the PartyKit HTTP request.

Simpler approach: Add a grid summary to the system prompt dynamically. The API route receives `teamGrid` from the client (PlayerView already has it):

In `app/api/ai/chat/route.ts`:
```typescript
const { roomCode, teamId, text, playerId, history, teamGrid } = await req.json();
```

In `lib/aiPrompt.ts`, add a `buildProgressContext` function:

```typescript
export function buildProgressContext(teamGrid: Grid | null, target: Grid): string {
  if (!teamGrid) return "";

  let placed = 0, correct = 0, total = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let h = 0; h < MAX_HEIGHT; h++) {
        if (teamGrid[r][c][h] !== "empty") placed++;
        if (target[r][c][h] !== "empty") {
          total++;
          if (teamGrid[r][c][h] === target[r][c][h]) correct++;
        }
      }
    }
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return `\n\n## Current Build Progress\nThe team has placed ${placed} blocks so far. ${correct}/${total} target cells are correct (${pct}% accuracy). Help them improve!`;
}
```

Append this to the system prompt in the API route.

In `components/PlayerView.tsx`, pass teamGrid in the AI chat request:
```typescript
body: JSON.stringify({
  text, roomCode: state.code, teamId, playerId,
  history: messages.map(m => ({ role: m.isAI ? "assistant" : "user", content: m.text })),
  teamGrid: team?.grid,
}),
```

### C3. AI Rate Limiting

**File:** `app/api/ai/chat/route.ts`

Add an in-memory rate limiter per team:

```typescript
const teamCooldowns = new Map<string, number>();
const COOLDOWN_MS = 3000;

// Inside POST handler, before calling Anthropic:
const cooldownKey = `${roomCode}-${teamId}`;
const lastCall = teamCooldowns.get(cooldownKey) || 0;
if (Date.now() - lastCall < COOLDOWN_MS) {
  return NextResponse.json({ error: "Scout is busy — try again in a moment" }, { status: 429 });
}
teamCooldowns.set(cooldownKey, Date.now());
```

---

## Lane D: Host & Reveal Polish

**Agent Name:** `host-polish`
**Owns:** `components/HostView.tsx`, `components/HostControls.tsx`, `components/TeamMosaic.tsx`, `components/RevealCarousel.tsx`, `components/RoundComparison.tsx`, `components/FinalSummary.tsx`, `components/ScoreGauge.tsx`, `components/RoundTransition.tsx`, `components/Confetti.tsx`
**No conflicts with other lanes.**

### D1. Interstitial Content Enhancement

**File:** `components/RoundTransition.tsx`

Update the LINES array to include richer content:

```typescript
const LINES = [
  {
    text: "Same challenge.",
    // ... styling
  },
  {
    text: "New tools.",
    // ... styling
  },
  {
    text: "ROUND 2 — WITH ROBOTS",
    // ... larger, sage colored
  },
  {
    text: "This round, every team gets Scout — an AI assistant that can describe the target, give building instructions, and place blocks from natural language.",
    // ... smaller, cream
  },
  {
    text: "500 Acres is training Gen Z to build real homes using CNC-cut Skylark 250 blocks.",
    // ... serif, italic
  },
];
```

### D2. RoundTransition SSR Fix

**File:** `components/RoundTransition.tsx`

Replace `window.innerHeight` with a ref + resize observer:

```typescript
const [viewHeight, setViewHeight] = useState(900);

useEffect(() => {
  setViewHeight(window.innerHeight);
  const handleResize = () => setViewHeight(window.innerHeight);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

Use `viewHeight` instead of `window?.innerHeight ?? 900`.

### D3. QR Code on Summary Screen

**File:** `components/FinalSummary.tsx`

Generate a simple QR code for "https://500acres.org" using a pure-SVG approach (no external library needed — a pre-made SVG string or minimal QR encoder):

Add below the "500acres.org" link:

```typescript
<div className="mt-4 p-3 bg-white rounded-lg inline-block">
  <img
    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://500acres.org`}
    alt="QR code to 500acres.org"
    width={120}
    height={120}
    className="block"
  />
</div>
```

Or better: embed a static SVG QR code to avoid external API dependency. Generate once and paste as inline SVG.

### D4. Live Score Counter on Host Mosaic

**File:** `components/TeamMosaic.tsx`

Import scoring function and compute live accuracy:

```typescript
import { calculateScore } from "@/lib/scoring";
```

Wait — `calculateScore` is in `party/gameState.ts` which is server-only. Use `calculateDetailedScore` from `lib/scoring.ts` instead.

In `TeamCard`, if a target grid is available, compute and display live score:

```typescript
// Add targetGrid as a prop to TeamMosaic
interface TeamMosaicProps {
  teams: Record<string, Team>;
  players: Record<string, Player>;
  phase: GamePhase;
  targetGrid?: Grid | null;
}
```

In the card, below the grid:
```typescript
{targetGrid && (
  <span className="font-[family-name:var(--font-pixel)] text-[8px] text-gold/60">
    {calculateDetailedScore(team.grid, targetGrid).percentage}%
  </span>
)}
```

Update `HostView` to pass `state.currentTarget` to TeamMosaic.

### D5. Demo Mode Host Controls

**File:** `components/HostControls.tsx`

Add demo mode button to lobby:

```typescript
{phase === "lobby" && (
  <>
    <HostButton label="Practice Round" action="startDemo" send={send} variant="secondary" />
    <HostButton label="Start Game" action="startRound" send={send} variant="primary" />
  </>
)}

{phase === "demo" && (
  <>
    <HostButton label="End Practice" action="endDemo" send={send} variant="secondary" />
  </>
)}
```

### D6. Celebration Moments

**File:** `components/RoundComparison.tsx`, `components/FinalSummary.tsx`

In FinalSummary, add a CSS shake animation when the "That's what robots do" stat card appears:

```typescript
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.5 + ranked.length * 0.1 }}
  onAnimationComplete={() => {
    // Brief screen shake via CSS
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 500);
  }}
  // ... rest of component
>
```

Add to globals.css:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
.shake { animation: shake 0.15s ease-in-out 3; }
```

### D7. Host Mosaic Phase Labels

**File:** `components/HostView.tsx`

Add demo phase handling:

```typescript
// Add to PHASE_LABELS:
demo: "PRACTICE ROUND",
```

Add demo phase to the phase switch:
```typescript
{phase === "demo" && (
  <ActiveRoundView state={state} send={send} activityFeed={activityFeed} />
)}
```

---

## Lane E: Infrastructure & Accessibility

**Agent Name:** `infra-fixes`
**Owns:** `lib/usePartySocket.ts`, `components/VoxelGrid.tsx`, `lib/voxel.ts`, `lib/isometric.ts`, `components/IsometricGrid.tsx`, `components/IsometricBlock.tsx`, `app/globals.css`, `app/layout.tsx`
**No conflicts with other lanes.**

### E1. PartyKit URL Environment Variable

**File:** `lib/usePartySocket.ts`

Replace hardcoded URL:

```typescript
const host = isLocal
  ? "127.0.0.1:1999"
  : (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PARTYKIT_HOST)
    || "blueprint-telephone.camsteinberg.partykit.dev";
```

### E2. Keyboard Navigation for Grid

**File:** `components/VoxelGrid.tsx`

Add keyboard event handler:

```typescript
const [keyboardCursor, setKeyboardCursor] = useState<{row: number; col: number} | null>(null);

const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (readOnly) return;

  const cursor = keyboardCursor ?? { row: 0, col: 0 };

  switch (e.key) {
    case "ArrowUp":    cursor.row = Math.max(0, cursor.row - 1); break;
    case "ArrowDown":  cursor.row = Math.min(GRID_SIZE - 1, cursor.row + 1); break;
    case "ArrowLeft":  cursor.col = Math.max(0, cursor.col - 1); break;
    case "ArrowRight": cursor.col = Math.min(GRID_SIZE - 1, cursor.col + 1); break;
    case "Enter":
    case " ":
      if (onCellClick) onCellClick(cursor.row, cursor.col);
      e.preventDefault();
      return;
    default: return;
  }
  e.preventDefault();
  setKeyboardCursor({ ...cursor });
}, [readOnly, keyboardCursor, onCellClick]);
```

Add `tabIndex={0}` and `onKeyDown={handleKeyDown}` to the container div.

Pass keyboardCursor as an additional hover indicator to the renderer.

### E3. ARIA Labels Audit

**File:** Various components

Ensure:
- VoxelGrid container has `role="application"` and `aria-label="Building grid"`
- BlockPalette already has `role="toolbar"` — good
- ChatPanel messages have `role="log"`
- Timer has `role="timer"` and `aria-live="polite"`

### E4. Global CSS Additions

**File:** `app/globals.css`

Add the shake animation for celebrations:

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
.shake { animation: shake 0.15s ease-in-out 3; }
```

---

## Agent Dependency Graph

```
[Task 0: Types Update] ──┬──> [Lane A: Server Hardening]
                          ├──> [Lane B: Player & Chat UX]
                          ├──> [Lane C: AI Enhancement]
                          ├──> [Lane D: Host & Reveal Polish]
                          └──> [Lane E: Infrastructure]
```

All 5 lanes run in PARALLEL after the foundation types update.

---

## File Ownership Map (No Conflicts)

| File | Owner |
|------|-------|
| `lib/types.ts` | Foundation (Task 0), then read-only |
| `party/index.ts` | Lane A |
| `party/gameState.ts` | Lane A |
| `app/host/[code]/page.tsx` | Lane A |
| `components/PlayerView.tsx` | Lane B |
| `components/ChatPanel.tsx` | Lane B |
| `components/BlockPalette.tsx` | Lane B |
| `components/GameHeader.tsx` | Lane B |
| `app/play/[code]/page.tsx` | Lane B |
| `app/join/[code]/page.tsx` | Lane B |
| `components/TutorialOverlay.tsx` (new) | Lane B |
| `app/api/ai/chat/route.ts` | Lane C |
| `lib/aiPrompt.ts` | Lane C |
| `lib/targets.ts` | Lane C |
| `lib/parseAIActions.ts` | Lane C |
| `components/HostView.tsx` | Lane D |
| `components/HostControls.tsx` | Lane D |
| `components/TeamMosaic.tsx` | Lane D |
| `components/RevealCarousel.tsx` | Lane D |
| `components/RoundComparison.tsx` | Lane D |
| `components/FinalSummary.tsx` | Lane D |
| `components/ScoreGauge.tsx` | Lane D |
| `components/RoundTransition.tsx` | Lane D |
| `components/Confetti.tsx` | Lane D |
| `lib/usePartySocket.ts` | Lane E |
| `components/VoxelGrid.tsx` | Lane E |
| `app/globals.css` | Lane E |

---

## Verification

After all lanes complete:

1. `npx tsc --noEmit` — clean compile
2. `npx jest --testPathIgnorePatterns=simulate-game` — all tests pass
3. `npx next build` — production build succeeds
4. Manual spot-check: host reconnection, player reconnection, demo mode, tutorial overlay, AI typing indicator, interstitial content, QR code, live scores, keyboard navigation

---

## Items Deferred (Post-Demo)

These are intentionally deferred to avoid scope creep before the Friday demo:

- Sound design (requires audio assets, device testing)
- Build replay animation (requires placement history tracking — significant server change)
- Architect preview of builder's grid (design decision: how much info to share)
- Full host moderator view with chat inspection
- Difficulty tuning (requires playtesting with real users)
