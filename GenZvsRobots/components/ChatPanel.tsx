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
  phase?: string;
}

// --- Communication tips by role, round, and phase ---

const DESIGN_TIPS = {
  heading: "Design Phase \u2014 Build something creative!",
  tips: [
    "Build your own creation \u2014 your teammate will recreate it later",
    "Use different block types to make it interesting",
    "Think about how you\u2019d describe this to someone who can\u2019t see it",
    "Keep it fun but buildable!",
  ],
  prompts: [
    "I\u2019m going to build a house with a garden!",
    "Let\u2019s make something with lots of windows",
    "I\u2019ll start with the walls on the ground floor",
    "Adding a roof on top!",
  ],
};

const ROUND1_ARCHITECT_TIPS = {
  heading: "Describe what YOU built to your teammate!",
  tips: [
    "Start with the foundation \u2014 describe the ground floor first",
    "Use grid coordinates like A1, B3 to be specific",
    "Name block types: wall, floor, roof, window, door, plant, table",
    "Go layer by layer \u2014 finish the ground floor before moving up",
  ],
  prompts: [
    "I\u2019ll describe my building \u2014 start with the ground floor",
    "Start at A1 \u2014 I placed a wall there",
    "The ground floor is mostly floor tiles with walls around the edges",
    "Ground floor first, then we\u2019ll go up",
  ],
};

const ROUND1_BUILDER_TIPS = {
  heading: "Your teammate designed this \u2014 ask them to describe it!",
  tips: [
    "Your teammate built this design \u2014 ask them to describe it",
    "Confirm block types before placing",
    "Ask about each section or row",
    "Let them know when you\u2019re done with a section",
  ],
  prompts: [
    "What did you build? Describe the ground floor",
    "What block type goes at A1?",
    "What\u2019s on the ground floor?",
    "Done with that row \u2014 what\u2019s next?",
  ],
};

const ROUND2_ARCHITECT_TIPS = {
  heading: "Describe YOUR design \u2014 Scout can help!",
  tips: [
    "Scout can see your design \u2014 ask it to help describe it",
    "Use simple language: \u2018walls along the back edge\u2019",
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

const ROUND2_BUILDER_TIPS = {
  heading: "Scout + your teammate can help you build!",
  tips: [
    "Say \u2018Scout, build...\u2019 to have Scout place blocks for you",
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

function ChatTips({
  role,
  isRound2,
  onSend,
  phase,
}: {
  role: "architect" | "builder";
  isRound2: boolean;
  onSend: (text: string) => void;
  phase?: string;
}) {
  const tips = phase === "design"
    ? DESIGN_TIPS
    : isRound2
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
  phase,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [showTips, setShowTips] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAIThinking]);

  // Auto-collapse tips when messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setShowTips(false);
    }
  }, [messages.length]);

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
    ? "Chat or say \"Scout...\" for AI help"
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

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {/* Communication tips — persistent, collapsible */}
        <AnimatePresence>
          {showTips && role && !disabled && (
            <ChatTips role={role} isRound2={isRound2} onSend={onSend} phase={phase} />
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
                "min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg text-base transition-colors",
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
