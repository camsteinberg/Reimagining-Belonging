import { useRef, useEffect, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import finalImage from "../../assets/images/finalImage2.png";

export default function HeroLanding({ show, onDismiss }) {
  const containerRef = useRef(null);
  const arrowRef = useRef(null);
  const ringRef = useRef(null);
  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const lineLeftRef = useRef(null);
  const lineRightRef = useRef(null);
  const imgRef = useRef(null);
  const dismissingRef = useRef(false);

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

  // Animate in when hero is re-shown (slide down from above)
  const prevShowRef = useRef(show);
  useEffect(() => {
    if (show && !prevShowRef.current && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { yPercent: -100 },
        { yPercent: 0, duration: 0.8, ease: "power3.inOut" }
      );
      dismissingRef.current = false;
    } else if (show && containerRef.current) {
      gsap.set(containerRef.current, { yPercent: 0 });
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

    const onWheel = (e) => {
      if (e.deltaY > 0) dismiss();
    };

    let touchStartY = 0;
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (touchStartY - e.touches[0].clientY > 30) dismiss();
    };

    const onKeyDown = (e) => {
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

  // Entrance animations
  useGSAP(
    () => {
      if (!show) return;

      // Slow Ken Burns zoom on background
      if (imgRef.current) {
        gsap.fromTo(imgRef.current, { scale: 1.1 }, { scale: 1, duration: 8, ease: "none" });
      }

      // Title fade + rise
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, delay: 0.3, ease: "power3.out" }
        );
      }

      // Decorative lines expand outward from center
      if (lineLeftRef.current && lineRightRef.current) {
        gsap.fromTo(
          [lineLeftRef.current, lineRightRef.current],
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, delay: 1, ease: "power2.out" }
        );
      }

      // Tagline fade in
      if (taglineRef.current) {
        gsap.fromTo(
          taglineRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 1.2, ease: "power2.out" }
        );
      }

      // Arrow + ring fade in
      if (arrowRef.current) {
        gsap.fromTo(
          arrowRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, delay: 1.6, ease: "power2.out" }
        );
      }

      // Bouncing arrow
      if (arrowRef.current) {
        gsap.to(".hero-arrow-icon", {
          y: 10,
          duration: 1.2,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
          delay: 2,
        });
      }

      // Spinning ring
      if (ringRef.current) {
        gsap.to(ringRef.current, {
          rotation: 360,
          duration: 20,
          ease: "none",
          repeat: -1,
        });
      }
    },
    { scope: containerRef, dependencies: [show] }
  );

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 100 }}
    >
      {/* Background image with slow zoom */}
      <img
        ref={imgRef}
        src={finalImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ transform: "scale(1.1)", filter: "brightness(0.4) saturate(1.4) sepia(0.25)" }}
      />

      {/* Vignette overlay — dark edges, clear center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      {/* Thin inset border frame */}
      <div className="absolute inset-6 md:inset-10 border border-cream/15 rounded-sm pointer-events-none z-10" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center px-8">
        {/* Title */}
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

        {/* Decorative lines flanking a diamond */}
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

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="font-sans text-[10px] md:text-xs uppercase tracking-[0.5em] text-cream/60 opacity-0"
        >
          Reimagining Belonging
        </p>
      </div>

      {/* Explore arrow — larger, with spinning dashed ring */}
      <div
        ref={arrowRef}
        className="absolute bottom-10 md:bottom-14 z-10 flex flex-col items-center gap-4 opacity-0"
      >
        <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-cream/70">
          Explore
        </span>
        <button
          onClick={dismiss}
          className="relative w-14 h-14 flex items-center justify-center group cursor-pointer"
          aria-label="Scroll down to explore"
        >
          {/* Spinning dashed ring */}
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
          {/* Static subtle ring on hover */}
          <div className="absolute inset-0 rounded-full border border-cream/0 group-hover:border-cream/40 transition-all duration-500 group-hover:scale-110" />
          {/* Arrow */}
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
