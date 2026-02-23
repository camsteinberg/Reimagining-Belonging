# Blueprint Telephone - Test Findings & Bug Fix Plan

**Date:** 2026-02-23
**Demo:** Friday, February 27, 2026
**Testing method:** 4-agent parallel sweep (WebSocket simulation, API testing, code audit, unit tests)

---

## Test Results Summary

| Test Suite | Result |
|---|---|
| WebSocket game flow simulation (46 checks) | **46/46 PASS** |
| API & HTTP endpoint tests (10 checks) | **10/10 PASS** |
| Unit tests (17 tests) | **17/17 PASS** |
| Code audit (34 files) | 5 critical, 9 major, 14 minor findings |

**The core game flow works correctly end-to-end.** All phase transitions, team assignment, role swapping, block placement, scoring, and host controls function as designed. Bugs found are primarily around edge cases (disconnections, duplicate names) and polish.

---

## CRITICAL - Must Fix Before Friday Demo

### 1. Player ID detection by name match (duplicate name bug)
**File:** `app/play/[code]/page.tsx:37-44`
**Issue:** Player ID is detected by matching `p.name === playerName` in state. If two players join with the same name, the second player gets bound to the first player's record.
**Impact:** Wrong team, wrong role, wrong grid shown. Game-breaking for affected player.
**Fix:** Use the PartySocket connection ID instead of name matching. The `usePartySocket` hook should expose the socket's connection ID, and the play page should use that directly.
**Complexity:** Small change (modify `usePartySocket` to expose `socketId`, use it in play page)

### 2. Host disconnect leaves game stranded
**File:** `party/index.ts:29-35`
**Issue:** When the host disconnects, `hostConnected` is set to false but the timer keeps running. The round expires and advances to reveal with no host to control it. Reconnecting host gets a new connection ID and cannot re-register as host.
**Impact:** Host browser crash or network drop = game stuck in reveal phase forever.
**Fix:** Allow host re-registration by accepting a new `join` with `isHost: true` at any time (update `hostId` to the new connection ID). Also pause timer on host disconnect.
**Complexity:** Small change (add re-join logic in `onMessage`, pause timer in `onClose`)

### 3. Disconnected players block team slots (ghost players)
**File:** `party/gameState.ts:63-67`
**Issue:** `removePlayer` sets `connected = false` but doesn't remove the player from `team.players[]`. Disconnected players permanently occupy team slots.
**Impact:** Teams with disconnected players can't get replacements. Team with disconnected architect has nobody who can see the target.
**Fix:** Remove player ID from `team.players` array on disconnect. If the disconnected player was architect, promote the first remaining builder.
**Complexity:** Medium change (modify `removePlayer`, add role reassignment logic)

### 4. Round 2 role swap breaks with disconnected players
**File:** `party/gameState.ts:86-92`
**Issue:** Role swap iterates ALL players including disconnected ones. A team where the architect disconnected could end up with 2 architects and 0 builders in round 2.
**Impact:** Nobody on the team can place blocks.
**Fix:** Only swap roles for connected players. Ensure exactly one connected player per team is architect after the swap.
**Complexity:** Small change (filter for `connected === true` before swapping)

### 5. reveal1 "Next Phase" button restarts Round 1
**File:** `components/HostControls.tsx:67-71` + `components/HostView.tsx:222-226`
**Issue:** In reveal1 phase, the "Next Phase" button sends `startRound` action, which resets the game to round 1 instead of advancing to interstitial/round 2.
**Impact:** Host accidentally restarts the game, losing all round 1 results.
**Fix:** Change the reveal1 "Next Phase" button action to `nextReveal` (which correctly transitions reveal1 -> interstitial). Or rename it to make the flow clearer.
**Complexity:** 1-line fix

---

## MAJOR - Should Fix Before Demo

### 6. JSON.parse without try/catch in WebSocket hook
**File:** `lib/usePartySocket.ts:34-41`
**Issue:** `JSON.parse(e.data)` has no error handling. A single malformed message crashes the handler permanently.
**Impact:** Game appears frozen for that client.
**Fix:** Wrap in try/catch, ignore malformed messages.
**Complexity:** 1-line fix

### 7. AI response processed outside of round2 phase
**File:** `party/index.ts:162-169`
**Issue:** The AI HTTP handler places blocks and sends chat messages without checking game phase. Late AI responses during reveal phase cause confusion.
**Fix:** Add `if (this.state.phase !== "round2") return new Response("Round ended", ...)` at the top.
**Complexity:** 1-line fix

### 8. Anthropic client may crash on missing API key
**File:** `app/api/ai/chat/route.ts:7-9`
**Issue:** `new Anthropic()` at module level throws if ANTHROPIC_API_KEY is unset, crashing the route.
**Fix:** Lazy-initialize inside the POST handler with an early return if key is missing.
**Complexity:** Small change

### 9. Timer expiry and skipToReveal race condition
**File:** `party/index.ts:248-254`
**Issue:** Timer callback and host `skipToReveal` can both call `calculateAllScores` + `endRound`. Harmless but wasteful.
**Fix:** Check phase in timer callback before calling endRound.
**Complexity:** 1-line fix

### 10. Solo-player team gets 0 architects in round 2
**File:** `party/gameState.ts:86-92`
**Issue:** If a team has exactly 1 player, they're the architect. On round 2 swap, they become a builder with no architect.
**Fix:** Keep solo player as architect (or show them the target regardless of role).
**Complexity:** Small change

### 11. AI chat has no conversation history
**File:** `app/api/ai/chat/route.ts:22-27`
**Issue:** Each AI request is stateless - no memory of previous messages in the round.
**Impact:** AI gives repetitive, context-free responses. Poor gameplay experience.
**Fix:** Pass conversation history from the client, or maintain server-side history per team per round.
**Complexity:** Medium change

### 12. setTimeout cleanup leak in PlayerView
**File:** `components/PlayerView.tsx:92-98`
**Issue:** Block placement animation timeouts not cleared on unmount.
**Fix:** Store timeout IDs in a ref, clear on unmount.
**Complexity:** Small change

---

## MINOR - Nice to Have

### 13. Activity feed shows raw teamId instead of team name
**File:** `components/HostView.tsx:32`
**Fix:** Look up `state.teams[msg.teamId]?.name`

### 14. Hardcoded PartyKit host URL
**File:** `lib/usePartySocket.ts:16-23`
**Fix:** Use environment variable with fallback

### 15. Inaccurate block counts in target descriptions
**File:** `lib/targets.ts`
**Fix:** Update comments to match actual counts (39 and 51, not 18 and 28)

### 16. calculateAllScores uses hardcoded ROUND_2_TARGET
**File:** `party/gameState.ts:156-167`
**Fix:** Use `state.currentTarget` consistently for both rounds

### 17. No minimum player count to start
**File:** `party/gameState.ts:69-93`
**Fix:** Add check in `startRound`, return error if 0 players

### 18. No rate limiting on AI endpoint
**File:** `app/api/ai/chat/route.ts:13`
**Fix:** Add per-team throttle

### 19. No authentication on PartyKit HTTP endpoint
**File:** `party/index.ts:163-170`
**Fix:** Add shared secret between Next.js route and PartyKit

### 20. RoundTransition SSR mismatch with window.innerHeight
**File:** `components/RoundTransition.tsx:170`
**Fix:** Use ref + resize observer

---

## Recommended Fix Order for Friday Demo

**Phase 1 - Critical path (fix immediately):**
1. Fix #5 (reveal1 button restart) - 1-line fix, prevents accidental game reset
2. Fix #6 (JSON.parse try/catch) - 1-line fix, prevents client freeze
3. Fix #7 (AI phase check) - 1-line fix, prevents AI chat leaking
4. Fix #9 (timer race check) - 1-line fix
5. Fix #1 (player ID by socket ID) - small change, prevents duplicate name bug
6. Fix #8 (lazy Anthropic init) - small change

**Phase 2 - Resilience (fix if time allows):**
7. Fix #2 (host reconnect)
8. Fix #3 (ghost player cleanup)
9. Fix #4 (role swap for disconnected)
10. Fix #10 (solo team architect)

**Phase 3 - Polish (nice to have):**
11. Fix #11 (AI conversation history)
12. Fix #13 (activity feed team names)
13. Fix #15 (target description accuracy)

---

## Test Artifacts

- `__tests__/simulate-game.ts` - Full game flow WebSocket simulation (46 checks)
- `__tests__/test-results.txt` - Simulation results
- `__tests__/api-test-results.txt` - API endpoint test results
- `__tests__/unit-test-results.txt` - Unit test + logic verification results
- `__tests__/code-audit-results.txt` - Full code audit report
