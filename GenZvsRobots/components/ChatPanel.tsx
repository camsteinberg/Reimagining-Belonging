"use client";

import { useRef, useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isAI?: boolean;
  timestamp: number;
}

const QUICK_REACTIONS = ["\u{1F44D}", "\u2753", "\u{1F389}", "\u{1F449}", "\u{1F916}"];

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isRound2: boolean;
  disabled?: boolean;
  teamName?: string;
  isAIThinking?: boolean;
  role?: "architect" | "builder";
}

// --- Communication tips by role and round ---

const ROUND1_ARCHITECT_TIPS = {
  heading: "You see the target. Your builders don\u2019t!",
  tips: [
    "Start with the foundation \u2014 describe the ground floor first",
    "Use grid coordinates: \u201CPlace walls from (1,1) to (1,6)\u201D",
    "Name block types: wall, floor, roof, window, door, plant, table",
    "Go layer by layer \u2014 finish the ground floor before moving up",
  ],
  prompts: [
    "Start with a row of walls along row 1, from col 1 to col 6",
    "The ground floor is mostly floor tiles with walls around the edges",
    "Put a door at row 6, columns 3 and 4",
    "Now let\u2019s move to layer 1 \u2014 more walls on top",
  ],
};

const ROUND1_BUILDER_TIPS = {
  heading: "Your architect describes \u2014 you build!",
  tips: [
    "Ask where to start \u2014 don\u2019t guess!",
    "Confirm block types before placing",
    "Ask for one row or section at a time",
    "Let them know when you\u2019re done with a section",
  ],
  prompts: [
    "Where should I start?",
    "Which block type for the corners?",
    "What goes on row 0?",
    "Done with that row \u2014 what\u2019s next?",
  ],
};

const ROUND2_ARCHITECT_TIPS = {
  heading: "Scout (AI) can see the target too!",
  tips: [
    "Ask Scout to describe the whole building first",
    "Tell Scout to build entire sections at once",
    "Ask Scout to explain what\u2019s on a specific layer",
    "Combine: let Scout build while you guide your builders on details",
  ],
  prompts: [
    "Scout, describe the target building",
    "Scout, build the entire ground floor",
    "Scout, what blocks are on layer 2?",
    "Scout, place the roof on top",
  ],
};

const ROUND2_BUILDER_TIPS = {
  heading: "Scout is your AI co-builder!",
  tips: [
    "Ask Scout to build whole rows or sections for you",
    "Tell Scout to describe what you should place next",
    "Ask Scout to fix or adjust what\u2019s already placed",
    "Work together \u2014 you place blocks while Scout handles other areas",
  ],
  prompts: [
    "Scout, build the walls on row 0",
    "What should I build next?",
    "Scout, place all the floor tiles",
    "Scout, add windows to the second layer",
  ],
};

function ChatTips({
  role,
  isRound2,
  onSend,
}: {
  role: "architect" | "builder";
  isRound2: boolean;
  onSend: (text: string) => void;
}) {
  const tips = isRound2
    ? role === "architect"
      ? ROUND2_ARCHITECT_TIPS
      : ROUND2_BUILDER_TIPS
    : role === "architect"
    ? ROUND1_ARCHITECT_TIPS
    : ROUND1_BUILDER_TIPS;

  const accentColor = isRound2 ? "#6b8f71" : "#8b5e3c";
  const bgTint = isRound2 ? "rgba(107,143,113,0.08)" : "rgba(139,94,60,0.06)";
  const promptBg = isRound2 ? "rgba(107,143,113,0.12)" : "rgba(139,94,60,0.10)";
  const promptHover = isRound2
    ? "hover:bg-[#6b8f71]/20 active:bg-[#6b8f71]/30"
    : "hover:bg-[#8b5e3c]/15 active:bg-[#8b5e3c]/25";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2.5 px-1 py-1"
    >
      {/* Heading */}
      <p
        className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center"
        style={{ color: accentColor }}
      >
        {tips.heading}
      </p>

      {/* Tip bullets */}
      <ul className="flex flex-col gap-1">
        {tips.tips.map((tip, i) => (
          <li
            key={i}
            className="text-[10px] leading-snug px-2 py-1 rounded"
            style={{ backgroundColor: bgTint, color: isRound2 ? "#e8e0d0" : "#2a2520" }}
          >
            <span style={{ color: accentColor, marginRight: 4 }}>&bull;</span>
            {tip}
          </li>
        ))}
      </ul>

      {/* Tappable example prompts */}
      <div className="flex flex-col gap-1 mt-0.5">
        <p
          className="font-[family-name:var(--font-pixel)] text-[7px] tracking-wider uppercase"
          style={{ color: isRound2 ? "rgba(232,224,208,0.4)" : "rgba(42,37,32,0.35)" }}
        >
          Tap to send:
        </p>
        {tips.prompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSend(prompt)}
            className={[
              "text-left text-[10px] leading-snug px-2.5 py-1.5 rounded cursor-pointer transition-colors",
              promptHover,
            ].join(" ")}
            style={{
              backgroundColor: promptBg,
              color: isRound2 ? "#e8e0d0" : "#2a2520",
            }}
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({
  messages,
  onSend,
  isRound2,
  disabled = false,
  teamName,
  isAIThinking,
  role,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAIThinking]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInputValue("");
  }

  const placeholder = disabled
    ? "Chat disabled"
    : isRound2
    ? "Message your team..."
    : "Chat with your team...";

  return (
    <div
      className={[
        "flex flex-col h-full overflow-hidden rounded-lg border",
        isRound2
          ? "bg-[#2a2520]/95 border-[#6b8f71]/30 text-[#f5f1ea]"
          : "bg-[#f5f1ea]/90 border-[#8b5e3c]/20 text-[#2a2520]",
      ].join(" ")}
    >
      {/* Header */}
      <div
        className={[
          "flex items-center justify-between px-3 py-2 border-b shrink-0",
          isRound2
            ? "border-[#6b8f71]/30"
            : "border-[#8b5e3c]/20",
        ].join(" ")}
      >
        <span
          className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase"
          style={{ color: isRound2 ? "#6b8f71" : "#8b5e3c" }}
        >
          {teamName ? teamName : "Team Chat"}
        </span>

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
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {/* Communication tips — shown when no messages yet */}
        <AnimatePresence>
          {messages.length === 0 && role && !disabled && (
            <ChatTips role={role} isRound2={isRound2} onSend={onSend} />
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-start gap-2"
            >
              {/* Avatar */}
              <div
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none mt-0.5"
                style={
                  msg.isAI
                    ? { backgroundColor: "#6b8f71", color: "#f5f1ea" }
                    : {
                        backgroundColor: isRound2
                          ? "rgba(139,94,60,0.35)"
                          : "rgba(139,94,60,0.2)",
                        color: isRound2 ? "#f5f1ea" : "#2a2520",
                      }
                }
              >
                {msg.isAI ? "S" : msg.senderName.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{ color: isRound2 ? "#6b8f71" : "#8b5e3c" }}
                >
                  {msg.isAI ? "Scout (Robot)" : msg.senderName}
                </span>

                {msg.isAI ? (
                  <span
                    className="text-xs leading-snug px-2 py-1 rounded"
                    style={{
                      backgroundColor: "rgba(107,143,113,0.1)",
                    }}
                  >
                    {msg.text}
                  </span>
                ) : (
                  <span className="text-xs leading-snug break-words">
                    {msg.text}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI Typing Indicator */}
        {isAIThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-1 py-1"
          >
            <div className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none bg-[#6b8f71] text-[#f5f1ea]">
              S
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="font-[family-name:var(--font-pixel)] text-[7px] tracking-wider"
                style={{ color: "#6b8f71" }}
              >
                Scout is thinking
              </span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b8f71] animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Quick Reactions */}
      {!disabled && (
        <div
          className={[
            "flex items-center justify-center gap-1 px-3 py-1.5 border-t shrink-0",
            isRound2
              ? "border-[#6b8f71]/20"
              : "border-[#8b5e3c]/10",
          ].join(" ")}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSend(emoji)}
              className={[
                "min-h-[32px] min-w-[32px] px-2 py-1 rounded-lg text-base transition-colors",
                isRound2
                  ? "hover:bg-[#6b8f71]/20 active:bg-[#6b8f71]/30"
                  : "hover:bg-[#8b5e3c]/10 active:bg-[#8b5e3c]/20",
              ].join(" ")}
              aria-label={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className={[
          "flex items-center gap-2 px-3 py-2 border-t shrink-0",
          isRound2
            ? "border-[#6b8f71]/30"
            : "border-[#8b5e3c]/20",
        ].join(" ")}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={[
            "flex-1 text-xs px-2 py-1.5 rounded outline-none border",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isRound2
              ? "bg-[#1a1510] border-[#6b8f71]/30 text-[#f5f1ea] placeholder:text-[#f5f1ea]/30 focus:border-[#6b8f71]/60"
              : "bg-white/60 border-[#8b5e3c]/20 text-[#2a2520] placeholder:text-[#2a2520]/40 focus:border-[#8b5e3c]/50",
          ].join(" ")}
        />
        <button
          type="submit"
          disabled={disabled || !inputValue.trim()}
          aria-label="Send message"
          className={[
            "shrink-0 px-3 min-h-[44px] min-w-[44px] py-1.5 rounded text-xs font-semibold transition-opacity focus-ring",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            isRound2
              ? "bg-[#6b8f71] text-[#f5f1ea] hover:bg-[#3d6b4f]"
              : "bg-[#8b5e3c] text-[#f5f1ea] hover:bg-[#2a2520]",
          ].join(" ")}
        >
          Send
        </button>
      </form>
    </div>
  );
}
