import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import img21 from "../../assets/images/21.png";
import img22 from "../../assets/images/22.png";
import left23 from "../../assets/images/23Left.png";
import right23 from "../../assets/images/23Right.png";

gsap.registerPlugin(ScrollTrigger);

export default function MeaningToReality() {
  const containerRef = useRef(null);

  useGSAP(() => {
    const orbs = document.querySelector(".slide20Orbs");
    const leftOrb = document.querySelector(".slide20Orb--left");
    const rightOrb = document.querySelector(".slide20Orb--right");
    const lineGroup = document.querySelector(".slide20LineGroup");
    const dashedLine = document.querySelector(".slide20Line--dashed");
    const solidLines = document.querySelectorAll(".slide20Line--solid");
    const solidUp = document.querySelector(".slide20Line--up");
    const solidDown = document.querySelector(".slide20Line--down");
    const slide23 = containerRef.current;
    const slide19Section = document.querySelector(".slide19");

    if (!orbs || !slide23 || !slide19Section) return;

    // Visibility logic
    let hasSeenSlide19Media = false;
    let isInOrbRange = false;

    const updateOrbs = () => {
      const shouldShow = hasSeenSlide19Media && isInOrbRange;
      orbs.classList.toggle("is-visible", shouldShow);
    };

    const obs19 = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) hasSeenSlide19Media = true;
        updateOrbs();
      },
      { threshold: 0.3 }
    );
    obs19.observe(slide19Section);

    ScrollTrigger.create({
      trigger: slide23,
      start: "top-=100px top",
      end: () => `top+=${window.innerHeight * 3} top`,
      onEnter: () => { isInOrbRange = true; updateOrbs(); },
      onLeave: () => { isInOrbRange = false; updateOrbs(); },
      onEnterBack: () => { isInOrbRange = true; updateOrbs(); },
      onLeaveBack: () => { isInOrbRange = false; updateOrbs(); },
      invalidateOnRefresh: true,
    });

    if (!leftOrb || !rightOrb || !lineGroup) return;

    const computeTargets = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const orbSize =
        parseFloat(getComputedStyle(orbs).getPropertyValue("--orb-size")) || 400;
      const edgeInset =
        parseFloat(getComputedStyle(orbs).getPropertyValue("--orb-edge-inset")) || 40;
      const leftEdge = 0.1 * vw;
      const containerWidth = vw - leftEdge * 2;

      const leftOrbLeft = leftEdge;
      const leftTargetLeft = leftEdge + 0.3 * containerWidth;
      const leftDeltaX = leftTargetLeft - leftOrbLeft;
      const leftDeltaY = -0.03 * vh;

      const rightTargetRight = leftEdge + 0.33 * containerWidth;
      const rightCurrentLeft = vw - leftEdge - orbSize;
      const rightTargetLeft = vw - rightTargetRight - orbSize;
      const rightDeltaX = rightTargetLeft - rightCurrentLeft;
      const rightDeltaY = 0.03 * vh;

      const leftLineWithin = 0.3 * containerWidth + orbSize / 1.5 - edgeInset;
      const rightLineWithin = 0.33 * containerWidth + orbSize - edgeInset;
      const lineLeft = leftEdge + leftLineWithin;
      const lineWidth = Math.max(130, containerWidth - leftLineWithin - rightLineWithin);

      return { leftDeltaX, leftDeltaY, rightDeltaX, rightDeltaY, lineLeft, lineWidth };
    };

    gsap
      .timeline({
        scrollTrigger: {
          trigger: slide23,
          start: "top top",
          end: () => `top+=${window.innerHeight} top`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .to(leftOrb, { x: () => computeTargets().leftDeltaX, y: () => computeTargets().leftDeltaY, ease: "none" }, 0)
      .to(rightOrb, { x: () => computeTargets().rightDeltaX, y: () => computeTargets().rightDeltaY, ease: "none" }, 0)
      .to(lineGroup, {
        left: () => computeTargets().lineLeft,
        width: () => computeTargets().lineWidth,
        rotation: 35,
        transformOrigin: "left center",
        ease: "none",
      }, 0)
      .to(orbs, { "--line-stroke": 3, ease: "none" }, 0);

    if (dashedLine && solidLines.length) {
      ScrollTrigger.create({
        trigger: slide23,
        start: () => `top+=${window.innerHeight * 1.5} top`,
        end: () => `top+=${window.innerHeight * 1.5} top`,
        onEnter: () => {
          gsap.to(dashedLine, { opacity: 0, duration: 0.5, ease: "power2.out" });
          gsap.to(solidLines, { opacity: 1, duration: 0.5, ease: "power2.out" });
        },
        onEnterBack: () => {
          gsap.to(dashedLine, { opacity: 1, duration: 0.5, ease: "power2.out" });
          gsap.to(solidLines, { opacity: 0, duration: 0.5, ease: "power2.out" });
        },
        invalidateOnRefresh: true,
      });
    }

    if (solidUp && solidDown) {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: slide23,
            start: () => `top+=${window.innerHeight * 1.5} top`,
            end: () => `top+=${window.innerHeight * 2.5} top`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .to(solidUp, { rotation: -15, transformOrigin: "center center", ease: "none" }, 0)
        .to(solidDown, { rotation: 15, transformOrigin: "center center", ease: "none" }, 0);
    }

    return () => {
      obs19.disconnect();
    };
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="slide slide23" data-bg="">
      <div className="slide20TextContainer" style={{ zIndex: 40 }}>
        <div>
          When housing and living conditions
          <br />
          can no longer carry a sense of belonging,
          <br />
          people turn to meaning to fill the gap.
          <br />
          <br />
          But a question soon emerges:
          <br />
          <strong>Can that meaning return to material reality?</strong>
        </div>
      </div>

      <div className="slide20Orbs" aria-hidden="true">
        <svg
          className="slide20Orb slide20Orb--left"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="slide20Gradient" x1="0" x2="1" y1="0" y2="1">
              <stop offset="50%" stopColor="#333333" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="url(#slide20Gradient)" />
        </svg>

        <div className="slide20LineGroup" aria-hidden="true">
          <svg
            className="slide20Line slide20Line--dashed"
            viewBox="0 0 500 20"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0" y1="10" x2="500" y2="10" />
          </svg>
          <svg
            className="slide20Line slide20Line--solid slide20Line--up"
            viewBox="0 0 500 20"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0" y1="10" x2="500" y2="10" />
          </svg>
          <svg
            className="slide20Line slide20Line--solid slide20Line--center"
            viewBox="0 0 500 20"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0" y1="10" x2="500" y2="10" />
          </svg>
          <svg
            className="slide20Line slide20Line--solid slide20Line--down"
            viewBox="0 0 500 20"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0" y1="10" x2="500" y2="10" />
          </svg>
        </div>

        <svg
          className="slide20Orb slide20Orb--right"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="40" fill="#ffffff" />
        </svg>
      </div>

      <div className="slide21TextContainer">
        Some people place belonging in lighter spaces:
        <br />
        online relationships, content worlds…
        <br />
        When material conditions cannot keep up,
        <br />
        meaning first takes shape outside physical reality.
      </div>

      <div className="slide22TextContainer">
        <div>
          Others try to reconnect meaning to everyday life:
          <br />
          turning relationships into repeatable encounters,
          <br />
          preferences into executable routines,
          <br />
          and ideals into small-scale spatial arrangements.
        </div>
      </div>

      <div className="slide23TextContainer">
        Some shift toward collective connection.
        <br />
        Belonging needs more than housing: shared spaces, low-barrier third
        places, and routines of collective care,
        <br />
        where people can gather, return, and build meaning through practice.
        <br />
        Reimagining belonging becomes something that can be tried, repeated, and
        built together.
      </div>

      <img className="slide23Left" src={left23} alt="Community space left" />
      <img className="slide23Right" src={right23} alt="Community space right" />
      <img className="img21" src={img21} alt="Lighter spaces" />
      <img className="img22" src={img22} alt="Everyday life" />
    </section>
  );
}
