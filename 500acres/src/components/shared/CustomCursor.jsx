import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], .cursor-hover";
const DARK_BG_SELECTOR = ".bg-charcoal, .bg-night, .bg-bark, .bg-moss, .bg-pine, .loading-screen";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const visible = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Skip on touch devices or when user prefers reduced motion
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Signal CSS that custom cursor is active — only then does
    // the native cursor get hidden (no !important, user can override)
    document.documentElement.classList.add("custom-cursor-ready");

    const halfW = cursor.offsetWidth / 2;
    const halfH = cursor.offsetHeight / 2;

    let raf;
    const render = () => {
      cursor.style.transform = `translate(${pos.current.x - halfW}px, ${pos.current.y - halfH}px)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      if (!visible.current) {
        cursor.classList.add("is-active");
        visible.current = true;
      }
    };

    const onLeave = () => {
      cursor.classList.remove("is-active");
      visible.current = false;
    };

    // Use event delegation instead of per-element listeners.
    // This avoids the MutationObserver + re-attach pattern that
    // leaked listeners on every DOM mutation.
    const onMouseOver = (e) => {
      const target = e.target;
      if (target.closest(INTERACTIVE_SELECTOR)) {
        cursor.classList.add("is-hovering");
      }
      if (target.closest(DARK_BG_SELECTOR)) {
        cursor.classList.add("on-dark");
      }
    };

    const onMouseOut = (e) => {
      const target = e.target;
      if (target.closest(INTERACTIVE_SELECTOR)) {
        // Only remove if we're not entering another interactive element
        if (!e.relatedTarget || !e.relatedTarget.closest(INTERACTIVE_SELECTOR)) {
          cursor.classList.remove("is-hovering");
        }
      }
      if (target.closest(DARK_BG_SELECTOR)) {
        if (!e.relatedTarget || !e.relatedTarget.closest(DARK_BG_SELECTOR)) {
          cursor.classList.remove("on-dark");
        }
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.documentElement.classList.remove("custom-cursor-ready");
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
}
