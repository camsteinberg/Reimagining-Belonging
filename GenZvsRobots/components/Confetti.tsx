"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Confetti — warm-themed pixel-art particle celebration effect.
// Canvas-based: particles burst from the top of the screen, float down with
// a gentle sine-wave wobble and rotation. Duration ~3-4 s then fades out.
// Overlay: position:fixed, pointer-events:none.
// Triggered by `active` prop.
// ---------------------------------------------------------------------------

interface ConfettiProps {
  active: boolean;
}

// Warm brand palette
const COLORS = ["#b89f65", "#8b5e3c", "#6b8f71", "#d4a84b", "#e8e0d0"];

type Shape = "square" | "diamond" | "circle";
const SHAPES: Shape[] = ["square", "diamond", "circle"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: Shape;
  rotation: number;
  rotationSpeed: number;
  wobbleFreq: number;
  wobbleAmp: number;
  wobbleOffset: number;
  opacity: number;
  born: number; // timestamp ms
  lifetime: number; // ms
}

function createParticle(canvasWidth: number, now: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: -10,
    vx: (Math.random() - 0.5) * 2.5,
    vy: 2 + Math.random() * 3.5,
    size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    wobbleFreq: 0.04 + Math.random() * 0.06,
    wobbleAmp: 15 + Math.random() * 25,
    wobbleOffset: Math.random() * Math.PI * 2,
    opacity: 1,
    born: now,
    lifetime: 2800 + Math.random() * 1200,
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.color;

  const s = p.size;
  if (p.shape === "square") {
    ctx.fillRect(-s / 2, -s / 2, s, s);
  } else if (p.shape === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.lineTo(s / 2, 0);
    ctx.lineTo(0, s / 2);
    ctx.lineTo(-s / 2, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // circle
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[];
    rafId: number;
    spawnUntil: number;
    startedAt: number;
    running: boolean;
  }>({
    particles: [],
    rafId: 0,
    spawnUntil: 0,
    startedAt: 0,
    running: false,
  });

  useEffect(() => {
    if (!active) {
      // If deactivated mid-run, let existing particles fade naturally but stop spawning
      stateRef.current.spawnUntil = 0;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to viewport
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const state = stateRef.current;
    const now = performance.now();
    state.particles = [];
    state.startedAt = now;
    state.spawnUntil = now + 1800; // spawn for first 1.8 s
    state.running = true;

    // Pre-spawn an initial burst so confetti appears immediately
    for (let i = 0; i < 80; i++) {
      const p = createParticle(canvas.width, now);
      p.y = -10 - Math.random() * 60;
      p.born = now - Math.random() * 300; // stagger birth times slightly
      state.particles.push(p);
    }

    function tick(ts: number) {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles during spawn window
      if (ts < state.spawnUntil) {
        const batchSize = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < batchSize; i++) {
          state.particles.push(createParticle(canvas.width, ts));
        }
      }

      // Update + draw
      const surviving: Particle[] = [];
      for (const p of state.particles) {
        const age = ts - p.born;
        const lifeRatio = age / p.lifetime;

        if (lifeRatio >= 1) continue; // expired

        // Position update
        p.x += p.vx + Math.sin(age * p.wobbleFreq + p.wobbleOffset) * p.wobbleAmp * 0.016;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vy += 0.04; // slight gravity

        // Fade out in last 30% of lifetime
        p.opacity = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;

        drawParticle(ctx, p);
        surviving.push(p);
      }
      state.particles = surviving;

      // Continue loop while particles remain or spawn window still open
      if (surviving.length > 0 || ts < state.spawnUntil) {
        state.rafId = requestAnimationFrame(tick);
      } else {
        state.running = false;
      }
    }

    state.rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(state.rafId);
      state.running = false;
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
