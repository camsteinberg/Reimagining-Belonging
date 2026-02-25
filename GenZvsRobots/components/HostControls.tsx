"use client";

import { motion } from "framer-motion";
import type { GamePhase, ClientMessage, HostAction } from "@/lib/types";

interface HostControlsProps {
  phase: GamePhase;
  send: (msg: ClientMessage) => void;
  hasDesigns?: boolean;
}

function HostButton({
  label,
  action,
  send,
  variant = "primary",
}: {
  label: string;
  action: HostAction;
  send: (msg: ClientMessage) => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variantClasses: Record<string, string> = {
    primary:
      "bg-rust text-warm-white hover:bg-ember border-2 border-rust/60",
    secondary:
      "bg-charcoal/60 text-cream hover:bg-charcoal border-2 border-cream/20",
    danger:
      "bg-ember text-warm-white hover:bg-rust border-2 border-ember/60",
  };

  return (
    <motion.button
      onClick={() => send({ type: "hostAction", action })}
      className={[
        "px-6 min-h-[48px] py-3 rounded font-[family-name:var(--font-pixel)] text-[10px] tracking-wide uppercase",
        "transition-colors duration-150 cursor-pointer select-none focus-ring",
        variantClasses[variant],
      ].join(" ")}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      {label}
    </motion.button>
  );
}

export default function HostControls({ phase, send, hasDesigns }: HostControlsProps) {
  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-wrap items-center justify-center gap-3"
    >
      {phase === "lobby" && (
        <>
          <HostButton label="Practice Round" action="startDemo" send={send} variant="secondary" />
          {hasDesigns ? (
            <HostButton label="Start Round 1" action="startRound" send={send} variant="primary" />
          ) : (
            <HostButton label="Start Design Phase" action="startDesign" send={send} variant="primary" />
          )}
        </>
      )}

      {phase === "design" && (
        <HostButton label="End Design Phase" action="endDesign" send={send} variant="primary" />
      )}

      {phase === "demo" && (
        <HostButton label="End Practice" action="endDemo" send={send} variant="secondary" />
      )}

      {(phase === "round1" || phase === "round2") && (
        <>
          <HostButton label="Skip to Reveal" action="skipToReveal" send={send} variant="secondary" />
          <HostButton label="Pause" action="pause" send={send} variant="secondary" />
        </>
      )}

      {phase === "reveal1" && (
        <HostButton label="Continue" action="nextReveal" send={send} variant="primary" />
      )}

      {phase === "interstitial" && (
        <HostButton label="Start Round 2" action="startRound" send={send} variant="primary" />
      )}

      {phase === "finalReveal" && (
        <HostButton label="Show Summary" action="nextReveal" send={send} variant="primary" />
      )}

      {phase === "summary" && (
        <HostButton label="Play Again" action="endGame" send={send} variant="primary" />
      )}
    </motion.div>
  );
}
