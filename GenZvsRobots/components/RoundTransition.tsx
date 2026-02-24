"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// RoundTransition — Full-screen cinematic interstitial between Round 1 and 2.
// Shows a dramatic title card with staggered text, floating particles, and a
// pulsing sage border glow. Auto-dismisses after ~5 s or on click/tap.
// ---------------------------------------------------------------------------

interface RoundTransitionProps {
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Floating particle dot
// ---------------------------------------------------------------------------

interface ParticleDef {
  id: number;
  x: number;          // % of viewport width
  size: number;       // px
  color: string;
  delay: number;      // s
  duration: number;   // s
  drift: number;      // px horizontal drift
}

const PARTICLE_COLORS = ["#b89f65", "#6b8f71", "#d4a84b", "#3d6b4f", "#e8e0d0"];

function generateParticles(count: number): ParticleDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 4 + Math.random() * 6,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 4,
    drift: (Math.random() - 0.5) * 80,
  }));
}

// ---------------------------------------------------------------------------
// Text lines
// ---------------------------------------------------------------------------

const LINES = [
  {
    text: "Same challenge.",
    font: "var(--font-pixel)",
    size: "clamp(1.4rem, 4vw, 2.25rem)",
    color: "#b89f65",
    weight: "400",
    letterSpacing: "0.08em",
  },
  {
    text: "New tools.",
    font: "var(--font-pixel)",
    size: "clamp(1.4rem, 4vw, 2.25rem)",
    color: "#6b8f71",
    weight: "400",
    letterSpacing: "0.08em",
  },
  {
    text: "ROUND 2 \u2014 WITH ROBOTS",
    font: "var(--font-pixel)",
    size: "clamp(2.2rem, 7vw, 4.5rem)",
    color: "#6b8f71",
    weight: "400",
    letterSpacing: "0.08em",
  },
  {
    text: "This round, every team gets Scout \u2014 an AI that can describe the target, give instructions, and place blocks for you.",
    font: "var(--font-serif)",
    size: "clamp(0.9rem, 2vw, 1.2rem)",
    color: "#e8e0d0",
    weight: "400",
    letterSpacing: "0.01em",
  },
  {
    text: "500 Acres is training Gen Z to build real homes using CNC-cut Skylark 250 blocks \u2014 on beautiful land near national parks.",
    font: "var(--font-serif)",
    size: "clamp(0.85rem, 1.8vw, 1.1rem)",
    color: "rgba(232, 224, 208, 0.6)",
    weight: "400",
    letterSpacing: "0.01em",
    italic: true,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoundTransition({ onComplete }: RoundTransitionProps) {
  const [visible, setVisible] = useState(true);
  const [viewHeight, setViewHeight] = useState(900);
  const particles = useRef<ParticleDef[]>(generateParticles(28));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSR-safe viewport height
  useEffect(() => {
    setViewHeight(window.innerHeight);
    const handleResize = () => setViewHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-dismiss after 5 s
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="round-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={handleDismiss}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleDismiss(); }}
          role="button"
          tabIndex={0}
          aria-label="Round 2 transition screen — tap to skip"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#2a2520",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* ── Pulsing sage border glow ─────────────────────────────── */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              borderRadius: 0,
            }}
            animate={{
              boxShadow: [
                "inset 0 0 60px rgba(107, 143, 113, 0.15)",
                "inset 0 0 120px rgba(107, 143, 113, 0.45)",
                "inset 0 0 60px rgba(107, 143, 113, 0.15)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* ── Floating particles ───────────────────────────────────── */}
          {particles.current.map((p) => (
            <motion.div
              key={p.id}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                borderRadius: p.id % 3 === 0 ? "50%" : p.id % 3 === 1 ? "2px" : "0",
                backgroundColor: p.color,
                rotate: p.id % 3 === 2 ? "45deg" : "0deg",
                pointerEvents: "none",
                opacity: 0,
              }}
              animate={{
                y: [0, -viewHeight - 40],
                x: [0, p.drift],
                opacity: [0, 0.7, 0.7, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
                times: [0, 0.1, 0.8, 1],
              }}
            />
          ))}

          {/* ── Decorative horizontal rule ───────────────────────────── */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.4 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "5%",
              right: "5%",
              height: "1px",
              backgroundColor: "#6b8f71",
              transformOrigin: "left center",
            }}
          />

          {/* ── Text block ───────────────────────────────────────────── */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(12px, 3vh, 28px)",
              textAlign: "center",
              padding: "0 clamp(1.5rem, 6vw, 4rem)",
              maxWidth: "900px",
            }}
          >
            {LINES.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4 + i * 0.3,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  fontFamily: line.font,
                  fontSize: line.size,
                  color: line.color,
                  fontWeight: line.weight,
                  letterSpacing: line.letterSpacing,
                  lineHeight: i < 3 ? 1.1 : 1.6,
                  margin: 0,
                  fontStyle: ("italic" in line && line.italic) ? "italic" : "normal",
                  textShadow:
                    i === 2
                      ? "0 0 40px rgba(107, 143, 113, 0.6), 0 0 80px rgba(107, 143, 113, 0.3)"
                      : i === 0
                      ? "0 0 30px rgba(184, 159, 101, 0.5)"
                      : "none",
                }}
              >
                {line.text}
              </motion.p>
            ))}

            {/* Tap to continue hint */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.5, 0] }}
              transition={{ delay: 3.2, duration: 1.5, ease: "easeInOut" }}
              style={{
                fontFamily: "var(--font-pixel)",
                fontSize: "0.55rem",
                color: "rgba(232, 224, 208, 0.45)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: "0.5rem",
              }}
            >
              tap to continue
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
