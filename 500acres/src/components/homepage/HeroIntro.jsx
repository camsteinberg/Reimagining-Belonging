import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function HeroIntro() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);
  const arrowRef = useRef(null);

  const intro = () => {
    const slide2 = document.querySelector(".slide2");
    if (slide2) {
      slide2.scrollIntoView({ behavior: "smooth" });
    }
  };

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Staggered entrance: title, subtitle, button fade in + slide up
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 }
      )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.5"
        )
        .fromTo(
          buttonRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3"
        )
        .fromTo(
          arrowRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          "-=0.1"
        );

      // Subtle pulsing glow on the start button
      gsap.to(buttonRef.current, {
        boxShadow: "0 0 20px rgba(255, 255, 255, 0.35)",
        scale: 1.04,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.8,
      });

      // Bouncing scroll indicator arrow
      gsap.to(arrowRef.current, {
        y: 10,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2.2,
      });
    },
    { scope: sectionRef }
  );

  return (
    <section className="slide slide1" ref={sectionRef}>
      <header className="introHeader" ref={titleRef} style={{ opacity: 0 }}>
        Reimagining Belonging
      </header>
      <div className="introSub" ref={subtitleRef} style={{ opacity: 0 }}>
        How Meaning Takes Shape When Home is Unstable
      </div>
      <button
        className="startButton"
        ref={buttonRef}
        style={{ opacity: 0 }}
        onClick={intro}
      >
        Click to Start
      </button>
      <div
        ref={arrowRef}
        style={{
          opacity: 0,
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={intro}
        aria-hidden="true"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
