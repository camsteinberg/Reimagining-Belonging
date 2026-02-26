"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialOverlayProps {
  role: "architect" | "builder";
  isRound2: boolean;
  onDismiss: () => void;
  phase?: "round1" | "round2" | "design";
}

interface Slide {
  icon: string;
  heading: string;
  body: string;
}

function getSlides(
  role: "architect" | "builder",
  isRound2: boolean,
  phase?: string
): Slide[] {
  if (phase === "design") {
    return [
      {
        icon: "\u{1F3D7}",
        heading: "Design Phase",
        body: "Build your own creation! Your teammate will try to recreate it later.",
      },
      {
        icon: "\u{1F3A8}",
        heading: "Be Creative",
        body: "Use different block types. Think about how you'd describe this to someone who can't see it.",
      },
      {
        icon: "\u{1F680}",
        heading: "Go!",
        body: "You have 2 minutes. Build something great!",
      },
    ];
  }

  if (isRound2) {
    return [
      {
        icon: "\u{1F504}",
        heading: "Roles Swapped!",
        body: `You're now the ${role === "architect" ? "Architect" : "Builder"}. ${
          role === "architect"
            ? "Now YOU describe YOUR design! Scout the AI robot can help describe and build."
            : "Your teammate designed a building. Scout can help you build it!"
        }`,
      },
      {
        icon: "\u{1F916}",
        heading: "Meet Scout",
        body: "Scout is an AI robot that can help your team build. Talk to Scout in the chat!",
      },
      {
        icon: "\u{1F4AC}",
        heading: "Example Prompts",
        body: `Try: "Scout, describe my building" or "Scout, build the ground floor" or "Scout, place walls at B1 to B6"`,
      },
      {
        icon: "\u{1F680}",
        heading: "Go!",
        body: "Work together with Scout to recreate the design as accurately as possible!",
      },
    ];
  }

  // Round 1
  return [
    {
      icon: role === "architect" ? "\u{1F4AC}" : "\u2692",
      heading: `You're the ${role === "architect" ? "Architect" : "Builder"}!`,
      body:
        role === "architect"
          ? "You designed this building! Now describe it to your Builder using the chat."
          : "Your teammate designed a building. Listen to their chat messages and recreate it!",
    },
    {
      icon: "\u{1F9F1}",
      heading: "How to Build",
      body:
        role === "architect"
          ? "Use coordinates like B3 or D1 to describe block positions. Name the block type: wall, floor, roof, window, door."
          : "Tap a block type in the palette, then tap the grid to place it. Tap with Erase selected to remove blocks.",
    },
    {
      icon: "\u{1F4AC}",
      heading: "Communicate!",
      body:
        role === "architect"
          ? "Go layer by layer — describe the ground floor first, then move up. Be specific!"
          : "Ask your teammate where to start. Confirm block types before placing. Say when you're done with a section!",
    },
    {
      icon: "\u{1F680}",
      heading: "Go!",
      body: "Work together to recreate the design as accurately as possible. Good luck!",
    },
  ];
}

export default function TutorialOverlay({
  role,
  isRound2,
  onDismiss,
  phase,
}: TutorialOverlayProps) {
  const slides = getSlides(role, isRound2, phase);
  const [step, setStep] = useState(0);

  const isLast = step >= slides.length - 1;
  const current = slides[step];
  const accentColor = isRound2 ? "#6b8f71" : "#b89f65";

  function handleNext() {
    if (isLast) {
      onDismiss();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      style={{
        backgroundColor: isRound2
          ? "rgba(26, 21, 16, 0.9)"
          : "rgba(42, 37, 32, 0.85)",
      }}
    >
      {/* Skip button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-cream/50 hover:text-cream/80 transition-colors uppercase"
        type="button"
      >
        Skip
      </button>

      <div className="max-w-xs mx-6 text-center flex flex-col items-center gap-4">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 16 : 6,
                height: 6,
                backgroundColor: i === step ? accentColor : "rgba(245,241,234,0.2)",
              }}
            />
          ))}
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: isRound2
                  ? "rgba(107, 143, 113, 0.25)"
                  : "rgba(139, 94, 60, 0.2)",
              }}
            >
              {current.icon}
            </div>

            {/* Heading */}
            <span
              className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.25em] uppercase"
              style={{ color: accentColor }}
            >
              {current.heading}
            </span>

            {/* Body */}
            <p
              className="font-[family-name:var(--font-body)] text-base leading-relaxed"
              style={{ color: "#f5f1ea" }}
            >
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="mt-4 px-8 py-3 rounded-lg font-[family-name:var(--font-pixel)] text-[10px] tracking-wider uppercase transition-colors"
          style={{
            backgroundColor: accentColor,
            color: "#f5f1ea",
          }}
          type="button"
        >
          {isLast ? "Go!" : "Next"}
        </button>

        {/* Step counter */}
        <span
          className="font-[family-name:var(--font-pixel)] text-[7px] tracking-widest uppercase"
          style={{ color: "rgba(245, 241, 234, 0.3)" }}
        >
          {step + 1} of {slides.length}
        </span>
      </div>
    </div>
  );
}
