# Host Theme Feature — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the host set a creative theme (e.g., "houses") in the lobby that players see during the design phase.

**Architecture:** Add `theme: string | null` to `RoomState`, synced via existing state broadcast. Host sets it via a new `setTheme` client message. UI reads `state.theme` in lobby (host input) and design phase (player banner + host label).

**Tech Stack:** TypeScript, PartyKit WebSocket, Next.js React components, Tailwind CSS

---

## Task 1: Types + Server State

### `lib/types.ts`

**Step 1:** Add `theme` to `RoomState` (after `nextTeamIndex`, line 57):

```typescript
export interface RoomState {
  code: string;
  phase: GamePhase;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  currentTarget: Grid | null;
  round: 1 | 2;
  timerEnd: number | null;
  hostConnected: boolean;
  nextTeamIndex: number;
  theme: string | null;       // NEW — host-set creative theme for design phase
}
```

**Step 2:** Add `setTheme` to `ClientMessage` (after `leaveGame` variant, line 67):

```typescript
export type ClientMessage =
  | { type: "join"; name: string; isHost?: boolean; reconnectToken?: string }
  | { type: "placeBlock"; row: number; col: number; block: BlockType }
  | { type: "chat"; text: string }
  | { type: "hostAction"; action: HostAction; targetPlayerId?: string }
  | { type: "aiChat"; text: string }
  | { type: "setTeamName"; name: string }
  | { type: "setTheme"; theme: string }   // NEW
  | { type: "leaveGame" };
```

### `party/gameState.ts`

**Step 3:** Initialize `theme: null` in `createRoomState()` (line 24):

```typescript
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
    nextTeamIndex: 0,
    theme: null,
  };
}
```

**Step 4:** Clear `theme` in `resetToLobby()` — add after `state.nextTeamIndex = ...` (around line 355):

```typescript
state.theme = null;
```

### `party/index.ts`

**Step 5:** Handle `setTheme` message in the `onMessage` switch. Add a new case after the `setTeamName` case (around line 221):

```typescript
case "setTheme": {
  // Only host can set theme, only during lobby
  if (sender.id !== this.hostId) return;
  if (this.state.phase !== "lobby") return;
  this.state.theme = (msg.theme || "").trim().slice(0, 50) || null;
  this.broadcastState();
  break;
}
```

**Step 6:** Verify — `npx tsc --noEmit` (expect clean, same pre-existing simulate-game errors only)

**Step 7:** Commit

```bash
git add lib/types.ts party/gameState.ts party/index.ts
git commit -m "feat: add theme to RoomState + setTheme message handler"
```

---

## Task 2: Host UI — Theme Input in Lobby

### `components/HostView.tsx`

**Step 1:** In the `LobbyView` component, add a theme text input between the room code section and the player list. After the `</motion.div>` that closes the room code block (around line 123), before the player list `<div>`:

```tsx
{/* Theme input */}
<div className="w-full max-w-md">
  <label className="block font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest mb-2 text-center">
    Design Theme (optional)
  </label>
  <input
    type="text"
    value={state.theme ?? ""}
    onChange={(e) => send({ type: "setTheme", theme: e.target.value })}
    placeholder="e.g. Houses, Castles, Vehicles..."
    maxLength={50}
    className="w-full text-center font-[family-name:var(--font-body)] text-sm px-4 py-2.5 rounded bg-white/5 border border-gold/30 text-cream placeholder:text-cream/20 outline-none focus:border-gold/60 transition-colors"
  />
</div>
```

**Step 2:** In `PHASE_LABELS`, the design label is static: `"DESIGN YOUR BUILDING"`. We need to make it dynamic. In the `ActiveRoundView` component, replace the phase label rendering (line 227) to incorporate theme when in design phase:

Find this line inside `ActiveRoundView`:
```tsx
{PHASE_LABELS[state.phase]}
```

Replace with:
```tsx
{state.phase === "design" && state.theme
  ? `DESIGN YOUR BUILDING \u2014 Theme: ${state.theme}`
  : PHASE_LABELS[state.phase]}
```

Note: `LobbyView` needs `state` (already has it), and `ActiveRoundView` needs `state` (already has it via props).

**Step 3:** Verify — `npx tsc --noEmit`

**Step 4:** Commit

```bash
git add components/HostView.tsx
git commit -m "feat: theme input in host lobby + theme in design phase label"
```

---

## Task 3: Player UI — Theme in Design Banner

### `components/PlayerView.tsx`

**Step 1:** In the design phase section, find the banner div that currently says:

```
Build your own creation! Your teammate will try to recreate it.
```

Replace the static text with a conditional that uses `state.theme`:

```tsx
<div className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center py-1 px-2 rounded text-[#8b5e3c]/70 bg-[#8b5e3c]/10">
  {state.theme
    ? `Theme: ${state.theme} \u2014 Build your own ${state.theme.toLowerCase()}! Your teammate will try to recreate it.`
    : "Build your own creation! Your teammate will try to recreate it."}
</div>
```

**Step 2:** Verify — `npx tsc --noEmit`

**Step 3:** Verify — `npx jest --testPathIgnorePatterns=simulate-game` (all tests pass)

**Step 4:** Verify — `npx next build` (production build succeeds)

**Step 5:** Commit

```bash
git add components/PlayerView.tsx
git commit -m "feat: show theme in player design phase banner"
```

---

## Verification Checklist

1. `npx tsc --noEmit` — clean (only pre-existing simulate-game errors)
2. `npx jest --testPathIgnorePatterns=simulate-game` — all tests pass
3. `npx next build` — production build succeeds
4. **Lobby**: Host sees theme input below room code. Typing sends setTheme. Clearing input sets theme to null.
5. **Design phase (host)**: Phase label shows "DESIGN YOUR BUILDING — Theme: Houses" when theme set, plain label when not.
6. **Design phase (player)**: Banner shows "Theme: Houses — Build your own houses!" when theme set, default text when not.
7. **Play Again**: Theme resets to null in lobby.
8. **Reconnection**: Theme persists (it's on RoomState, synced automatically).
