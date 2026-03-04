'use client';

import { useState, useCallback } from "react";
import greenImg from "@/assets/images/greenImg.webp";
import yellowImg from "@/assets/images/yellowImg.webp";
import redImg from "@/assets/images/redImg.webp";
import blueImg from "@/assets/images/blueImg.webp";

const CIRCLES = [
  { key: "green", container: "greenSVGContainer", fill: "#234635", label: "Place" },
  { key: "yellow", container: "yellowSVGContainer", fill: "#c4a448", label: "Object" },
  { key: "red", container: "redSVGContainer", fill: "#9f4f2e", label: "Person" },
  { key: "blue", container: "blueSVGContainer", fill: "#2f5496", label: "Language" },
] as const;

export default function BelongingFramework() {
  const [activeCircle, setActiveCircle] = useState<string | null>(null);

  const handleCircleClick = useCallback((key: string) => {
    setActiveCircle((prev) => (prev === key ? null : key));
  }, []);

  return (
    <section className="slide slide18" data-bg="">
      <div className="slide18TextContainer" style={{ zIndex: 40 }}>
        <div>
          Under uncontrollable housing conditions,
          <br />
          people begin to link belonging to more controllable, more portable
          anchors of meaning.
          <br />
          <br />
          <em>Hover or tap to explore.</em>
        </div>
      </div>

      <div className="slide18Media" aria-hidden="true">
        <img className="img-green" src={greenImg.src} alt="Place image" />
        <img className="img-yellow" src={yellowImg.src} alt="Object image" />
        <img className="img-red" src={redImg.src} alt="Person image" />
        <img className="img-blue" src={blueImg.src} alt="Language image" />
      </div>

      {CIRCLES.map(({ key, container, fill, label }) => (
        <div
          key={key}
          className={`${container}${activeCircle === key ? " circle-active" : ""}`}
          onClick={() => handleCircleClick(key)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCircleClick(key); } }}
          role="button"
          tabIndex={0}
          aria-pressed={activeCircle === key}
          aria-label={`${label} — belonging anchor`}
        >
          <svg
            height="100"
            width="100"
            viewBox="0 0 160 160"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <circle className="circleFill" cx="80" cy="80" r="70" fill={fill} />
            <circle className="circleHit" cx="80" cy="80" r="70" fill={fill} />
          </svg>
          <div className="circleLabel">{label}</div>
        </div>
      ))}
    </section>
  );
}
