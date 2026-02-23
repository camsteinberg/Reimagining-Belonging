"use client";

import { motion } from "framer-motion";
import type { Team } from "@/lib/types";

interface FinalSummaryProps {
  teams: Team[];
}

interface RankedTeam {
  team: Team;
  r1: number;
  r2: number;
  delta: number;
  rank: number;
}

function rankTeams(teams: Team[]): RankedTeam[] {
  return [...teams]
    .map((team) => ({
      team,
      r1: team.round1Score ?? 0,
      r2: team.round2Score ?? 0,
      delta: (team.round2Score ?? 0) - (team.round1Score ?? 0),
      rank: 0,
    }))
    .sort((a, b) => b.delta - a.delta)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="font-[family-name:var(--font-pixel)] text-[10px] text-moss">
        +{delta}%
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="font-[family-name:var(--font-pixel)] text-[10px] text-ember">
        {delta}%
      </span>
    );
  }
  return (
    <span className="font-[family-name:var(--font-pixel)] text-[10px] text-cream/30">
      ±0%
    </span>
  );
}

const rowVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.3 + i * 0.1,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  }),
};

export default function FinalSummary({ teams }: FinalSummaryProps) {
  const ranked = rankTeams(teams);
  const avgR1 = avg(ranked.map((e) => e.r1));
  const avgR2 = avg(ranked.map((e) => e.r2));
  const topTeam = ranked[0];

  return (
    <div className="flex flex-col min-h-full bg-charcoal text-cream overflow-y-auto">
      {/* Ambient top glow */}
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(184,159,101,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center pt-10 pb-6 px-6 shrink-0"
      >
        <span className="font-[family-name:var(--font-pixel)] text-[8px] text-gold/40 uppercase tracking-[0.4em] mb-3">
          Blueprint Telephone
        </span>
        <h1 className="font-[family-name:var(--font-pixel)] text-3xl md:text-4xl text-gold tracking-widest text-center leading-tight">
          RESULTS
        </h1>
        <div className="mt-3 w-20 h-px bg-gold/30" />
      </motion.div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center gap-8 px-4 md:px-8 pb-12">
        {/* Most-improved crown callout */}
        {topTeam && topTeam.delta > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full max-w-xl rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(184,159,101,0.18)]"
          >
            <span className="text-3xl shrink-0" role="img" aria-label="Crown">
              &#x1F451;
            </span>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-pixel)] text-[8px] text-gold/60 uppercase tracking-widest mb-1">
                Most Improved
              </p>
              <p className="font-[family-name:var(--font-display)] text-xl text-gold truncate">
                {topTeam.team.name}
              </p>
              <p className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/50 mt-1">
                {topTeam.r1}% &rarr; {topTeam.r2}%{" "}
                <span className="text-gold">(+{topTeam.delta})</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Improvement leaderboard */}
        <div className="w-full max-w-xl flex flex-col gap-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/30 uppercase tracking-widest mb-1 text-center"
          >
            Most Improved
          </motion.p>

          {ranked.map((entry, i) => {
            const isTop = i === 0 && entry.delta > 0;
            return (
              <motion.div
                key={entry.team.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className={[
                  "flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
                  isTop
                    ? "border-gold/40 bg-gold/8"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                {/* Rank */}
                <span
                  className={[
                    "font-[family-name:var(--font-pixel)] text-xl w-7 shrink-0 text-center",
                    isTop ? "text-gold" : "text-cream/20",
                  ].join(" ")}
                >
                  {entry.rank}
                </span>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={[
                      "font-[family-name:var(--font-pixel)] text-[10px] uppercase tracking-wider truncate",
                      isTop ? "text-gold" : "text-cream/80",
                    ].join(" ")}
                  >
                    {entry.team.name}
                  </p>
                </div>

                {/* Score path */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/40">
                    {entry.r1}%
                  </span>
                  <span className="text-cream/20 text-xs">&rarr;</span>
                  <span className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/60">
                    {entry.r2}%
                  </span>
                  <div className="ml-1">
                    <DeltaBadge delta={entry.delta} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Aggregate stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 + ranked.length * 0.1 }}
          className="w-full max-w-xl rounded-xl border border-white/10 bg-white/5 px-6 py-5 flex flex-col gap-4"
        >
          <p className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/30 uppercase tracking-widest text-center">
            By the numbers
          </p>
          <div className="flex flex-row justify-around gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="font-[family-name:var(--font-pixel)] text-2xl text-cream/60">
                {avgR1}%
              </span>
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/30 uppercase tracking-widest text-center">
                Avg Round 1
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-cream/20 text-2xl">&rarr;</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-[family-name:var(--font-pixel)] text-2xl text-amber">
                {avgR2}%
              </span>
              <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/30 uppercase tracking-widest text-center">
                Avg Round 2
              </span>
            </div>
          </div>
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-gold/60 text-center mt-1 uppercase tracking-widest">
            That&apos;s what robots do.
          </p>
        </motion.div>

        {/* 500 Acres closing statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 + ranked.length * 0.1 }}
          className="w-full max-w-2xl flex flex-col items-center gap-4 px-2"
        >
          <div className="w-full h-px bg-white/8" />
          <p className="font-[family-name:var(--font-serif)] text-base md:text-lg text-cream/55 text-center leading-relaxed italic">
            500 Acres is building AI-powered pipelines so Gen Z can construct
            real homes using CNC-cut Skylark 250 blocks &mdash; on beautiful
            land near national parks, together. You just experienced what that
            future feels like.
          </p>
          <a
            href="https://500acres.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-pixel)] text-[9px] text-gold/50 hover:text-gold transition-colors uppercase tracking-widest mt-1 inline-flex items-center min-h-[44px] px-3 focus-ring rounded"
          >
            500acres.org
          </a>
        </motion.div>
      </div>
    </div>
  );
}
