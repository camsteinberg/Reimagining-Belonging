"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  endTime: number | null;
  className?: string;
}

export default function Timer({ endTime, className = "" }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setRemaining(diff);
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isLow = remaining < 30000 && remaining > 0;

  return (
    <div
      className={`font-[family-name:var(--font-pixel)] text-center ${
        isLow ? "text-ember animate-pulse" : "text-charcoal"
      } ${className}`}
    >
      <span className="text-3xl tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
