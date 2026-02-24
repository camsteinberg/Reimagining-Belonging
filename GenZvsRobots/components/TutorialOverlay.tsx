"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialOverlayProps {
  role: "architect" | "builder";
  isRound2: boolean;
  onDismiss: () => void;
}

export default function TutorialOverlay({
  role,
  isRound2,
  onDismiss,
}: TutorialOverlayProps) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const message =
    role === "builder"
      ? "Tap a block type below, then tap the grid to place it. Your Architect will tell you what to build!"
      : "You can see the target. Use the chat to describe it to your team!";

  const round2Addition = "Scout the Robot is here to help!";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onDismiss}
        className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
        style={{
          backgroundColor: isRound2
            ? "rgba(26, 21, 16, 0.85)"
            : "rgba(42, 37, 32, 0.75)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="max-w-xs mx-6 text-center flex flex-col items-center gap-4"
        >
          {/* Role icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{
              backgroundColor: isRound2
                ? "rgba(107, 143, 113, 0.25)"
                : "rgba(139, 94, 60, 0.2)",
            }}
          >
            {role === "builder" ? "\u2692" : "\u{1F4AC}"}
          </div>

          {/* Role label */}
          <span
            className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.25em] uppercase"
            style={{
              color: isRound2 ? "#6b8f71" : "#b89f65",
            }}
          >
            You are the {role}
          </span>

          {/* Main message */}
          <p
            className="font-[family-name:var(--font-body)] text-base leading-relaxed"
            style={{ color: "#f5f1ea" }}
          >
            {message}
          </p>

          {/* Round 2 addition */}
          {isRound2 && (
            <p
              className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider uppercase"
              style={{ color: "#6b8f71" }}
            >
              {round2Addition}
            </p>
          )}

          {/* Tap to dismiss hint */}
          <span
            className="font-[family-name:var(--font-pixel)] text-[7px] tracking-widest uppercase mt-2"
            style={{ color: "rgba(245, 241, 234, 0.4)" }}
          >
            Tap anywhere to dismiss
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
