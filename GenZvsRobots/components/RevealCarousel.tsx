"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Team, Grid } from "@/lib/types";
import IsometricGrid from "./IsometricGrid";
import ScoreGauge from "./ScoreGauge";

interface RevealCarouselProps {
  teams: Team[];
  targetGrid: Grid;
  round: 1 | 2;
  onComplete?: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export default function RevealCarousel({
  teams,
  targetGrid,
  round,
  onComplete,
}: RevealCarouselProps) {
  const [[index, direction], setIndexDir] = useState([0, 0]);

  const validTeams = teams.filter((t) => t != null);
  if (validTeams.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-cream/40">
        No teams to show.
      </div>
    );
  }

  const clampedIndex = Math.min(index, validTeams.length - 1);
  const team = validTeams[clampedIndex];

  const score = round === 1 ? (team.round1Score ?? 0) : (team.round2Score ?? 0);
  const displayGrid =
    round === 1 ? (team.round1Grid ?? team.grid) : team.grid;

  function paginate(newDirection: number) {
    const next = clampedIndex + newDirection;
    if (next < 0 || next >= validTeams.length) return;
    setIndexDir([next, newDirection]);
  }

  function handleNext() {
    if (clampedIndex >= validTeams.length - 1) {
      onComplete?.();
    } else {
      paginate(1);
    }
  }

  const isLast = clampedIndex >= validTeams.length - 1;

  return (
    <div className="flex flex-col h-full bg-charcoal text-cream overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-gold/60 uppercase tracking-widest">
          {round === 1 ? "Round 1 Results" : "Round 2 Results"}
        </span>
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/30 uppercase tracking-widest">
          {clampedIndex + 1} of {validTeams.length}
        </span>
      </div>

      {/* Slide area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${team.id}-${round}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 flex flex-col items-center justify-start pt-4 px-6 gap-4 overflow-y-auto"
          >
            {/* Team name */}
            <motion.h2
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-gold text-center leading-tight shrink-0"
            >
              {team.name}
            </motion.h2>

            {/* Grids side-by-side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-row gap-6 items-start justify-center w-full max-w-3xl shrink-0"
            >
              {/* Target */}
              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <span className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest">
                  Target
                </span>
                <div className="w-full aspect-square max-w-[280px]">
                  <IsometricGrid
                    grid={targetGrid}
                    readOnly
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="flex flex-col items-center justify-center self-stretch gap-2 shrink-0">
                <div className="w-px flex-1 bg-white/10" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/20">
                  vs
                </span>
                <div className="w-px flex-1 bg-white/10" />
              </div>

              {/* Build */}
              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <span className="font-[family-name:var(--font-pixel)] text-[8px] text-cream/40 uppercase tracking-widest">
                  Build
                </span>
                <div className="w-full aspect-square max-w-[280px]">
                  <IsometricGrid
                    grid={displayGrid}
                    readOnly
                    showScoring
                    targetGrid={targetGrid}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </motion.div>

            {/* Score gauge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="shrink-0"
            >
              <ScoreGauge
                score={score}
                label={round === 1 ? "Round 1" : "Round 2"}
                size={140}
                delay={0.5}
              />
            </motion.div>
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
          {validTeams.map((_, i) => (
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
