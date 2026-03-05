'use client';

import { useEffect, useRef } from "react";

/**
 * IntersectionObserver hook that adds 'is-revealed' class
 * to elements with reveal-* or image-reveal classes.
 */
export default function useReveal(rootMargin: string = "-60px") {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll(
      ".reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade, .reveal-clip-up, .image-reveal"
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
