import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/aiPrompt";
import { parseAIResponse } from "@/lib/parseAIActions";
import { ROUND_2_TARGET } from "@/lib/targets";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { roomCode, teamId, text, playerId } = await req.json();

    if (!roomCode || !teamId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const target = ROUND_2_TARGET;
    const systemPrompt = buildSystemPrompt(target, 2);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
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
