# Gametest Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 gametest issues: button overlap, Scout actions not applied, Scout response readability, and chat tips (content + persistence).

**Architecture:** Four independent fixes touching VoxelGrid buttons (CSS), AI action pipeline (parser + route + client timeout), AI prompt (brevity rewrite), and ChatPanel tips (content + collapsible UI). Each task is self-contained.

**Tech Stack:** Next.js 16, React 19, TypeScript, PartyKit, Canvas 2D, Anthropic Claude API, Tailwind CSS, Framer Motion, Jest

---

### Task 1: Fix Button Overlap in VoxelGrid

**Files:**
- Modify: `components/VoxelGrid.tsx:314-369`

**Step 1: Replace absolute-positioned buttons with flex container**

In `components/VoxelGrid.tsx`, find the buttons section (lines 314-369). Currently:

```tsx
{(
  <>
    {/* Top-down / 3D view toggle — next to rotation button */}
    <button
      onClick={() => setTopDown((v) => !v)}
      className={[
        "absolute top-2 right-28 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
        ...
      ].join(" ")}
    >
      ...
    </button>

    {/* Rotate toggle — prominent labeled button */}
    <button
      onClick={() => setRotationLocked((l) => !l)}
      className={[
        "absolute top-2 right-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
        ...
      ].join(" ")}
    >
      ...
    </button>

    {/* Rotation arrows — visible when unlocked */}
    {!rotationLocked && (
      ...
    )}
  </>
)}
```

Replace the entire `{( <> ... </> )}` block with a flex container approach:

```tsx
{/* View controls — top-right row */}
<div className="absolute top-2 right-2 flex gap-2 z-10">
  {/* Top-down / 3D view toggle */}
  <button
    onClick={() => setTopDown((v) => !v)}
    className={[
      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
      topDown
        ? "bg-[#b89f65]/90 hover:bg-[#b89f65] text-[#2a2520] ring-1 ring-[#b89f65]"
        : "bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] ring-1 ring-[#b89f65]/40",
    ].join(" ")}
    title={topDown ? "Switch to 3D isometric view" : "Switch to 2D top-down view"}
    type="button"
  >
    <span className="text-sm">{topDown ? "3D" : "2D"}</span>
  </button>

  {/* Rotate toggle */}
  <button
    onClick={() => setRotationLocked((l) => !l)}
    className={[
      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-[family-name:var(--font-pixel)] transition-all duration-200 shadow-md",
      rotationLocked
        ? "bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] ring-1 ring-[#b89f65]/40 animate-[pulse_3s_ease-in-out_2]"
        : "bg-[#b89f65]/90 hover:bg-[#b89f65] text-[#2a2520] ring-1 ring-[#b89f65]",
    ].join(" ")}
    title={rotationLocked ? "Unlock to rotate the building view" : "Lock rotation"}
    type="button"
  >
    <span className="text-sm">{rotationLocked ? "\uD83D\uDD12" : "\uD83D\uDD13"}</span>
    <span>{rotationLocked ? "Rotate" : "Lock"}</span>
  </button>
</div>

{/* Rotation arrows — visible when unlocked */}
{!rotationLocked && (
  <>
    <button
      onClick={rotateLeft}
      className="absolute bottom-2 left-2 bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] rounded-lg px-3 py-2 text-base font-mono transition-colors shadow-md ring-1 ring-[#b89f65]/30"
      title="Rotate left"
      type="button"
    >
      \u25C0
    </button>
    <button
      onClick={rotateRight}
      className="absolute bottom-2 right-2 bg-[#4a3728]/80 hover:bg-[#4a3728] text-[#e8e0d0] rounded-lg px-3 py-2 text-base font-mono transition-colors shadow-md ring-1 ring-[#b89f65]/30"
      title="Rotate right"
      type="button"
    >
      \u25B6
    </button>
  </>
)}
```

Key change: Both buttons are now flex children inside a single `absolute top-2 right-2 flex gap-2` container. No hardcoded `right-28` offset. Buttons cannot overlap.

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: Clean (only pre-existing simulate-game errors)

**Step 3: Commit**

```bash
git add components/VoxelGrid.tsx
git commit -m "fix: replace absolute button positioning with flex container to prevent overlap"
```

---

### Task 2: Fix Scout Actions Not Applied

This task has three sub-parts: parser robustness, error surfacing, and client timeout.

**Files:**
- Modify: `lib/parseAIActions.ts:6-41`
- Modify: `__tests__/parseAIActions.test.ts`
- Modify: `app/api/ai/chat/route.ts:83-108`
- Modify: `components/PlayerView.tsx:537-564`

**Step 1: Write failing tests for parser edge cases**

In `__tests__/parseAIActions.test.ts`, add these tests at the end of the `describe` block (before the closing `});`):

```typescript
  it("handles whitespace and newlines inside actions tags", () => {
    const text = `Done! <actions>
    [
      {"row": 0, "col": 0, "block": "wall"},
      {"row": 0, "col": 1, "block": "wall"}
    ]
    </actions>`;
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(2);
    expect(result.text).toBe("Done!");
  });

  it("handles multiple actions blocks by merging them", () => {
    const text = 'Walls first! <actions>[{"row":0,"col":0,"block":"wall"}]</actions> Now the floor. <actions>[{"row":1,"col":1,"block":"floor"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].block).toBe("wall");
    expect(result.actions[1].block).toBe("floor");
    expect(result.text).toBe("Walls first!  Now the floor.");
  });

  it("handles actions tags with extra spaces around JSON", () => {
    const text = '<actions>  [{"row":0,"col":0,"block":"wall"}]  </actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(1);
  });
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/GenZvsRobots && npx jest __tests__/parseAIActions.test.ts --verbose`
Expected: The "multiple actions blocks" test fails (current regex uses non-greedy `[\s\S]*?` with `match()` which only captures first match). The whitespace test may also fail depending on JSON.parse behavior.

**Step 3: Fix the parser to handle edge cases**

In `lib/parseAIActions.ts`, replace the `parseAIResponse` function:

```typescript
export function parseAIResponse(text: string): AIResponse {
  const actions: BuildAction[] = [];

  // Extract ALL <actions> blocks (there may be multiple)
  const actionsRegex = /<actions>([\s\S]*?)<\/actions>/g;
  let match;
  while ((match = actionsRegex.exec(text)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            typeof item.row === "number" &&
            typeof item.col === "number" &&
            VALID_BLOCKS.has(item.block) &&
            item.row >= 0 && item.row < GRID_SIZE &&
            item.col >= 0 && item.col < GRID_SIZE
          ) {
            actions.push({
              row: item.row,
              col: item.col,
              block: item.block as BlockType,
              height: typeof item.height === "number" ? item.height : undefined,
            });
          }
        }
      }
    } catch {
      // Invalid JSON in this block, skip it
    }
  }

  // Clean text (remove all <actions> tags from display text)
  const cleanText = text.replace(/<actions>[\s\S]*?<\/actions>/g, "").trim();

  return { text: cleanText, actions };
}
```

Key changes:
- Use `exec()` in a loop with the `g` flag to capture ALL `<actions>` blocks
- `.trim()` the JSON string before parsing (handles whitespace/newlines)
- Merge actions from all blocks into one array

**Step 4: Run tests to verify they pass**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/GenZvsRobots && npx jest __tests__/parseAIActions.test.ts --verbose`
Expected: All tests pass including the 3 new ones

**Step 5: Add error surfacing in route.ts**

In `app/api/ai/chat/route.ts`, after the PartyKit push (around line 105-107), replace the error-only log with a fallback chat message:

Find this block:
```typescript
    if (!pushRes.ok) {
      console.error("PartyKit push failed:", pushRes.status, await pushRes.text());
    }

    return NextResponse.json({ success: true });
```

Replace with:
```typescript
    if (!pushRes.ok) {
      const errText = await pushRes.text();
      console.error("PartyKit push failed:", pushRes.status, errText);
      // Send fallback error message to PartyKit so player sees something
      try {
        await fetch(`${partyProtocol}://${partyHost}/party/${roomCode.toLowerCase()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-party-secret": process.env.PARTY_SECRET || "dev-secret",
          },
          body: JSON.stringify({
            type: "aiResponse",
            teamId,
            text: parsed.text || "I had trouble with that request. Try again!",
            actions: [],
          }),
        });
      } catch {
        // Fallback also failed, nothing more we can do
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
```

Also add a log after parsing actions (around line 83) to help debug:
```typescript
    const parsed = parseAIResponse(aiText);
    console.log(`[AI] Room=${roomCode} Team=${teamId} Actions=${parsed.actions.length} TextLen=${parsed.text.length}`);
```

**Step 6: Add client-side timeout for aiThinking**

In `components/PlayerView.tsx`, find `handleSendChat` (around line 537). After `setAiThinking(true)` (line 545), add a timeout that clears the thinking state after 20 seconds:

Find:
```typescript
      if (isRound2 && isScoutMessage && state.code) {
        setAiThinking(true);
        fetch("/api/ai/chat", {
```

Replace with:
```typescript
      if (isRound2 && isScoutMessage && state.code) {
        setAiThinking(true);
        // Safety timeout: clear thinking indicator after 20s even if no response
        const thinkingTimeout = setTimeout(() => setAiThinking(false), 20000);
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            roomCode: state.code,
            teamId,
            playerId,
            role,
            targetGrid: team?.roundTarget ?? state.currentTarget,
            aiActionLog: team?.aiActionLog?.slice(-10),
          }),
        }).then((res) => {
          if (!res.ok) {
            clearTimeout(thinkingTimeout);
            setAiThinking(false);
          }
        }).catch(() => {
          clearTimeout(thinkingTimeout);
          setAiThinking(false);
        });
      }
```

Note: Remove the old `.catch(() => { setAiThinking(false); })` and replace with the `.then().catch()` chain above. The timeout is NOT cleared on success because the thinking indicator should stay until the AI chat message arrives via WebSocket (line 441).

**Step 7: Verify type check and tests**

Run: `npx tsc --noEmit && npx jest __tests__/parseAIActions.test.ts --verbose`
Expected: Clean compile, all tests pass

**Step 8: Commit**

```bash
git add lib/parseAIActions.ts __tests__/parseAIActions.test.ts app/api/ai/chat/route.ts components/PlayerView.tsx
git commit -m "fix: Scout action pipeline — robust parser, error surfacing, client timeout"
```

---

### Task 3: Rewrite Scout Prompt for Readability

**Files:**
- Modify: `lib/aiPrompt.ts:30-151`
- Modify: `app/api/ai/chat/route.ts:65-67`

**Step 1: Reduce max_tokens in route.ts**

In `app/api/ai/chat/route.ts`, find line 67:
```typescript
        max_tokens: 500,
```

Replace with:
```typescript
        max_tokens: 150,
```

**Step 2: Rewrite the system prompt**

In `lib/aiPrompt.ts`, replace the entire `buildSystemPrompt` function body (lines 30-151) with this leaner version:

```typescript
export function buildSystemPrompt(
  target: Grid,
  round: 1 | 2,
  aiActionLog?: { row: number; col: number; block: string }[],
  role?: "architect" | "builder"
): string {
  // Match the target grid to its description
  const targets = round === 1 ? ROUND_1_TARGETS : ROUND_2_TARGETS;
  const descriptions = round === 1 ? ROUND_1_DESCRIPTIONS : ROUND_2_DESCRIPTIONS;
  const idx = targets.findIndex(t =>
    JSON.stringify(t) === JSON.stringify(target)
  );
  const desc = idx >= 0
    ? descriptions[idx]
    : "This building was designed by the team's Architect. Study the grid data below.";

  let gridStr = "";
  for (let h = 0; h < MAX_HEIGHT; h++) {
    const layerCells: string[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = target[r][c][h];
        if (cell !== "empty") layerCells.push(`${colToLetter(c)}${rowToNumber(r)}:${cell}`);
      }
    }
    if (layerCells.length > 0) {
      gridStr += `\nLayer ${h}: ${layerCells.join(" ")}`;
    }
  }

  let actionLogStr = "";
  if (aiActionLog && aiActionLog.length > 0) {
    actionLogStr = `\n\nRecent actions:\n`;
    actionLogStr += aiActionLog.map((a, i) =>
      `${i + 1}. ${colToLetter(a.col)}${rowToNumber(a.row)}: ${a.block}`
    ).join("\n");
    actionLogStr += "\nTo undo, place 'empty' at those positions via <actions>.";
  }

  const roleSection = role === "architect"
    ? `\n## YOUR ROLE: Architect Coach
You are talking to the ARCHITECT who designed this building.
- NEVER include <actions> tags. You cannot place blocks.
- Help them describe their design to their Builder teammate.
- Suggest simple descriptions: "Tell them: walls along the back edge, floors in the middle"
- Keep it to ONE short sentence.`
    : `\n## YOUR ROLE: Builder Helper
You are talking to the BUILDER who is recreating the Architect's design.
- You CAN and SHOULD place blocks using <actions> tags when asked to build.
- After building, confirm briefly: "Done! Placed 6 walls along the back."
- If they ask what to build, describe the next section simply.`;

  return `You are Scout, a friendly robot construction helper.

## RESPONSE RULES — FOLLOW STRICTLY
- Reply in ONE sentence. Maximum TWO if absolutely necessary.
- NEVER use bullet points, numbered lists, or multiple paragraphs.
- NEVER mention coordinates like "A1" or "Layer 0" in your text to players.
- Use plain spatial language: "back wall", "left side", "ground floor", "on top"
- Be warm and encouraging but extremely brief. This is a timed game!

## BAD vs GOOD responses
BAD: "I'll place wall blocks at positions A1 through A6 on Layer 0 to create the back wall foundation of the structure. This will form the northern edge."
GOOD: "Building the back wall for you!"

BAD: "The target has walls at A1, A2, A3, B1, B3, with floor tiles at B2, and a door at C2 on Layer 0, then roof blocks on Layer 1 at A1 through B3."
GOOD: "Tell them it's a small room with walls around the edges, a floor inside, a door in front, and a roof on top!"

## Target Structure
${desc}

## Grid (${GRID_SIZE}x${GRID_SIZE}, up to ${MAX_HEIGHT} high)
Columns A-${colToLetter(GRID_SIZE - 1)} (left-right), Rows 1-${GRID_SIZE} (back-front).
${gridStr}

## Block Types
wall, floor, roof, window, door (auto-stacks 2 high), plant, table, metal, concrete, barrel, pipe, air (invisible scaffold), empty (erases top block)

## Building (for <actions> only — never show to players)
To place blocks: <actions>[{"row":0,"col":0,"block":"wall"}]</actions>
Row/col are 0-indexed in actions. ALWAYS include <actions> when asked to build anything.
${actionLogStr}
${roleSection}`;
}
```

Key changes from current prompt:
- **Strict 1-sentence rule** at the top, before any other instruction
- **BAD vs GOOD examples** showing exactly what to avoid
- **No coordinate language in text** — "back wall" not "A1-A6"
- **Removed Intent Detection section** — unnecessary
- **Removed High-Level Commands section** — model handles naturally
- **Simplified block type list** — just names, no descriptions
- **Architect = coaching tone**, Builder = action-confirming tone
- **Grid data section is compact** — just coordinates for the model to parse, not for players

**Step 3: Verify type check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```bash
git add lib/aiPrompt.ts app/api/ai/chat/route.ts
git commit -m "fix: rewrite Scout prompt for brevity — 1-sentence max, no jargon, plain language"
```

---

### Task 4: Chat Tips — Fix Content + Make Persistent

**Files:**
- Modify: `components/ChatPanel.tsx`

**Step 1: Fix Round 2 Architect tip content**

In `components/ChatPanel.tsx`, find `ROUND2_ARCHITECT_TIPS` (lines 78-92). Replace with:

```typescript
const ROUND2_ARCHITECT_TIPS = {
  heading: "Describe YOUR design \u2014 Scout can help!",
  tips: [
    "Scout can see your design \u2014 ask it to help describe it",
    "Use simple language: 'walls along the back edge'",
    "Go layer by layer: ground floor, then upper floors",
    "Your teammate is building \u2014 guide them clearly!",
  ],
  prompts: [
    "Scout, describe my building to my teammate",
    "Scout, what does the ground floor look like?",
    "The ground floor has walls around the edges",
    "Now describe the second floor",
  ],
};
```

Key change: Removed building commands ("Scout, build the entire ground floor", "Scout, place walls from A1 to A6") and replaced with describe-only prompts. The Architect's Scout is in describe-only mode.

**Step 2: Fix Round 2 Builder tip content**

Find `ROUND2_BUILDER_TIPS` (lines 94-108). Replace with:

```typescript
const ROUND2_BUILDER_TIPS = {
  heading: "Scout + your teammate can help you build!",
  tips: [
    "Say 'Scout, build...' to have Scout place blocks for you",
    "Ask Scout to handle big sections while you do details",
    "Ask Scout to fix or undo mistakes",
    "Your teammate designed this \u2014 ask them for guidance too!",
  ],
  prompts: [
    "Scout, build the ground floor",
    "Scout, what should I build next?",
    "Scout, fix the walls",
    "Scout, undo the last action",
  ],
};
```

**Step 3: Make tips persistent with a collapsible help button**

This requires changes to the `ChatPanel` component. Add a `showTips` state and a help toggle button.

In `ChatPanel`, add state (after existing `useState` calls around line 208):

```typescript
const [showTips, setShowTips] = useState(true);
```

Auto-collapse tips after first message — add a `useEffect` after the scroll effect (around line 213):

```typescript
// Auto-collapse tips when messages arrive
useEffect(() => {
  if (messages.length > 0) {
    setShowTips(false);
  }
}, [messages.length]);
```

In the chat header (around line 239-268), add a help toggle button. Find the closing `</div>` of the header `div` (line 268) and add the button before it, right after the "Scout online" span:

Find:
```tsx
        {isRound2 && (
          <span className="flex items-center gap-1.5">
            ...Scout online...
          </span>
        )}
      </div>
```

Replace with:
```tsx
        <span className="flex items-center gap-1.5">
          {isRound2 && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6b8f71] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6b8f71]" />
              </span>
              <span
                className="font-[family-name:var(--font-pixel)] text-[7px] tracking-wider"
                style={{ color: "#6b8f71" }}
              >
                Scout online
              </span>
            </span>
          )}
          {!disabled && role && (
            <button
              type="button"
              onClick={() => setShowTips((v) => !v)}
              className={[
                "ml-1 w-6 h-6 rounded-full text-[10px] font-bold transition-colors flex items-center justify-center",
                isRound2
                  ? showTips
                    ? "bg-[#6b8f71] text-[#f5f1ea]"
                    : "bg-[#6b8f71]/20 text-[#6b8f71] hover:bg-[#6b8f71]/30"
                  : showTips
                  ? "bg-[#8b5e3c] text-[#f5f1ea]"
                  : "bg-[#8b5e3c]/15 text-[#8b5e3c] hover:bg-[#8b5e3c]/25",
              ].join(" ")}
              aria-label={showTips ? "Hide tips" : "Show tips"}
            >
              ?
            </button>
          )}
        </span>
      </div>
```

Finally, change the tips visibility condition. Find (around line 273-277):

```tsx
        <AnimatePresence>
          {messages.length === 0 && role && !disabled && (
            <ChatTips role={role} isRound2={isRound2} onSend={onSend} phase={phase} />
          )}
        </AnimatePresence>
```

Replace with:

```tsx
        <AnimatePresence>
          {showTips && role && !disabled && (
            <ChatTips role={role} isRound2={isRound2} onSend={onSend} phase={phase} />
          )}
        </AnimatePresence>
```

**Step 4: Verify type check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 5: Commit**

```bash
git add components/ChatPanel.tsx
git commit -m "fix: chat tips — correct role-specific content, persistent collapsible help button"
```

---

### Task 5: Final Verification

**Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: Clean (only pre-existing simulate-game errors)

**Step 2: Run all tests**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/GenZvsRobots && npx jest --verbose`
Expected: All tests pass (27+ tests), especially all parseAIActions tests

**Step 3: Production build**

Run: `npx next build`
Expected: Build succeeds

**Step 4: Commit any remaining fixes if needed**

If any verification step fails, fix and commit.
