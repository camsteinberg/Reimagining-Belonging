import { useEffect, useRef, useCallback } from "react";

const DEFAULT_FADE_MS = 400;

export default function BackgroundCrossfade() {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const activeRef = useRef(null);
  const inactiveRef = useRef(null);
  const isSlide7FadeoutRef = useRef(false);

  useEffect(() => {
    activeRef.current = frontRef.current;
    inactiveRef.current = backRef.current;

    const slides = Array.from(document.querySelectorAll(".slide[data-bg]"));
    if (slides.length === 0) return;

    const applyFadeDuration = (ms) => {
      const resolved = Number.isFinite(ms) ? ms : DEFAULT_FADE_MS;
      [frontRef.current, backRef.current].forEach((layer) => {
        if (layer) layer.style.transitionDuration = `${resolved}ms`;
      });
    };

    const setBgInstant = (url) => {
      const active = activeRef.current;
      const inactive = inactiveRef.current;
      if (!url || !active) return;
      active.style.backgroundImage = `url("${url}")`;
      active.dataset.bgUrl = url;
      active.classList.add("is-visible");
      if (inactive && inactive !== active) {
        inactive.classList.remove("is-visible");
      }
    };

    const changeBg = (url, fadeMs) => {
      const active = activeRef.current;
      const inactive = inactiveRef.current;
      if (!url || !active) return;
      if (active.dataset.bgUrl === url) return;
      applyFadeDuration(fadeMs);
      if (!inactive || inactive === active) {
        setBgInstant(url);
        return;
      }
      inactive.style.backgroundImage = `url("${url}")`;
      inactive.dataset.bgUrl = url;
      inactive.classList.add("is-visible");
      active.classList.remove("is-visible");
      const previousActive = active;
      activeRef.current = inactive;
      inactiveRef.current = previousActive;
    };

    const pickMostVisibleSlide = () => {
      let bestSlide = slides[0];
      let bestRatio = -1;
      const vh = window.innerHeight;
      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, vh);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestSlide = slide;
        }
      });
      return bestSlide;
    };

    // Expose helpers globally for other components
    window.__bg = { changeBg, setBgInstant, pickMostVisibleSlide, isSlide7FadeoutRef };

    applyFadeDuration(DEFAULT_FADE_MS);
    setBgInstant(pickMostVisibleSlide().dataset.bg);

    const observer = new IntersectionObserver(
      (entries) => {
        if (isSlide7FadeoutRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const url = visible.target.dataset.bg;
        const fadeMs = parseInt(visible.target.dataset.fade, 10);
        changeBg(url, fadeMs);
      },
      { threshold: [0.5] }
    );

    slides.forEach((s) => observer.observe(s));

    const onLoad = () => setBgInstant(pickMostVisibleSlide().dataset.bg);
    window.addEventListener("load", onLoad);

    // Slide visibility observer
    const allSlides = Array.from(document.querySelectorAll(".slide"));
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: [0.3] }
    );
    allSlides.forEach((s) => fadeObserver.observe(s));

    return () => {
      observer.disconnect();
      fadeObserver.disconnect();
      window.removeEventListener("load", onLoad);
      delete window.__bg;
    };
  }, []);

  return (
    <>
      <div ref={frontRef} className="bg bg--front" aria-hidden="true" />
      <div ref={backRef} className="bg bg--back" aria-hidden="true" />
    </>
  );
}
