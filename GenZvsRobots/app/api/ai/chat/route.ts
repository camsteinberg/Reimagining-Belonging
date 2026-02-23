import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/aiPrompt";
import { parseAIResponse } from "@/lib/parseAIActions";
import { ROUND_2_TARGET } from "@/lib/targets";

export async function POST(req: NextRequest) {
  try {
    const { roomCode, teamId, text, playerId, history } = await req.json();

    if (!roomCode || !teamId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }
    const anthropic = new Anthropic({ apiKey });

    const target = ROUND_2_TARGET;
    const systemPrompt = buildSystemPrompt(target, 2);

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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const aiText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    const parsed = parseAIResponse(aiText);

    // Push AI response into the Partykit room via HTTP
    const partyHost =
      process.env.PARTYKIT_HOST ||
      process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
      "blueprint-telephone.camsteinberg.partykit.dev";
    const partyProtocol = partyHost.startsWith("localhost") || partyHost.startsWith("127.") ? "http" : "https";

    await fetch(`${partyProtocol}://${partyHost}/party/${roomCode.toLowerCase()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "aiResponse",
        teamId,
        text: parsed.text,
        actions: parsed.actions,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI chat error:", message, error);
    return NextResponse.json({ error: "AI request failed", detail: message }, { status: 500 });
  }
}
