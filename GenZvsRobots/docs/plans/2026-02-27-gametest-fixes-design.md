# Gametest Fixes Design — Feb 27, 2026

## Problem

Five issues reported from the latest gametest session:

1. **Button overlap** — The 2D/3D toggle and Rotate/Lock buttons overlap on VoxelGrid, making them unusable on mobile
2. **Scout actions not applied** — Scout responds with text but blocks don't appear on the grid
3. **Scout responses unreadable** — Too long, too much jargon, coordinate-heavy, hard to read on mobile
4. **Chat tips wrong** — Round 2 Architect tips suggest building commands but Architect Scout is describe-only
5. **Chat tips disappear** — Tips vanish after the first message; players forget what to do mid-round

Issues 1 and the original "architects can't see coordinates" report are the same root cause (button overlap blocks the 2D toggle).

## Fixes

### Fix 1: Button Overlap

**Problem:** Both buttons use `absolute` positioning with hardcoded `right-*` offsets. The 2D button at `right-28` (112px) collides with the Rotate button at `right-2` because the Rotate button text ("Rotate"/"Lock") makes it ~90-100px wide.

**Solution:** Replace individual absolute-positioned buttons with a single flex container:
- One `div` at `absolute top-2 right-2` with `flex gap-2`
- Both buttons inside as flex children, naturally flowing left-to-right
- No overlap regardless of button text width

**File:** `components/VoxelGrid.tsx` (lines 314-369)

### Fix 2: Scout Actions Not Applied

**Problem:** Scout AI responds with text that appears in chat, but the `<actions>` block placements don't materialize on the grid. The response arrives but actions aren't executed.

**Investigation areas:**
1. `parseAIActions.ts` — Parser may fail silently on edge cases (extra whitespace, newlines in JSON, multiple `<actions>` blocks)
2. `route.ts` — HTTP POST to PartyKit may fail silently (only logs error, doesn't surface to client)
3. `party/index.ts` — The `phase !== "round2"` guard or `VALID_BLOCK_TYPES` check may reject valid actions
4. `PlayerView.tsx` — `aiThinking` state may never clear if the fetch succeeds but actions fail server-side

**Solution:**
- Make parser more robust: handle whitespace, multiple action blocks, malformed JSON gracefully
- Add error surface: if PartyKit POST fails, send a fallback "Scout had trouble building" chat message
- Add client-side timeout: clear `aiThinking` after 20 seconds regardless of response
- Add logging: log parsed action count in route.ts so we can debug in Vercel logs

**Files:** `lib/parseAIActions.ts`, `app/api/ai/chat/route.ts`, `components/PlayerView.tsx`

### Fix 3: Scout Response Readability

**Problem:** Scout responses are too long (up to 375 words at max_tokens=500), use jargon ("Layer 0", "A1 through A6"), and format poorly on mobile chat bubbles.

**Solution:**
- Cut `max_tokens` from 500 to 150 (forces 1-2 sentence responses)
- Rewrite prompt for strict brevity: "1 sentence max, no lists, no bullet points"
- Replace coordinate-heavy language guidance with plain English: "say 'the back wall' not 'A1-A6 on Layer 0'"
- Remove unnecessary prompt sections (Intent Detection, High-Level Commands) — model handles these naturally
- Add BAD vs GOOD response examples in prompt
- Simplify block type list (remove descriptions)
- Builder mode: action-confirming ("Done! Built 6 walls along the back.")
- Architect mode: coaching-focused ("Tell them: walls along the back, floors in the middle.")

**Files:** `lib/aiPrompt.ts`, `app/api/ai/chat/route.ts`

### Fix 4: Chat Tips Content + Persistence

**Problem (content):** Round 2 Architect tips include "Scout, build the entire ground floor" but the Architect's Scout is in describe-only mode. Tips don't match actual role capabilities.

**Problem (persistence):** Tips only show when `messages.length === 0`. After one message, they disappear forever. Players can't re-read tips mid-round.

**Solution (content):**
- Round 2 Architect tips: describe-focused ("Scout, describe my building", "Scout, help me explain the roof")
- Round 2 Builder tips: build-focused ("Scout, build the ground floor", "Scout, fix the walls")
- Round 1 tips: no Scout references (already correct, verify)

**Solution (persistence):**
- Add a "?" help button in the chat header
- Tapping toggles the tips panel open/closed
- Tips start expanded when chat is empty, collapse automatically after first message
- Players can re-expand anytime
- Tappable prompt buttons remain functional in expanded state

**File:** `components/ChatPanel.tsx`

## Verification

1. `npx tsc --noEmit` — clean compile
2. `npx jest` — all tests pass (especially parseAIActions tests)
3. `npx next build` — production build succeeds
4. Visual check: buttons don't overlap at any viewport width
5. Scout test: send "Scout, build the ground floor" as Builder, verify blocks appear
6. Scout test: send "Scout, describe my building" as Architect, verify no actions attempted
7. Tips: verify tips collapse after first message, can reopen via "?" button
