import { useEffect, useRef } from "react";

/**
 * IntersectionObserver hook that adds 'is-revealed' class
 * to elements with 'reveal-up', 'reveal-left', 'reveal-right', or 'reveal-scale' classes.
 */
export default function useReveal(rootMargin = "-60px") {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll(
      ".reveal-up, .reveal-left, .reveal-right, .reveal-scale"
    );

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, [rootMargin]);

  return containerRef;
}
