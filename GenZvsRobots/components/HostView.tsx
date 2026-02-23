"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoomState, ClientMessage, Player } from "@/lib/types";
import HostControls from "./HostControls";
import TeamMosaic from "./TeamMosaic";
import IsometricGrid from "./IsometricGrid";
import Timer from "./Timer";

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
  const players = Object.values(state.players);
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "join";

  return (
    <div className="flex flex-col h-full bg-charcoal text-cream overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <span className="font-[family-name:var(--font-display)] text-lg text-gold tracking-wide">
          Blueprint Telephone
        </span>
        <ConnectionDot connected={connected} />
      </div>

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

        {/* Player list */}
        <div className="w-full max-w-2xl mt-4">
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/40 uppercase tracking-widest mb-3 text-center">
            {players.length} player{players.length !== 1 ? "s" : ""} joined
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence>
              {players.map((p, i) => (
                <PlayerPip key={p.id} player={p} index={i} teams={state.teams} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 py-5 border-t border-white/10 flex items-center justify-center">
        <HostControls phase={state.phase} send={send} />
      </div>
    </div>
  );
}

function PlayerPip({
  player,
  index,
  teams,
}: {
  player: Player;
  index: number;
  teams: RoomState["teams"];
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
      <div className="min-w-0">
        <div className="text-xs font-semibold text-cream truncate leading-tight">
          {player.name}
        </div>
        <div className="font-[family-name:var(--font-pixel)] text-[7px] text-gold/60 leading-tight truncate">
          {teamName}
        </div>
      </div>
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
          {PHASE_LABELS[state.phase]}
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
        <HostControls phase={state.phase} send={send} />
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
// Reveal view (reveal1 / finalReveal)
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
      {/* Cinematic header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-gold/60 uppercase tracking-widest">
            {state.phase === "finalReveal" ? "Final Results" : "Round 1 Results"}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-gold mt-0.5">
            How did each team do?
          </h1>
        </div>
        <HostControls phase={state.phase} send={send} />
      </div>

      {/* Team grids */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {teams.map((team, i) => {
            const displayGrid =
              state.phase === "finalReveal" ? team.grid : team.round1Grid ?? team.grid;
            const score =
              state.phase === "finalReveal" ? team.round2Score : team.round1Score;

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
                className="flex flex-col rounded-xl border border-white/10 overflow-hidden bg-white/5"
              >
                {/* Team header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bark/20">
                  <span className="font-[family-name:var(--font-pixel)] text-[10px] text-gold uppercase tracking-wider">
                    {team.name}
                  </span>
                  {score != null && (
                    <span className="font-[family-name:var(--font-pixel)] text-[12px] text-amber">
                      {score}%
                    </span>
                  )}
                </div>

                {/* Grids side-by-side */}
                <div className="grid grid-cols-2 gap-2 p-3">
                  <div>
                    <p className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/40 uppercase tracking-widest mb-1 text-center">
                      Target
                    </p>
                    {state.currentTarget ? (
                      <IsometricGrid
                        grid={state.currentTarget}
                        readOnly
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-cream/20 text-xs">
                        No target
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/40 uppercase tracking-widest mb-1 text-center">
                      Built
                    </p>
                    <IsometricGrid
                      grid={displayGrid}
                      readOnly
                      showScoring={state.currentTarget != null}
                      targetGrid={state.currentTarget ?? undefined}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interstitial view
// ---------------------------------------------------------------------------
function InterstitialView({
  state,
  send,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-charcoal text-cream items-center justify-center gap-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="text-center"
      >
        <p className="font-[family-name:var(--font-pixel)] text-[10px] text-gold/50 uppercase tracking-widest mb-4">
          Next up
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-5xl text-gold leading-tight">
          Round 2
        </h2>
        <p className="mt-3 font-[family-name:var(--font-pixel)] text-[11px] text-sage uppercase tracking-widest">
          With Robots
        </p>
        <p className="mt-6 font-[family-name:var(--font-serif)] text-lg text-cream/60 max-w-md">
          This time, your AI scout will help rebuild. Can human and machine do better together?
        </p>
      </motion.div>
      <HostControls phase={state.phase} send={send} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary view
// ---------------------------------------------------------------------------
function SummaryView({
  state,
  send,
}: {
  state: RoomState;
  send: (msg: ClientMessage) => void;
}) {
  const teams = Object.values(state.teams).sort((a, b) => {
    const bTotal = (b.round1Score ?? 0) + (b.round2Score ?? 0);
    const aTotal = (a.round1Score ?? 0) + (a.round2Score ?? 0);
    return bTotal - aTotal;
  });

  return (
    <div className="flex flex-col h-full bg-charcoal text-cream overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 border-b border-white/10">
        <p className="font-[family-name:var(--font-pixel)] text-[9px] text-gold/50 uppercase tracking-widest mb-2">
          Blueprint Telephone
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-gold">
          Final Scores
        </h1>
        <p className="font-[family-name:var(--font-serif)] text-base text-cream/50 mt-2 italic">
          presented by 500 Acres
        </p>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {teams.map((team, i) => {
            const r1 = team.round1Score ?? 0;
            const r2 = team.round2Score ?? 0;
            const improvement = r2 - r1;
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-5 py-4"
              >
                <span className="font-[family-name:var(--font-pixel)] text-2xl text-gold/40 w-6 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-pixel)] text-[10px] text-gold uppercase tracking-wider">
                    {team.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-[family-name:var(--font-body)] text-xs text-cream/50">
                      R1: {r1}%
                    </span>
                    <span className="text-cream/20 text-xs">→</span>
                    <span className="font-[family-name:var(--font-body)] text-xs text-cream/50">
                      R2: {r2}%
                    </span>
                    {improvement > 0 && (
                      <span className="text-xs text-sage font-semibold">
                        +{improvement}%
                      </span>
                    )}
                    {improvement < 0 && (
                      <span className="text-xs text-ember font-semibold">
                        {improvement}%
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-[family-name:var(--font-pixel)] text-lg text-amber shrink-0">
                  {r1 + r2}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Closing statement */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: teams.length * 0.08 + 0.3 }}
          className="font-[family-name:var(--font-serif)] text-center text-cream/40 italic text-base mt-10 max-w-lg mx-auto leading-relaxed"
        >
          Thank you for playing Blueprint Telephone — a project by 500 Acres exploring how
          communities reimagine belonging through play and collective design.
        </motion.p>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-t border-white/10 flex justify-center">
        <HostControls phase={state.phase} send={send} />
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

  return (
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
        {(phase === "round1" || phase === "round2") && (
          <ActiveRoundView state={state} send={send} activityFeed={activityFeed} />
        )}
        {(phase === "reveal1" || phase === "finalReveal") && (
          <RevealView state={state} send={send} />
        )}
        {phase === "interstitial" && (
          <InterstitialView state={state} send={send} />
        )}
        {phase === "summary" && (
          <SummaryView state={state} send={send} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
