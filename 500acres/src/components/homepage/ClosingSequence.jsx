import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import finalImage from "../../assets/images/finalImage.webp";
import finalImage2 from "../../assets/images/finalImage2.webp";

gsap.registerPlugin(ScrollTrigger);

export default function ClosingSequence() {
  const containerRef = useRef(null);
  const slide26TextRef = useRef(null);
  const slide27TextRef = useRef(null);
  const acresSpanRef = useRef(null);

  useGSAP(
    () => {
      // Slide 26: fade in + slide up
      gsap.fromTo(
        slide26TextRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: slide26TextRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Slide 27: fade in + scale up
      gsap.fromTo(
        slide27TextRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: slide27TextRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // "500 Acres" color highlight: cream -> rust
      gsap.fromTo(
        acresSpanRef.current,
        { color: "#f5f0e8" },
        {
          color: "#9f4f2e",
          duration: 1.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: slide27TextRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <section className="slide slide255" data-bg={finalImage} />

      <section className="slide slide26" data-bg={finalImage} data-fade="2500">
        <div
          ref={slide26TextRef}
          className="slide26TextContainer"
          style={{ zIndex: 40, opacity: 0 }}
        >
          But what if those conditions could be co-built into place?
        </div>
      </section>

      <section className="slide slide27" data-bg={finalImage2} data-fade="2500">
        <div
          ref={slide27TextRef}
          className="slide27TextContainer"
          style={{ zIndex: 40, opacity: 0 }}
        >
          And this is where{" "}
          <span ref={acresSpanRef} style={{ color: "#f5f0e8", fontWeight: 800 }}>
            500 Acres
          </span>{" "}
          becomes more than research.
          <br />
          It becomes a model: land near national parks, hands-on training,
          <br />
          and housing kits that convert labor into ownership.
          <br />
          <br />A place where Gen Z can not only imagine belonging,
          <br />
          <strong>but build it — with real tools, on real land, together.</strong>
        </div>
      </section>
    </div>
  );
}
