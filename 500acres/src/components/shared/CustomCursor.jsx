import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const visible = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Check for touch device
    if (window.matchMedia("(hover: none)").matches) return;

    let raf;
    const render = () => {
      cursor.style.transform = `translate(${pos.current.x - cursor.offsetWidth / 2}px, ${pos.current.y - cursor.offsetHeight / 2}px)`;
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

    const onEnterInteractive = () => cursor.classList.add("is-hovering");
    const onLeaveInteractive = () => cursor.classList.remove("is-hovering");

    const onEnterDark = () => cursor.classList.add("on-dark");
    const onLeaveDark = () => cursor.classList.remove("on-dark");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    // Observe DOM for interactive elements
    const attach = () => {
      document.querySelectorAll("a, button, [role='button'], .cursor-hover").forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
      document.querySelectorAll(".bg-charcoal, .bg-night, .bg-bark, .bg-moss, .bg-pine, .loading-screen").forEach((el) => {
        el.addEventListener("mouseenter", onEnterDark);
        el.addEventListener("mouseleave", onLeaveDark);
      });
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      observer.disconnect();
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
}
