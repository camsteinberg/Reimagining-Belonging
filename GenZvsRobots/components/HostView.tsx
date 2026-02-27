"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoomState, ClientMessage, Player } from "@/lib/types";
import HostControls from "./HostControls";
import TeamMosaic from "./TeamMosaic";
import Timer from "./Timer";
import RevealCarousel from "./RevealCarousel";
import RoundComparison from "./RoundComparison";
import FinalSummary from "./FinalSummary";
import RoundTransition from "./RoundTransition";
import Confetti from "./Confetti";

// ---------------------------------------------------------------------------
// Activity feed item
// ---------------------------------------------------------------------------
export interface ActivityItem {
  id: string;
  teamName: string;
  text: string;
  timestamp: number;
}

interface HostViewProps {
  state: RoomState;
  send: (msg: ClientMessage) => void;
  connected: boolean;
  activityFeed: ActivityItem[];
}

// ---------------------------------------------------------------------------
// Phase-label map
// ---------------------------------------------------------------------------
const PHASE_LABELS: Record<string, string> = {
  lobby: "Lobby",
  design: "DESIGN YOUR BUILDING",
  demo: "PRACTICE ROUND",
  round1: "ROUND 1 — OLD SCHOOL",
  reveal1: "Round 1 Results",
  interstitial: "Get Ready...",
  round2: "ROUND 2 — WITH ROBOTS",
  finalReveal: "Final Results",
  summary: "Game Over",
};

// ---------------------------------------------------------------------------
// Connection dot
// ---------------------------------------------------------------------------
function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={[
          "inline-block w-2 h-2 rounded-full",
          connected ? "bg-sage animate-pulse" : "bg-ember",
        ].join(" ")}
      />
      <span className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest">
        {connected ? "Live" : "Reconnecting"}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Lobby view
// ---------------------------------------------------------------------------
function LobbyView({
  state,
  send,
  connected,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
  connected: boolean;
}) {
  const allPlayers = Object.values(state.players);
  const players = allPlayers.filter((p) => p.connected);
  const hostname =
    typeof window !== "undefined" ? window.location.host : "join";
  const isOddPlayers = players.length > 0 && players.length % 2 !== 0;
  const disableStart = players.length === 0 || players.length % 2 !== 0;

  function handleKick(playerId: string) {
    send({ type: "hostAction", action: "kickPlayer", targetPlayerId: playerId });
  }

  return (
    <div className="flex flex-col h-full bg-charcoal text-cream overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] text-gold tracking-wider uppercase">
          Blueprint Telephone
        </span>
        <ConnectionDot connected={connected} />
      </div>

      {/* Odd player warning */}
      {isOddPlayers && (
        <div className="px-6 py-2 bg-[#b89f65]/20 border-b border-[#b89f65]/30 text-center">
          <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-[#b89f65]">
            Odd number of players — teams need 2 players each
          </span>
        </div>
      )}

      {/* Center: room code */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <p className="font-[family-name:var(--font-pixel)] text-[11px] text-cream/40 uppercase tracking-[0.3em] mb-3">
            Join the game
          </p>
          <div className="font-[family-name:var(--font-pixel)] text-8xl md:text-9xl text-gold leading-none tracking-widest drop-shadow-lg">
            {state.code}
          </div>
          <p className="mt-4 font-[family-name:var(--font-body)] text-sm text-cream/50 tracking-wide">
            {hostname}/join/{state.code}
          </p>
        </motion.div>

        {/* Theme input */}
        <div className="w-full max-w-md">
          <label className="block font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest mb-2 text-center">
            Design Theme (optional)
          </label>
          <input
            type="text"
            value={state.theme ?? ""}
            onChange={(e) => send({ type: "setTheme", theme: e.target.value })}
            placeholder="e.g. Houses, Castles, Vehicles..."
            maxLength={50}
            className="w-full text-center font-[family-name:var(--font-body)] text-sm px-4 py-2.5 rounded bg-white/5 border border-gold/30 text-cream placeholder:text-cream/20 outline-none focus:border-gold/60 transition-colors"
          />
        </div>

        {/* Player list */}
        <div className="w-full max-w-2xl mt-4">
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/40 uppercase tracking-widest mb-3 text-center">
            {players.length} player{players.length !== 1 ? "s" : ""} joined
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence>
              {players.map((p, i) => (
                <PlayerPip key={p.id} player={p} index={i} teams={state.teams} onKick={handleKick} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 py-5 border-t border-white/10 flex items-center justify-center">
        <HostControls phase={state.phase} send={send} hasDesigns={Object.values(state.players).some(p => p.designGrid != null)} disabled={disableStart} />
      </div>
    </div>
  );
}

function PlayerPip({
  player,
  index,
  teams,
  onKick,
}: {
  player: Player;
  index: number;
  teams: RoomState["teams"];
  onKick?: (playerId: string) => void;
}) {
  const teamName = teams[player.teamId]?.name ?? "—";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "backOut" }}
      className={[
        "flex items-center gap-2 rounded px-3 py-2",
        "bg-white/5 border border-white/10",
        !player.connected && "opacity-40",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="w-7 h-7 rounded-full bg-bark/60 flex items-center justify-center font-bold text-xs text-cream shrink-0">
        {player.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-cream truncate leading-tight">
          {player.name}
        </div>
        <div className="font-[family-name:var(--font-pixel)] text-[7px] text-gold/60 leading-tight truncate">
          {teamName}
        </div>
      </div>
      {onKick && (
        <button
          onClick={() => onKick(player.id)}
          className="shrink-0 w-8 h-8 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-cream/40 hover:text-ember hover:bg-ember/20 transition-colors text-xs"
          title={`Remove ${player.name}`}
          type="button"
        >
          X
        </button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Active round view
// ---------------------------------------------------------------------------
function ActiveRoundView({
  state,
  send,
  activityFeed,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
  activityFeed: ActivityItem[];
}) {
  const isRound2 = state.phase === "round2";
  const bgClass = isRound2 ? "bg-[#1a1c18]" : "bg-charcoal";
  const accentColor = isRound2 ? "text-sage" : "text-gold";
  const borderAccent = isRound2 ? "border-sage/20" : "border-gold/20";

  return (
    <div className={["flex flex-col h-full text-cream overflow-hidden", bgClass].join(" ")}>
      {/* Top bar */}
      <div className={["flex items-center justify-between px-5 py-3 border-b shrink-0", borderAccent].join(" ")}>
        <span
          className={[
            "font-[family-name:var(--font-pixel)] text-[10px] tracking-widest uppercase",
            accentColor,
          ].join(" ")}
        >
          {state.phase === "design" && state.theme
            ? `DESIGN YOUR BUILDING \u2014 Theme: ${state.theme}`
            : PHASE_LABELS[state.phase]}
        </span>
        {state.timerEnd != null && (
          <Timer
            endTime={state.timerEnd}
            className={accentColor}
          />
        )}
      </div>

      {/* Team mosaic — main area */}
      <div className="flex-1 min-h-0 p-4">
        <TeamMosaic
          teams={state.teams}
          players={state.players}
          phase={state.phase}
        />
      </div>

      {/* Activity feed ticker */}
      <ActivityTicker feed={activityFeed} isRound2={isRound2} />

      {/* Controls */}
      <div className={["px-5 py-3 border-t shrink-0", borderAccent].join(" ")}>
        <HostControls phase={state.phase} send={send} hasDesigns={Object.values(state.players).some(p => p.designGrid != null)} timerEnd={state.timerEnd} />
      </div>
    </div>
  );
}

function ActivityTicker({
  feed,
  isRound2,
}: {
  feed: ActivityItem[];
  isRound2: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [feed]);

  if (feed.length === 0) return null;

  const accent = isRound2 ? "text-sage" : "text-gold";
  const borderClass = isRound2 ? "border-sage/20" : "border-gold/20";

  return (
    <div
      className={["flex items-center gap-0 border-t overflow-hidden shrink-0 h-8", borderClass].join(" ")}
    >
      <span
        className={[
          "font-[family-name:var(--font-pixel)] text-[7px] uppercase tracking-widest px-3 shrink-0 border-r",
          accent,
          borderClass,
        ].join(" ")}
      >
        Live
      </span>
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto flex items-center gap-6 px-3 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        <AnimatePresence initial={false}>
          {[...feed].slice(-20).map((item) => (
            <motion.span
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5 shrink-0"
            >
              <span className={["font-[family-name:var(--font-pixel)] text-[7px]", accent].join(" ")}>
                {item.teamName}:
              </span>
              <span className="text-xs text-cream/60 max-w-[200px] truncate">
                {item.text}
              </span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal view (reveal1 phase) — uses RevealCarousel
// ---------------------------------------------------------------------------
function RevealView({
  state,
  send,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
}) {
  const teams = Object.values(state.teams);

  return (
    <div className="flex flex-col h-full bg-[#110f0d] text-cream overflow-hidden">
      <div className="flex-1 min-h-0">
        <RevealCarousel
          teams={teams}
          round={1}
          onComplete={() => send({ type: "hostAction", action: "nextReveal" })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Final reveal view (finalReveal phase) — RoundComparison carousel
// ---------------------------------------------------------------------------
function FinalRevealView({
  state,
  send,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
}) {
  const teams = Object.values(state.teams).filter((t) => t != null);
  const [[index, direction], setIndexDir] = useState<[number, number]>([0, 0]);

  if (teams.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#110f0d] text-cream items-center justify-center">
        <p className="text-cream/40">No teams to show.</p>
        <div className="mt-4">
          <HostControls phase={state.phase} send={send} hasDesigns={Object.values(state.players).some(p => p.designGrid != null)} />
        </div>
      </div>
    );
  }

  const clampedIndex = Math.min(index, teams.length - 1);
  const currentTeam = teams[clampedIndex];
  const isLast = clampedIndex >= teams.length - 1;

  function paginate(dir: number) {
    const next = clampedIndex + dir;
    if (next < 0 || next >= teams.length) return;
    setIndexDir([next, dir]);
  }

  function handleNext() {
    if (isLast) {
      send({ type: "hostAction", action: "nextReveal" });
    } else {
      paginate(1);
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  return (
    <div className="flex flex-col h-full bg-[#110f0d] text-cream overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-gold/60 uppercase tracking-widest">
          Final Results
        </span>
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/30 uppercase tracking-widest">
          {clampedIndex + 1} of {teams.length}
        </span>
      </div>

      {/* Comparison slide area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentTeam.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <RoundComparison team={currentTeam} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0 gap-4">
        <button
          onClick={() => paginate(-1)}
          disabled={clampedIndex === 0}
          className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/60 uppercase tracking-widest px-4 min-h-[44px] py-2 rounded border border-white/10 hover:border-white/30 hover:text-cream transition-colors disabled:opacity-20 disabled:cursor-not-allowed focus-ring"
        >
          Previous
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1">
          {teams.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndexDir([i, i > clampedIndex ? 1 : -1])}
              className="flex items-center justify-center w-8 h-8 focus-ring rounded-full"
              aria-label={`Go to team ${i + 1}`}
            >
              <span
                className={[
                  "rounded-full transition-all duration-300",
                  i === clampedIndex
                    ? "bg-gold w-4 h-2"
                    : "bg-white/20 hover:bg-white/40 w-2 h-2",
                ].join(" ")}
              />
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          className={[
            "font-[family-name:var(--font-pixel)] text-[9px] uppercase tracking-widest px-4 min-h-[44px] py-2 rounded border transition-colors focus-ring",
            isLast
              ? "border-gold/60 text-gold hover:bg-gold/10"
              : "border-white/10 text-cream/60 hover:border-white/30 hover:text-cream",
          ].join(" ")}
        >
          {isLast ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interstitial view — uses RoundTransition
// ---------------------------------------------------------------------------
function InterstitialView({
  state,
  send,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-charcoal text-cream">
      {/* RoundTransition is fixed-position overlay with Start Round 2 button */}
      <RoundTransition onComplete={() => send({ type: "hostAction", action: "startRound" })} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary view — uses FinalSummary
// ---------------------------------------------------------------------------
function SummaryView({
  state,
  send,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
}) {
  const teams = Object.values(state.teams);

  return (
    <div className="flex flex-col h-full bg-charcoal text-cream overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto relative">
        <FinalSummary teams={teams} players={state.players} />
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-t border-white/10 flex justify-center shrink-0">
        <HostControls phase={state.phase} send={send} hasDesigns={Object.values(state.players).some(p => p.designGrid != null)} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main HostView — switches on phase
// ---------------------------------------------------------------------------
export default function HostView({
  state,
  send,
  connected,
  activityFeed,
}: HostViewProps) {
  const { phase } = state;
  const showConfetti = phase === "finalReveal";

  return (
    <>
      {/* Confetti overlay for finalReveal */}
      <Confetti active={showConfetti} />

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="h-screen w-screen overflow-hidden"
        >
          {phase === "lobby" && (
            <LobbyView state={state} send={send} connected={connected} />
          )}
          {(phase === "demo" || phase === "design") && (
            <ActiveRoundView state={state} send={send} activityFeed={activityFeed} />
          )}
          {(phase === "round1" || phase === "round2") && (
            <ActiveRoundView state={state} send={send} activityFeed={activityFeed} />
          )}
          {phase === "reveal1" && (
            <RevealView state={state} send={send} />
          )}
          {phase === "finalReveal" && (
            <FinalRevealView state={state} send={send} />
          )}
          {phase === "interstitial" && (
            <InterstitialView state={state} send={send} />
          )}
          {phase === "summary" && (
            <SummaryView state={state} send={send} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
