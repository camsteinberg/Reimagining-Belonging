import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import phoneImg1 from "../../assets/images/section01-scroll-1.png";
import phoneImg2 from "../../assets/images/section01-scroll-2.png";

gsap.registerPlugin(ScrollTrigger);

const phoneBgUrls = [phoneImg1, phoneImg2];

export default function PhoneOverlay() {
  const overlayRef = useRef(null);
  const phoneRef = useRef(null);
  const gradientRef = useRef(null);
  const lastPhoneBgRef = useRef("");
  const phoneFadeTimeoutRef = useRef(null);

  useEffect(() => {
    const phoneOverlay = overlayRef.current;
    const phone = phoneRef.current;
    if (!phoneOverlay) return;

    const overlaySlides = Array.from(
      document.querySelectorAll(
        ".slide2, .slide3, .slide4, .slide5, .slide6, .slide8, .slide9, .slide10, .slide11"
      )
    );
    const darkCircleSlides = Array.from(
      document.querySelectorAll(".slide8, .slide9, .slide10, .slide11")
    );
    const phoneSlides = Array.from(
      document.querySelectorAll(".slide2, .slide3, .slide4, .slide5, .slide6")
    );
    const slide12 = document.querySelector(".mapSlides");
    const slide1 = document.querySelector(".slide1");

    if (overlaySlides.length === 0) return;

    const overlayRatios = new Map(overlaySlides.map((slide) => [slide, 0]));
    const darkSet = new Set(darkCircleSlides);
    const thresholds = [0, 0.2, 0.4, 0.6, 0.8, 1];
    let slide12Ratio = 0;
    let isSlide1Visible = false;

    // Slide 1 observer
    if (slide1) {
      const s1Observer = new IntersectionObserver(
        ([entry]) => { isSlide1Visible = entry.isIntersecting; },
        { threshold: [0.3] }
      );
      s1Observer.observe(slide1);
    }

    let activeOverlaySlide = null;
    let slide11TextVisible = false;

    const syncSlide11Circle = () => {
      const slide11 = document.querySelector(".slide11");
      const shouldFade = activeOverlaySlide === slide11 && !slide11TextVisible;
      phoneOverlay.classList.toggle("slide11-circle-fade", shouldFade);
    };

    const overlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (slide12 && entry.target === slide12) {
            slide12Ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
            return;
          }
          overlayRatios.set(
            entry.target,
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
        });

        let activeSlide = null;
        let maxRatio = 0;
        overlayRatios.forEach((ratio, slide) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            activeSlide = slide;
          }
        });

        const isOverlayVisible = maxRatio > 0 && !isSlide1Visible && slide12Ratio === 0;
        const isDark = isOverlayVisible && activeSlide && darkSet.has(activeSlide);
        activeOverlaySlide = activeSlide;
        syncSlide11Circle();

        phoneOverlay.classList.toggle("is-visible", isOverlayVisible);
        document.body.classList.toggle("phone-circle-visible", isOverlayVisible);
        phoneOverlay.classList.toggle("is-dark-circle", isDark);

        if (phone) {
          phone.classList.toggle("hidden", isDark || !isOverlayVisible);
          if (activeSlide) {
            const phoneIndex = phoneSlides.indexOf(activeSlide);
            if (phoneIndex >= 0) {
              const nextBg = phoneBgUrls[phoneIndex % phoneBgUrls.length];
              if (nextBg !== lastPhoneBgRef.current) {
                if (phoneFadeTimeoutRef.current) {
                  clearTimeout(phoneFadeTimeoutRef.current);
                }
                phone.classList.add("is-fading");
                phoneFadeTimeoutRef.current = setTimeout(() => {
                  phone.style.backgroundImage = `url("${nextBg}")`;
                  lastPhoneBgRef.current = nextBg;
                  requestAnimationFrame(() => {
                    phone.classList.remove("is-fading");
                  });
                }, 150);
              }
            }
          }
        }
      },
      { threshold: thresholds }
    );

    overlaySlides.forEach((s) => overlayObserver.observe(s));
    if (slide12) overlayObserver.observe(slide12);

    // Text visibility system
    const textSlides = Array.from(
      document.querySelectorAll(
        ".slide2, .slide3, .slide4, .slide5, .slide6, .slide8, .slide9, .slide10, .slide11, .slide15, .slide16, .slide17, .slide18"
      )
    );

    const topTextSelector =
      ".slide2TextContainer, .slide3TextContainer, .slide4TextContainer, .slide5TextContainer, .slide6TextContainer, .slide7TextContainer, .slide8TextContainer, .slide9TextContainer, .slide10TextContainer, .slide11TextContainer, .slide15TextContainer, .slide16TextContainer, .slide17TextContainer, .slide26TextContainer, .slide21TextContainer, .slide23TextContainer, .slide22TextContainer";
    const bottomTextSelector =
      ".slide6BottomText, .slide8BottomText, .slide9BottomText, .slide11BottomText";

    const textTriggers = textSlides
      .map((slide) => {
        const topTrigger = slide.querySelector(topTextSelector);
        const bottomTrigger = slide.querySelector(bottomTextSelector);
        return { slide, topTrigger, bottomTrigger };
      })
      .filter(({ topTrigger, bottomTrigger }) => !!topTrigger || !!bottomTrigger);

    let textRafId = null;
    const slide16 = document.querySelector(".slide16");
    const slide16Text = document.querySelector(".slide16TextContainer");

    const updateTextVisibility = () => {
      textRafId = null;
      const defaultMinY = window.innerHeight * 0.2;
      const defaultMaxY = window.innerHeight * 0.8;
      const tightMinY = window.innerHeight * 0.35;
      const tightMaxY = window.innerHeight * 0.65;

      textTriggers.forEach(({ slide, topTrigger, bottomTrigger }) => {
        const useTightRange = slide.classList.contains("tight-text");
        const minY = useTightRange ? tightMinY : defaultMinY;
        const maxY = useTightRange ? tightMaxY : defaultMaxY;
        const topRect = topTrigger ? topTrigger.getBoundingClientRect() : null;
        const bottomRect = bottomTrigger ? bottomTrigger.getBoundingClientRect() : null;
        const topCenterY = topRect ? topRect.top + topRect.height * 0.5 : null;
        const bottomCenterY = bottomRect ? bottomRect.top + bottomRect.height * 0.5 : null;
        const effectiveTopY = topCenterY ?? bottomCenterY;
        const effectiveBottomY = bottomCenterY ?? topCenterY;
        const isTopOk = effectiveTopY === null ? true : effectiveTopY >= minY;
        const isBottomOk = effectiveBottomY === null ? true : effectiveBottomY <= maxY;
        const isVisible = isTopOk && isBottomOk;
        slide.classList.toggle("text-visible", isVisible);
        const slide11 = document.querySelector(".slide11");
        if (slide11 && slide === slide11) {
          slide11TextVisible = isVisible;
        }
      });

      if (slide16 && slide16Text) {
        const slide16Top = slide16Text.getBoundingClientRect().top;
        slide16.classList.toggle("map-fade", slide16Top <= 0);
      }
      syncSlide11Circle();
    };

    const scheduleTextVisibility = () => {
      if (textRafId !== null) return;
      textRafId = requestAnimationFrame(updateTextVisibility);
    };

    window.addEventListener("scroll", scheduleTextVisibility, { passive: true });
    window.addEventListener("resize", scheduleTextVisibility);
    updateTextVisibility();

    // Synced fades
    const syncedFades = [
      { trigger: ".slide19TextContainer", targets: [".slide19QuoteContainer"] },
      { trigger: ".slide21TextContainer", targets: [".img21"] },
      { trigger: ".slide22TextContainer", targets: [".img22"] },
      { trigger: ".slide23TextContainer", targets: [".slide23Left", ".slide23Right"] },
    ];

    const fadePairs = syncedFades
      .map((set) => {
        const trigger = document.querySelector(set.trigger);
        const targets = set.targets.map((sel) => document.querySelector(sel)).filter(Boolean);
        return trigger && targets.length ? { trigger, targets } : null;
      })
      .filter(Boolean);

    const fadeObservers = [];
    fadePairs.forEach(({ trigger, targets }) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          targets.forEach((el) => el.classList.toggle("block-visible", entry.isIntersecting));
        },
        { threshold: 0.3 }
      );
      obs.observe(trigger);
      fadeObservers.push(obs);
    });

    return () => {
      overlayObserver.disconnect();
      fadeObservers.forEach((o) => o.disconnect());
      window.removeEventListener("scroll", scheduleTextVisibility);
      window.removeEventListener("resize", scheduleTextVisibility);
      if (textRafId) cancelAnimationFrame(textRafId);
    };
  }, []);

  // GSAP gradient orb animation
  useGSAP(() => {
    const gradientOrb = gradientRef.current;
    if (!gradientOrb) return;
    gsap.set(gradientOrb, { opacity: 0 });
    gsap.to(gradientOrb, {
      opacity: 0.75,
      ease: "none",
      scrollTrigger: {
        trigger: ".slide8",
        endTrigger: ".slide11",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  });

  return (
    <div ref={overlayRef} className="phoneOverlay" aria-hidden="true">
      <div ref={phoneRef} className="slide2Phone hidden" />
      <div className="svgContainer">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="phoneGradient" x1="1" x2="0" y1="1" y2="0">
              <stop offset="50%" stopColor="#333333" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle className="phoneOrbBase" cx="50" cy="50" r="40" fill="#e5dccf" />
          <circle
            ref={gradientRef}
            className="phoneOrbGradient"
            cx="50"
            cy="50"
            r="40"
            fill="url(#phoneGradient)"
          />
        </svg>
      </div>
    </div>
  );
}
