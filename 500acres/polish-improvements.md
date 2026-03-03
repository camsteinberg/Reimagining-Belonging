# Blueprint Telephone — Polish Improvements for Panel Demo

**Goal**: Transform the current working prototype into a polished, presentation-ready experience for the February 27, 2026 forum with 10-25 panelists.

Improvements are organized by priority tier and tagged by discipline (game design, education, UX, technical resilience).

---

## Tier 1: CRITICAL — Must Fix Before Demo Day

These are bugs or gaps that will visibly break the experience during a live presentation.

### 1. Fix Player Identity by Socket ID (Bug #1)
**Tags**: Technical, UX
**Current**: Players are matched by name (`p.name === playerName`). Two "Alex"es get cross-wired.
**Fix**: Use `PartySocket.id` (connection ID) as the player identifier in `app/play/[code]/page.tsx`. The socket already exposes this — the play page just needs to use it directly instead of searching by name.
**Impact**: Without this, a panelist demo with common first names breaks immediately.

### 2. Host Reconnection
**Tags**: Technical, Resilience
**Current**: If the host's laptop sleeps, browser refreshes, or loses WiFi, the game is stranded. The timer keeps running, advances to reveal with no one to control it, and the reconnected host can't re-register.
**Fix**: Allow re-joining with `isHost: true` at any time (update `hostId` to new connection ID). Pause timer on host disconnect, resume on reconnect.
**Impact**: For a 17-minute live demo, even one WiFi hiccup on the host laptop is catastrophic.

### 3. Handle Disconnected Players Gracefully
**Tags**: Technical, Game Design
**Current**: Disconnected players block team slots and role swap can produce teams with no builder.
**Fix**: (a) Remove player ID from `team.players` on disconnect. (b) Filter for connected players only during role swap. (c) Ensure exactly one connected architect per team after swap. (d) Solo players stay as architect regardless.
**Impact**: In a demo environment, someone's phone losing signal shouldn't break their team.

### 4. Player Reconnection
**Tags**: Technical, UX
**Current**: A player who refreshes their browser gets a new socket ID and appears as a brand-new player while their old slot is orphaned.
**Fix**: Use `sessionStorage` to persist a stable player token. On reconnect, send the token in the join message. Server matches against existing player record, restoring team/role.
**Impact**: Mobile browsers refresh more than you'd expect. Players should seamlessly re-enter the game.

---

## Tier 2: HIGH — Significant UX / Game Feel Improvements

These don't break the game but significantly elevate the presentation quality.

### 5. Onboarding Tutorial / First-Touch Guidance
**Tags**: Education, Game Design, UX
**Current**: Players land on a blank grid with no instructions. Nothing explains the block palette, how to place/erase, or what the Architect sees.
**Proposed**: When a round starts, show a 3-second overlay:
- **Builder**: "Tap a block type below, then tap the grid to place it. Your Architect will tell you what to build!" with animated hand icon.
- **Architect**: "You can see the target. Use the chat to describe it to your team!" with a chat bubble icon.
- Dismissible with tap, auto-dismiss after 5 seconds, only shows once per session.
**Why**: Panelists have zero context. A few seconds of instruction prevents 30+ seconds of confusion.

### 6. Waiting States for Non-Active Players
**Tags**: Game Design, UX
**Current**: During reveal/interstitial phases, players see "Waiting..." or a blank screen. They don't know what's happening on the projector.
**Proposed**: Show phase-appropriate content on player devices:
- **Reveal 1**: "Your host is revealing Round 1 results! Watch the screen." + team score if available.
- **Interstitial**: "Round 2 is coming — you'll have AI help this time!" + role preview.
- **Final Reveal**: Show their own team's R1 vs R2 score comparison.
- **Summary**: Show the closing 500 Acres statement + QR code.
**Why**: 10-25 people staring at blank phones during reveals breaks immersion. Everyone should feel included.

### 7. AI Typing Indicator + Response Streaming Feel
**Tags**: Game Design, UX
**Current**: AI messages appear instantly in chat. No sense that "Scout is thinking."
**Proposed**: When a player sends a Round 2 message:
1. Show "Scout is thinking..." with a pulsing dot animation in the chat
2. When the response arrives, remove the indicator and show the message with a brief typing-like reveal
3. If Scout places blocks, show a brief "Scout is building..." state with block-by-block animation stagger
**Why**: The AI should feel like a collaborative teammate, not a slot machine. The "thinking" affordance is critical for the educational message — AI is a tool that takes your input and acts on it.

### 8. Sound Design (Optional but High-Impact)
**Tags**: Game Design, Polish
**Current**: Completely silent.
**Proposed**: Minimal, tasteful audio:
- Block placement: Soft "click" (think LEGO snap)
- AI block placement: Slightly different tone (electronic chirp)
- Timer warning: Gentle chime at 30 seconds remaining
- Round transition: Brief musical sting
- Score reveal: Rising tone proportional to score
- All sounds mutable with a single toggle
**Why**: Sound dramatically increases the sense of a polished, intentional experience. For a live demo with an audience, audio fills the room and creates shared moments.

### 9. Improve AI Conversation Context
**Tags**: Education, Game Design
**Current**: AI gets conversation history (last 10 messages) but doesn't know what's been built. Each message is capped at 500 chars.
**Proposed**:
- Pass the team's current grid state to the AI alongside the target, so Scout can say "You've already got the walls up — now add windows at row 2!"
- This makes the AI genuinely collaborative rather than repeating the same instructions
- Add a brief "progress summary" to the system prompt: "The team has placed X blocks so far. Y% matches the target."
**Why**: The educational thesis is about AI as a force multiplier. An AI that doesn't know what you've done can't truly collaborate — it just recites instructions. Making Scout aware of progress transforms the demo from "AI gives instructions" to "AI understands your work and helps you improve."

### 10. Mobile Layout Refinements
**Tags**: UX
**Current**: Grid takes 45vh, chat gets a fixed 192px. On smaller phones, the grid is cramped and the chat panel doesn't scroll well.
**Proposed**:
- Make the grid/chat split draggable or use a tab interface on small screens (Grid | Chat tabs)
- Ensure the block palette has large enough touch targets (current look is functional but tight)
- Add haptic feedback on block placement (one line: `navigator.vibrate?.(10)`)
- Test and optimize for iPhone SE (smallest common phone at ~375px width)
**Why**: Most panelists will play on phones. A cramped, fiddly interface undermines the "AI makes building accessible" message.

---

## Tier 3: MEDIUM — Game Design & Educational Polish

These improvements deepen the educational impact and make the presentation more memorable.

### 11. Architect View of Builder Progress (Split Screen)
**Tags**: Game Design, Education
**Current**: Architects see only the target grid. They have no way to see what Builders have placed — they must rely entirely on chat.
**Proposed**: Show a small thumbnail of the Builder's grid alongside the target (or a "peek" toggle). This is especially helpful because:
- It lets Architects give more targeted instructions: "The left wall is right, but the window should be one row higher"
- It creates a natural feedback loop that mirrors real construction management
**Why**: The communication challenge is important, but total blindness feels frustrating rather than instructive. Real architects can see the construction site. A small preview makes the game feel fair while keeping communication central.

### 12. Better Target Descriptions for AI
**Tags**: Education, Technical
**Current**: AI descriptions in the system prompt are plain coordinate dumps like `Layer 0: (0,0):wall (0,1):wall...`.
**Proposed**: Add rich natural-language descriptions alongside the coordinate data:
- "The Cottage is a rectangular building with walls around the perimeter, a floor interior, a door at the front center, windows on the sides, and a complete roof on top."
- Include spatial relationships: "The door faces south (high row numbers)"
- Include building strategy: "Start with the ground-floor walls, then add interior floor, then upper walls with windows, then the roof last"
**Why**: Better AI descriptions → better AI responses → more impressive demo results → stronger thesis. The AI should sound like a skilled foreman, not a coordinate reader.

### 13. Round 1 vs Round 2 Difficulty Tuning
**Tags**: Game Design, Education
**Current**: Round 1 targets are 2-3 layers, Round 2 targets are 3-4 layers. Both use the same 8x8 grid.
**Concern**: If Round 2 targets are too hard, even with AI help the scores may not improve dramatically enough to make the thesis point. If too easy, the improvement isn't impressive.
**Proposed**:
- Playtest both rounds and verify that Round 1 targets consistently score 25-45% and Round 2 targets with AI consistently score 75-95%
- Consider making Round 1 targets slightly harder (so human-only scores are lower) and Round 2 slightly easier (so AI-assisted scores are higher) — amplifying the delta
- The Cottage (R1) and Barn (R2) are good calibration targets for testing
**Why**: The entire presentation pivots on a dramatic score improvement. This needs to be reliable, not left to chance.

### 14. Pre-Game "Practice Round" or Demo Mode
**Tags**: Education, Game Design
**Current**: No way to practice or demonstrate the mechanics before the timed game starts.
**Proposed**: Add a "Demo Mode" the host can trigger from the lobby that:
- Gives everyone 60 seconds to place blocks on a free-build grid (no target)
- Lets people discover the palette, placement, erasure, and stacking
- The host can narrate: "Try tapping different blocks and building something!"
- Ends with a clear transition into "Now let's play for real"
**Why**: With 10-25 people who've never seen the interface, a 1-minute practice round prevents the first 2 minutes of Round 1 from being wasted on UI confusion. The game is only 17 minutes — every second counts.

### 15. Interstitial Content Enhancement
**Tags**: Education, Branding
**Current**: The RoundTransition component shows a cinematic "Now... with Robots" animation.
**Proposed**: Enhance the interstitial to include:
- A brief (2-3 sentence) 500 Acres mission statement: "500 Acres is building AI-powered pipelines so Gen Z can construct real homes..."
- A visual of the Skylark 250 block system (if imagery is available)
- The phrase "Same challenge. New tools." as a header
- Brief instructions: "This round, you have Scout — an AI that can describe, instruct, AND build alongside you"
**Why**: This is the thesis moment. The transition between rounds is when the audience should feel the conceptual shift. Currently it's cinematic but content-light.

### 16. Activity Feed Shows Team Names
**Tags**: UX, Polish
**Current**: Activity feed on host screen shows raw `teamId` instead of team names.
**Fix**: Look up `state.teams[msg.teamId]?.name` in the activity ticker.
**Why**: Small fix, but on the projector screen, "team-0: Let's build walls!" reads as broken. "Cabin Crew: Let's build walls!" reads as alive.

---

## Tier 4: NICE TO HAVE — Extra Polish

These are "wow factor" additions that elevate the demo from good to memorable.

### 17. Live Score Counter During Rounds
**Tags**: Game Design, UX
**Current**: Scores are only calculated and shown at round end.
**Proposed**: Show a real-time accuracy percentage on the host's mosaic view that updates as teams build (maybe debounced to every 5 seconds). Don't show it to players (preserves suspense) — only the host/projector screen.
**Why**: The audience watching the projector can see teams' progress in real-time, creating tension and excitement. "Oh, Cabin Crew just jumped to 60%!"

### 18. AI Rate Limiting with Feedback
**Tags**: Technical, UX
**Current**: No rate limiting on the AI endpoint. Enthusiastic players could spam messages.
**Proposed**: Add a 3-second cooldown per team. While cooling down, show "Scout is busy — try again in a moment" in the chat.
**Why**: Prevents accidental API cost spikes and teaches players to give meaningful instructions rather than spamming.

### 19. "Build Replay" Animation
**Tags**: Game Design, Polish
**Current**: Reveal shows static final builds side-by-side with the target.
**Proposed**: Optional "replay" button that shows the team's build animated block-by-block in placement order (requires storing placement history server-side).
**Why**: Watching a building assemble itself is deeply satisfying and would be a highlight of the projector presentation. It shows the process, not just the result.

### 20. QR Code on Summary Screen
**Tags**: Branding
**Current**: Summary has a text link to 500acres.org.
**Proposed**: Add an actual QR code (generated client-side with a lightweight library or pre-rendered SVG) that audience members can scan from the projector screen.
**Why**: For a room of 25 people watching a projector, a QR code is instant engagement. A URL they have to type is friction.

### 21. Accessibility: Screen Reader + Keyboard Navigation
**Tags**: UX, Education
**Current**: Canvas-based grid has no keyboard navigation. Block placement requires pointer interaction only.
**Proposed**:
- Add keyboard navigation for the grid (arrow keys to move cursor, Enter to place)
- Ensure all interactive elements have proper ARIA labels
- Chat panel should be screen-reader friendly (already has basic text, just needs role attributes)
**Why**: As an educational demo about inclusive building, the tool itself should be accessible.

### 22. Team Chat Emoji Reactions
**Tags**: Game Design, UX
**Current**: Chat is text-only.
**Proposed**: Add 4-5 quick-reaction emoji buttons below the chat input (thumbs up, question mark, celebration, pointing hand, robot face). Tap to send as a chat message.
**Why**: During a timed game, quick reactions reduce friction. A builder who understands the architect's instruction can quickly thumbs-up instead of typing "got it" — saving precious seconds.

### 23. Host Moderator View
**Tags**: Game Design
**Current**: Host can see all team grids (mosaic) but can't see any team's chat or intervene.
**Proposed**: Allow the host to click a team in the mosaic to see their chat feed. Optionally allow the host to send a broadcast message to all teams ("30 seconds left! Build that roof!").
**Why**: For a facilitated educational demo, the host should be able to narrate what's happening. Seeing team chat lets them pull quotes for commentary during reveals.

### 24. Celebration Moments
**Tags**: Game Design, Polish
**Current**: Confetti shows on final reveal. Score gauge animates.
**Proposed**: Add micro-celebrations throughout:
- When a team hits 50% accuracy: brief sparkle effect on their mosaic tile
- When AI places blocks: subtle ripple animation from placed blocks
- When the final average improvement number animates up: screen-wide shimmer effect
- Consider a brief camera shake (CSS transform) when the "That's what robots do" stat card appears
**Why**: The demo is telling a story about transformation. Celebration moments are the emotional punctuation that makes the story land.

---

## Implementation Priority for Friday Demo

**Day 1 (Tuesday, Feb 24):**
- Tier 1 items #1-4 (critical bugs + reconnection)
- Tier 2 item #5 (onboarding tutorial — quick overlay)
- Tier 3 item #16 (activity feed team names — 1-line fix)

**Day 2 (Wednesday, Feb 25):**
- Tier 2 items #6-7 (waiting states + AI typing indicator)
- Tier 3 items #12-13 (AI descriptions + difficulty tuning)
- Tier 3 item #15 (interstitial content)

**Day 3 (Thursday, Feb 26):**
- Tier 2 item #10 (mobile layout refinements)
- Full end-to-end playtest with 3-4 people
- Fix anything discovered in playtesting

**Friday morning (Feb 27):**
- Deploy final build
- One quick run-through with host laptop + projector
- Verify WiFi, room code visibility, timer sync

---

## Design Principles for Final Polish

1. **Every second counts**: The game is 17 minutes. Remove friction everywhere. Players should be building within 5 seconds of the round starting.

2. **The projector is the main stage**: The host view is what the audience sees. It should look cinematic, professional, and tell a clear story.

3. **The thesis must be unmistakable**: Round 1 scores should be low (30-40%). Round 2 scores should be high (80-90%). The improvement should feel dramatic, not incremental. If playtesting doesn't show this, tune the targets.

4. **Warmth over tech**: The aesthetic should feel inviting and homey, not sterile. Pixel art, warm colors, playful typography. This is about building homes, not writing code.

5. **Fail gracefully**: In a live demo, things will go wrong. Every failure mode should have a recovery path. Host reconnection, player reconnection, AI fallback messages, timer manual override.
