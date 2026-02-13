import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";

export default function PageTransition({ children }) {
  const location = useLocation();
  const contentRef = useRef(null);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const isHomepage = location.pathname === "/";
    const didChange = prevPath.current !== location.pathname;

    if (isHomepage) {
      // Homepage uses position:fixed elements — ANY transform on the
      // wrapper (even translateY(0)) creates a containing block that
      // breaks them. Clear all GSAP inline styles completely.
      gsap.set(el, { clearProps: "all" });

      if (didChange) {
        // Simple opacity fade with no transform
        el.style.opacity = "0";
        gsap.to(el, { opacity: 1, duration: 0.5, delay: 0.1, ease: "power2.out" });
      }
    } else if (didChange) {
      // Inner pages: fade + slide up
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: "power2.out" }
      );
    }

    prevPath.current = location.pathname;
  }, [location.pathname]);

  return (
    <div ref={contentRef}>
      {children}
    </div>
  );
}
