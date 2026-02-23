"use client";

import type { GamePhase } from "@/lib/types";
import Timer from "./Timer";

interface GameHeaderProps {
  phase: GamePhase;
  teamName?: string;
  role?: "architect" | "builder";
  timerEnd?: number | null;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  lobby: "Waiting for host...",
  round1: "ROUND 1: OLD SCHOOL",
  reveal1: "Results",
  interstitial: "Get ready...",
  round2: "ROUND 2: WITH ROBOTS",
  finalReveal: "Final Results",
  summary: "Game Over",
};

const ROLE_LABELS: Record<"architect" | "builder", string> = {
  architect: "Architect",
  builder: "Builder",
};

export default function GameHeader({
  phase,
  teamName,
  role,
  timerEnd,
}: GameHeaderProps) {
  const isRound2 = phase === "round2";
  const isPlaying = phase === "round1" || phase === "round2";

  const bgClass = isRound2
    ? "bg-[#2a2520] border-[#3d6b4f]/40"
    : "bg-[#f5f1ea] border-[#8b5e3c]/20";

  const phaseColor = isRound2 ? "text-[#6b8f71]" : "text-[#8b5e3c]";
  const subColor = isRound2 ? "text-[#e8e0d0]/60" : "text-[#2a2520]/50";
  const timerColor = isRound2 ? "text-[#6b8f71]" : "text-[#2a2520]";

  return (
    <header
      className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${bgClass}`}
    >
      {/* Left: phase label + team/role */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={`font-[family-name:var(--font-pixel)] text-[9px] tracking-wider uppercase leading-tight ${phaseColor}`}
        >
          {PHASE_LABELS[phase]}
        </span>
        {(teamName || role) && (
          <span className={`text-xs leading-tight ${subColor}`}>
            {teamName && (
              <span className="font-semibold">{teamName}</span>
            )}
            {teamName && role && (
              <span className="mx-1 opacity-40">&middot;</span>
            )}
            {role && (
              <span>{ROLE_LABELS[role]}</span>
            )}
          </span>
        )}
      </div>

      {/* Right: timer (only during active rounds) */}
      {isPlaying && timerEnd != null && (
        <Timer
          endTime={timerEnd}
          className={`${timerColor} shrink-0`}
        />
      )}
    </header>
  );
}
