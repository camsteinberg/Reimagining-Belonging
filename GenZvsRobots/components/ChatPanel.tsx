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

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isRound2: boolean;
  disabled?: boolean;
  teamName?: string;
}

export default function ChatPanel({
  messages,
  onSend,
  isRound2,
  disabled = false,
  teamName,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <div ref={messagesEndRef} />
      </div>

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
          className={[
            "shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-opacity",
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
