"use client";

import { motion } from "framer-motion";
import type { Team, Player, GamePhase } from "@/lib/types";
import { calculateDetailedScore } from "@/lib/scoring";
import VoxelGrid from "./VoxelGrid";

interface TeamMosaicProps {
  teams: Record<string, Team>;
  players: Record<string, Player>;
  phase: GamePhase;
}

function TeamCard({
  team,
  players,
  index,
  phase,
}: {
  team: Team;
  players: Record<string, Player>;
  index: number;
  phase: GamePhase;
}) {
  const teamPlayers = team.players
    .map((id) => players[id])
    .filter(Boolean) as Player[];

  const architects = teamPlayers.filter((p) => p.role === "architect");
  const builders = teamPlayers.filter((p) => p.role === "builder");
  const connectedCount = teamPlayers.filter((p) => p.connected).length;

  const isRound2 = phase === "round2";
  const borderColor = isRound2 ? "border-sage/30" : "border-gold/30";
  const nameBg = isRound2 ? "bg-forest/40" : "bg-bark/40";
  const nameColor = isRound2 ? "text-sage" : "text-gold";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={[
        "flex flex-col rounded-lg border overflow-hidden",
        "bg-charcoal/70 backdrop-blur-sm",
        borderColor,
      ].join(" ")}
    >
      {/* Team name badge */}
      <div className={["flex items-center justify-between px-3 py-2", nameBg].join(" ")}>
        <span
          className={[
            "font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase leading-tight",
            nameColor,
          ].join(" ")}
        >
          {team.name}
        </span>
        <span className="flex items-center gap-1">
          {connectedCount > 0 && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-70" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage" />
            </span>
          )}
          <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/50">
            {connectedCount}/{teamPlayers.length}
          </span>
        </span>
      </div>

      {/* Mini isometric grid */}
      <div className="flex-1 p-1 min-h-0">
        <VoxelGrid
          grid={team.grid}
          readOnly
          className="w-full h-full"
        />
      </div>

      {/* Live score */}
      {team.roundTarget && (
        <div className="flex items-center justify-center px-3 py-1">
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-gold/60">
            {calculateDetailedScore(team.grid, team.roundTarget).percentage}%
          </span>
        </div>
      )}

      {/* Role indicators */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/5">
        {architects.map((p) => (
          <span
            key={p.id}
            className={[
              "text-[9px] px-1.5 py-0.5 rounded-sm font-[family-name:var(--font-pixel)]",
              p.connected
                ? "bg-gold/20 text-gold"
                : "bg-white/5 text-cream/30",
            ].join(" ")}
            title={p.name}
          >
            A
          </span>
        ))}
        {builders.map((p) => (
          <span
            key={p.id}
            className={[
              "text-[9px] px-1.5 py-0.5 rounded-sm font-[family-name:var(--font-pixel)]",
              p.connected
                ? "bg-rust/20 text-clay"
                : "bg-white/5 text-cream/30",
            ].join(" ")}
            title={p.name}
          >
            B
          </span>
        ))}
        {teamPlayers.length === 0 && (
          <span className="text-[9px] text-cream/20 font-[family-name:var(--font-pixel)]">
            waiting...
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function TeamMosaic({ teams, players, phase }: TeamMosaicProps) {
  const teamList = Object.values(teams);

  if (teamList.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-cream/30 font-[family-name:var(--font-pixel)] text-[10px]">
        No teams yet
      </div>
    );
  }

  return (
    <div
      className={[
        "grid gap-3 h-full",
        teamList.length <= 2
          ? "grid-cols-2"
          : teamList.length <= 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      ].join(" ")}
    >
      {teamList.map((team, i) => (
        <TeamCard
          key={team.id}
          team={team}
          players={players}
          index={i}
          phase={phase}
        />
      ))}
    </div>
  );
}
