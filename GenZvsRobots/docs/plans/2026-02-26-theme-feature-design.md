# Host Theme Feature — Design

## Problem

The design phase gives players a blank grid with no creative direction. A host-configurable theme (e.g., "houses", "toolboxes") gives players focus and makes gameplay more engaging.

## Decision

Server-synced theme via `RoomState.theme`. Host sets it in the lobby via a text input. Theme persists through reconnections and is visible to all clients via existing state sync.

## Design

### Data Model

- Add `theme: string | null` to `RoomState` (default `null`)
- Add `{ type: "setTheme"; theme: string }` to `ClientMessage`
- `createRoomState()` initializes `theme: null`
- `resetToLobby()` clears `theme` back to `null`

### Server

- `party/index.ts` handles `setTheme`: host-only, lobby-only, trim + cap at 50 chars
- Stores on `state.theme`, broadcasts state

### Host UI

- **Lobby**: Text input below room code, above player list. Placeholder: "Set a theme (optional)...". Sends `setTheme` on change. Styled with dark bg, gold accents, pixel font label.
- **Design phase**: Phase label augmented from "DESIGN YOUR BUILDING" to "DESIGN YOUR BUILDING — Theme: {theme}" when theme exists.

### Player UI

- **Design phase banner**: When theme exists, shows "Theme: {theme} — Build your own {theme}! Your teammate will try to recreate it." Otherwise keeps default text.

## Files (5)

| File | Change |
|------|--------|
| `lib/types.ts` | `theme` on `RoomState`, `setTheme` on `ClientMessage` |
| `party/gameState.ts` | Init + reset `theme` |
| `party/index.ts` | Handle `setTheme` message |
| `components/HostView.tsx` | Theme input in lobby, theme in design label |
| `components/PlayerView.tsx` | Theme in design banner |
