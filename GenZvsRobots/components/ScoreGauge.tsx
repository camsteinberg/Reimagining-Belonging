"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface ScoreGaugeProps {
  score: number; // 0–100
  label?: string;
  size?: number; // px, default 160
  delay?: number; // animation delay in seconds
}

function getArcColor(score: number): string {
  if (score >= 70) return "#365f45"; // moss
  if (score >= 40) return "#b89f65"; // gold
  return "#c45d3e"; // ember
}

function getTextColor(score: number): string {
  if (score >= 70) return "#6b8f71"; // sage (lighter than moss for readability)
  if (score >= 40) return "#b89f65"; // gold
  return "#c45d3e"; // ember
}

/**
 * Describes an SVG arc path for a stroke-based circle gauge.
 * Returns a path "d" string for an arc from -90° (top) clockwise
 * by `fraction` of a full circle.
 */
function arcPath(cx: number, cy: number, r: number, fraction: number): string {
  const clampedFraction = Math.min(Math.max(fraction, 0), 0.9999);
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + clampedFraction * 2 * Math.PI;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);

  const largeArc = clampedFraction > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// Animated arc path — drives strokeDashoffset via a motion value
function AnimatedArc({
  cx,
  cy,
  r,
  score,
  strokeColor,
  strokeWidth,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  score: number;
  strokeColor: string;
  strokeWidth: number;
  delay: number;
}) {
  const circumference = 2 * Math.PI * r;
  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    (v) => circumference - (v / 100) * circumference
  );

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 1.4,
      delay,
      ease: [0.34, 1.56, 0.64, 1], // spring-like overshoot
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, delay]);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={circumference}
      strokeDashoffset={dashOffset}
      strokeLinecap="round"
      style={{
        rotate: "-90deg",
        transformOrigin: `${cx}px ${cy}px`,
      }}
    />
  );
}

// Animated number counter
function AnimatedNumber({
  value,
  delay,
  color,
  fontSize,
}: {
  value: number;
  delay: number;
  color: string;
  fontSize: number;
}) {
  const displayed = useMotionValue(0);
  const rounded = useTransform(displayed, (v) => Math.round(v));
  const displayRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const controls = animate(displayed, value, {
      duration: 1.4,
      delay,
      ease: [0.34, 1.56, 0.64, 1],
    });

    const unsub = rounded.on("change", (v) => {
      if (displayRef.current) {
        displayRef.current.textContent = String(v);
      }
    });

    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return (
    <text
      ref={displayRef}
      fill={color}
      fontSize={fontSize}
      fontFamily="var(--font-pixel), monospace"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      0
    </text>
  );
}

export default function ScoreGauge({
  score,
  label,
  size = 160,
  delay = 0,
}: ScoreGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.075;
  const r = (size - strokeWidth * 2) / 2 - 4;
  const arcColor = getArcColor(score);
  const textColor = getTextColor(score);
  const trackColor = "rgba(255,255,255,0.07)";
  const fontSize = size * 0.2;
  const percentFontSize = size * 0.09;
  const labelFontSize = size * 0.07;

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{ width: size }}
      aria-label={`Score: ${score}%${label ? ` — ${label}` : ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Animated fill arc */}
        <AnimatedArc
          cx={cx}
          cy={cy}
          r={r}
          score={score}
          strokeColor={arcColor}
          strokeWidth={strokeWidth}
          delay={delay}
        />

        {/* Score number */}
        <AnimatedNumber
          value={score}
          delay={delay}
          color={textColor}
          fontSize={fontSize}
        />

        {/* Percent sign */}
        <text
          x={cx + fontSize * 0.55}
          y={cy + fontSize * 0.25}
          fill={textColor}
          fontSize={percentFontSize}
          fontFamily="var(--font-pixel), monospace"
          textAnchor="start"
          dominantBaseline="middle"
          opacity={0.7}
        >
          %
        </text>
      </svg>

      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.3 }}
          style={{
            fontFamily: "var(--font-pixel), monospace",
            fontSize: labelFontSize,
            color: "#b89f65",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            textAlign: "center",
          }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
