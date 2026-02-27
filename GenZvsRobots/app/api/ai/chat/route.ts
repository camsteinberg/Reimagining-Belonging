import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildProgressContext } from "@/lib/aiPrompt";
import { parseAIResponse } from "@/lib/parseAIActions";
import { ROUND_2_TARGET } from "@/lib/targets";

// C3: In-memory rate limiter per team
const teamCooldowns = new Map<string, number>();
const COOLDOWN_MS = 3000;

export async function POST(req: NextRequest) {
  try {
    const { roomCode, teamId, text, playerId, role, history, teamGrid, targetGrid: clientTarget, aiActionLog } = await req.json();

    if (!roomCode || !teamId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // C3: Rate limit check
    const cooldownKey = `${roomCode}-${teamId}`;
    const lastCall = teamCooldowns.get(cooldownKey) || 0;
    if (Date.now() - lastCall < COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Scout is busy — try again in a moment" },
        { status: 429 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }
    const anthropic = new Anthropic({ apiKey });

    const target = clientTarget ?? ROUND_2_TARGET;
    let systemPrompt = buildSystemPrompt(target, 2, aiActionLog, role);

    // C2: Append grid progress context if teamGrid provided
    const progressCtx = buildProgressContext(teamGrid ?? null, target);
    if (progressCtx) {
      systemPrompt += progressCtx;
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [];

    // Add conversation history if provided
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Keep last 10 messages for context
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: String(msg.content).slice(0, 500), // Limit message length
          });
        }
      }
    }

    // Add current message
    messages.push({ role: "user", content: text });

    // C3: Set cooldown BEFORE the API call to prevent race with rapid messages
    teamCooldowns.set(cooldownKey, Date.now());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    const aiText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    const parsed = parseAIResponse(aiText);
    console.log(`[AI] Room=${roomCode} Team=${teamId} Actions=${parsed.actions.length} TextLen=${parsed.text.length}`);

    // Push AI response into the Partykit room via HTTP
    const partyHost =
      process.env.PARTYKIT_HOST ||
      process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
      "blueprint-telephone.camsteinberg.partykit.dev";
    const partyProtocol = partyHost.startsWith("localhost") || partyHost.startsWith("127.") ? "http" : "https";

    const pushRes = await fetch(`${partyProtocol}://${partyHost}/party/${roomCode.toLowerCase()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-party-secret": process.env.PARTY_SECRET || "dev-secret",
      },
      body: JSON.stringify({
        type: "aiResponse",
        teamId,
        text: parsed.text,
        actions: parsed.actions,
      }),
    });
    if (!pushRes.ok) {
      const errText = await pushRes.text();
      console.error("PartyKit push failed:", pushRes.status, errText);
      // Send fallback error message so player sees something
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
        // Fallback also failed
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI chat error:", message, error);
    return NextResponse.json({ error: "AI request failed", detail: message }, { status: 500 });
  }
}
