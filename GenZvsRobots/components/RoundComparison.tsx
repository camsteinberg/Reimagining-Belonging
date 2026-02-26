"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { Team } from "@/lib/types";
import VoxelGrid from "./VoxelGrid";
import ScoreGauge from "./ScoreGauge";

interface RoundComparisonProps {
  team: Team;
}

// Animated delta counter using motion value
function AnimatedDelta({
  from,
  to,
  delay,
}: {
  from: number;
  to: number;
  delay: number;
}) {
  const delta = to - from;
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, delta, {
      duration: 1.6,
      delay,
      ease: [0.34, 1.56, 0.64, 1],
    });

    const unsub = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = (v >= 0 ? "+" : "") + String(v);
      }
    });

    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delta, delay]);

  const isPositive = delta >= 0;
  const isBig = Math.abs(delta) >= 50;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
        className={[
          "relative flex items-center justify-center rounded-full px-5 py-3",
          isPositive
            ? "bg-moss/20 border border-moss/40"
            : "bg-ember/20 border border-ember/40",
          isBig && isPositive ? "shadow-[0_0_32px_rgba(54,95,69,0.6)]" : "",
        ].join(" ")}
      >
        {isBig && isPositive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span
          ref={ref}
          className={[
            "font-[family-name:var(--font-pixel)] text-2xl tabular-nums",
            isPositive ? "text-moss" : "text-ember",
            isBig && isPositive ? "text-gold" : "",
          ].join(" ")}
        >
          0
        </span>
        {isBig && isPositive && (
          <span className="ml-2 text-gold text-lg font-bold">!</span>
        )}
      </motion.div>
      <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/30 uppercase tracking-widest">
        improvement
      </span>
    </div>
  );
}

const panelVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.15,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  }),
};

export default function RoundComparison({ team }: RoundComparisonProps) {
  const targetGrid = team.roundTarget;
  if (!targetGrid) {
    return (
      <div className="flex items-center justify-center h-full bg-charcoal text-cream/40">
        No target available for this team.
      </div>
    );
  }
  const r1 = team.round1Score ?? 0;
  const r2 = team.round2Score ?? 0;
  const round1Grid = team.round1Grid ?? team.grid;
  const round2Grid = team.grid;

  return (
    <div className="flex flex-col h-full bg-charcoal text-cream overflow-hidden">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center pt-6 pb-4 shrink-0"
      >
        <span className="font-[family-name:var(--font-pixel)] text-[8px] text-gold/40 uppercase tracking-[0.3em] mb-2">
          Final Comparison
        </span>
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-gold text-center leading-tight">
          {team.name}
        </h2>
      </motion.div>

      {/* Three-panel grid */}
      <div className="flex-1 min-h-0 flex flex-col justify-center px-4 md:px-8 gap-4 overflow-y-auto">
        {/* Grids row */}
        <div className="flex flex-row gap-3 items-end justify-center">
          {/* Round 1 */}
          <motion.div
            custom={0}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[220px]"
          >
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-cream/40 uppercase tracking-widest">
              Round 1
            </span>
            <div className="w-full rounded-lg overflow-hidden border border-white/10 bg-white/5">
              <div className="aspect-square">
                <VoxelGrid
                  grid={round1Grid}
                  readOnly
                  showScoring
                  targetGrid={targetGrid}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Target — center, smaller & ghosted */}
          <motion.div
            custom={1}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-2 shrink-0"
            style={{ width: "25%", maxWidth: 160, opacity: 0.55 }}
          >
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-gold/50 uppercase tracking-widest">
              Target
            </span>
            <div className="w-full rounded-lg overflow-hidden border border-gold/20 bg-white/5 ring-1 ring-gold/10">
              <div className="aspect-square">
                <VoxelGrid
                  grid={targetGrid}
                  readOnly
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Round 2 */}
          <motion.div
            custom={2}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[220px]"
          >
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-sage/70 uppercase tracking-widest">
              Round 2
            </span>
            <div className="w-full rounded-lg overflow-hidden border border-sage/20 bg-white/5">
              <div className="aspect-square">
                <VoxelGrid
                  grid={round2Grid}
                  readOnly
                  showScoring
                  targetGrid={targetGrid}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scores row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-row items-center justify-center gap-6 md:gap-10 pb-4 shrink-0"
        >
          <ScoreGauge score={r1} label="Round 1" size={120} delay={0.6} />

          <AnimatedDelta from={r1} to={r2} delay={0.9} />

          <ScoreGauge score={r2} label="Round 2" size={120} delay={0.75} />
        </motion.div>
      </div>
    </div>
  );
}
