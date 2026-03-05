'use client';

import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import finalImage from "@/assets/images/finalImage2.webp";

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#6B8F71",
            animation: `scoutDotBounce 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface HeroLandingProps {
  show: boolean;
  onDismiss: () => void;
}

export default function HeroLanding({ show, onDismiss }: HeroLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const lineLeftRef = useRef<HTMLDivElement>(null);
  const lineRightRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scoutRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubblePhase, setBubblePhase] = useState<"hidden" | "dots" | "message">("hidden");
  const dismissingRef = useRef(false);
  const prevShowRef = useRef(show);

  const dismiss = useCallback(() => {
    if (dismissingRef.current || !show) return;
    dismissingRef.current = true;

    const el = containerRef.current;
    if (!el) {
      onDismiss();
      document.body.style.overflow = "";
      return;
    }

    gsap.to(el, {
      yPercent: -100,
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: () => {
        dismissingRef.current = false;
        onDismiss();
        window.scrollTo(0, 0);
        document.body.style.overflow = "";
      },
    });
  }, [show, onDismiss]);

  // Entrance animations — run once on mount, no context revert
  useEffect(() => {
    if (imgRef.current) {
      gsap.fromTo(imgRef.current, { scale: 1.1 }, { scale: 1, duration: 8, ease: "none" });
    }
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.3, ease: "power3.out" });
    }
    if (lineLeftRef.current && lineRightRef.current) {
      gsap.fromTo([lineLeftRef.current, lineRightRef.current], { scaleX: 0 }, { scaleX: 1, duration: 0.8, delay: 1, ease: "power2.out" });
    }
    if (taglineRef.current) {
      gsap.fromTo(taglineRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 1.2, ease: "power2.out" });
    }
    if (arrowRef.current) {
      gsap.fromTo(arrowRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1.6, ease: "power2.out" });
    }
    gsap.to(".hero-arrow-icon", { y: 10, duration: 1.2, ease: "power1.inOut", repeat: -1, yoyo: true, delay: 2 });
    if (scoutRef.current) {
      gsap.fromTo(scoutRef.current, { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.8, ease: "power2.out" });
      gsap.to(scoutRef.current, { y: -4, duration: 2, ease: "power1.inOut", repeat: -1, yoyo: true, delay: 2.5 });
    }
    if (ringRef.current) {
      gsap.to(ringRef.current, { rotation: 360, duration: 20, ease: "none", repeat: -1 });
    }
  }, []);

  // Re-show: snap to final state, then slide in
  useEffect(() => {
    if (show && !prevShowRef.current && containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
      if (imgRef.current) gsap.set(imgRef.current, { scale: 1 });
      if (titleRef.current) gsap.set(titleRef.current, { y: 0, opacity: 1 });
      if (lineLeftRef.current) gsap.set(lineLeftRef.current, { scaleX: 1 });
      if (lineRightRef.current) gsap.set(lineRightRef.current, { scaleX: 1 });
      if (taglineRef.current) gsap.set(taglineRef.current, { y: 0, opacity: 1 });
      if (arrowRef.current) gsap.set(arrowRef.current, { opacity: 1 });
      if (scoutRef.current) gsap.set(scoutRef.current, { opacity: 1 });

      gsap.fromTo(
        containerRef.current,
        { yPercent: -100 },
        { yPercent: 0, duration: 0.8, ease: "power3.inOut" }
      );
      dismissingRef.current = false;
    } else if (show && containerRef.current) {
      gsap.set(containerRef.current, { yPercent: 0, opacity: 1 });
      dismissingRef.current = false;
    }
    prevShowRef.current = show;
  }, [show]);

  // Lock body scroll while hero is showing
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  // Dismiss on first wheel, touch, or key event
  useEffect(() => {
    if (!show || dismissingRef.current) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) dismiss();
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY - e.touches[0].clientY > 30) dismiss();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        dismiss();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [show, dismiss]);

  // Speech bubble — each phase independently advances to the next
  useEffect(() => {
    if (!show) return;
    if (bubblePhase === "hidden") {
      const timer = setTimeout(() => setBubblePhase("dots"), 4000);
      return () => clearTimeout(timer);
    }
    if (bubblePhase === "dots") {
      const timer = setTimeout(() => setBubblePhase("message"), 1200);
      return () => clearTimeout(timer);
    }
  }, [show, bubblePhase]);

  // Animate bubble pop-in
  useEffect(() => {
    if (bubblePhase === "dots" && bubbleRef.current) {
      gsap.fromTo(
        bubbleRef.current,
        { scale: 0, opacity: 0, transformOrigin: "0% 100%" },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [bubblePhase]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 100, pointerEvents: show ? "auto" : "none" }}
    >
      {/* Background image with slow zoom */}
      <img
        ref={imgRef}
        src={finalImage.src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ transform: "scale(1.1)", filter: "brightness(0.5) saturate(1.4) sepia(0.25)" }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      {/* Subtle glow under Scout's feet */}
      <div
        className="absolute pointer-events-none scout-glow"
        style={{
          left: "16.25%",
          top: "31%",
          width: "8%",
          height: "6%",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
          zIndex: 1,
        }}
      />

      {/* Scout character */}
      <div
        ref={scoutRef}
        className="absolute z-10 pointer-events-auto opacity-0 scout-character cursor-pointer cursor-hover"
        style={{ left: "18.5%", top: "25.5%", width: "clamp(32px, 3.5vw, 55px)" }}
        role="link"
        tabIndex={0}
        aria-label="Open Scout AI guide"
        onClick={() => window.open("https://scout-ai-500acres.vercel.app/", "_blank", "noopener,noreferrer")}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.open("https://scout-ai-500acres.vercel.app/", "_blank", "noopener,noreferrer"); } }}
      >
        <svg viewBox="0 0 44 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
          <line x1="10" y1="22" x2="7" y2="58" stroke="#C4A87A" strokeWidth="2" strokeLinecap="round" />
          <polygon points="7,18 7,25 14,21.5" fill="#E07A5F" opacity="0.9" />
          <rect x="26" y="28" width="7" height="11" rx="2.5" fill="#9B7B4A" />
          <line x1="27" y1="31" x2="32" y2="31" stroke="#826539" strokeWidth="0.8" />
          <rect x="16" y="27" width="12" height="15" rx="4" fill="#6B8F71" />
          <rect x="18" y="35" width="4" height="2.5" rx="0.8" fill="#5A7D60" />
          <line x1="16" y1="30" x2="11" y2="24" stroke="#6B8F71" strokeWidth="3" strokeLinecap="round" />
          <line x1="28" y1="31" x2="32" y2="36" stroke="#6B8F71" strokeWidth="3" strokeLinecap="round" />
          <rect x="17" y="42" width="4.5" height="12" rx="2" fill="#4A4A4A" />
          <rect x="23" y="42" width="4.5" height="12" rx="2" fill="#4A4A4A" />
          <ellipse cx="19.5" cy="55" rx="3.5" ry="2.5" fill="#5C3D2E" />
          <ellipse cx="25.5" cy="55" rx="3.5" ry="2.5" fill="#5C3D2E" />
          <circle cx="22" cy="18" r="8" fill="#F5DEB3" />
          <ellipse cx="22" cy="12" rx="12" ry="3.5" fill="#C4A87A" />
          <path d="M14 12 Q14 4 22 3 Q30 4 30 12" fill="#9B7B4A" />
          <rect x="14" y="10" width="16" height="2.5" rx="1" fill="#826539" />
          <path d="M18 17 Q19.5 15 21 17" stroke="#333" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M23 17 Q24.5 15 26 17" stroke="#333" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M19 21 Q22 24.5 25 21" stroke="#333" strokeWidth="1" strokeLinecap="round" fill="none" />
          <circle cx="17.5" cy="20" r="1.8" fill="#E8A090" opacity="0.5" />
          <circle cx="26.5" cy="20" r="1.8" fill="#E8A090" opacity="0.5" />
        </svg>

        {/* Speech bubble */}
        {bubblePhase !== "hidden" && (
          <div
            ref={bubbleRef}
            className="scout-speech-bubble"
            style={{
              position: "absolute",
              background: "rgba(245, 241, 230, 0.95)",
              borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              pointerEvents: "auto",
              cursor: "pointer",
            }}
          >
            <div className="scout-bubble-tail" />
            {bubblePhase === "dots" ? (
              <TypingDots />
            ) : (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.5, color: "#333" }}>
                <strong style={{ color: "#6B8F71", fontSize: 12 }}>Hi, I&apos;m Scout!</strong>
                <br />
                I&apos;m your AI guide to 500 Acres. Click on me anytime to chat!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thin inset border frame */}
      <div className="absolute inset-6 md:inset-10 border border-cream/15 rounded-sm pointer-events-none z-10" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center px-8">
        <h1
          ref={titleRef}
          className="italic text-cream text-center leading-[1] opacity-0"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 400,
            fontSize: "clamp(4rem, 11vw, 10rem)",
            textShadow: "0 4px 30px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
            letterSpacing: "0.03em",
          }}
        >
          500 acres
        </h1>

        <div className="flex items-center gap-4 mt-6 mb-5">
          <div
            ref={lineLeftRef}
            className="w-16 md:w-24 h-[1px] bg-cream/40 origin-right"
            style={{ transform: "scaleX(0)" }}
          />
          <div className="w-1.5 h-1.5 rotate-45 bg-sage/80" />
          <div
            ref={lineRightRef}
            className="w-16 md:w-24 h-[1px] bg-cream/40 origin-left"
            style={{ transform: "scaleX(0)" }}
          />
        </div>

        <p
          ref={taglineRef}
          className="font-sans text-xs md:text-xs uppercase tracking-[0.5em] text-cream/60 opacity-0"
        >
          Reimagining Belonging
        </p>
      </div>

      {/* Explore arrow */}
      <div
        ref={arrowRef}
        className="absolute bottom-10 md:bottom-14 z-10 flex flex-col items-center gap-4 opacity-0"
      >
        <span className="font-sans text-xs uppercase tracking-[0.5em] text-cream/70">
          Explore
        </span>
        <button
          onClick={dismiss}
          className="relative w-14 h-14 flex items-center justify-center group cursor-pointer"
          aria-label="Scroll down to explore"
        >
          <svg
            ref={ringRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="rgba(229,220,207,0.3)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </svg>
          <div className="absolute inset-0 rounded-full border border-cream/0 group-hover:border-cream/40 transition-all duration-500 group-hover:scale-110" />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="hero-arrow-icon text-cream group-hover:text-sage transition-colors duration-300"
          >
            <path
              d="M12 4L12 20M12 20L6 14M12 20L18 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
