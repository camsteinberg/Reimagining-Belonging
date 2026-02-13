import { useEffect, useRef } from "react";

import svg01 from "../../assets/svg/01inline.svg";
import svg02 from "../../assets/svg/02inline.svg";
import svg03 from "../../assets/svg/03inline.svg";
import svg04 from "../../assets/svg/04inline.svg";
import svg05 from "../../assets/svg/05inline.svg";
import svg06 from "../../assets/svg/06inline.svg";
import svg07 from "../../assets/svg/07inline.svg";

const svgSources = [svg01, svg02, svg03, svg04, svg05, svg06, svg07];

export default function FinalSlide() {
  const marqueeRef = useRef(null);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const buildRow = (row) => {
      const track = row.querySelector(".finalSvgTrack");
      if (!track) return;
      track.innerHTML = "";
      const rowWidth = row.getBoundingClientRect().width || window.innerWidth;
      const minItems = Math.max(10, Math.ceil(rowWidth / 180) + 6);
      const created = [];

      for (let i = 0; i < minItems; i++) {
        const img = document.createElement("img");
        img.className = "finalSvgIcon";
        img.src = svgSources[Math.floor(Math.random() * svgSources.length)];
        img.alt = "";
        img.loading = "eager";
        created.push(img);
        track.appendChild(img);
      }

      created.forEach((node) => track.appendChild(node.cloneNode(true)));
    };

    const rows = marquee.querySelectorAll(".finalSvgRow");
    rows.forEach((row) => buildRow(row));

    let marqueeResizeRaf = null;
    const onResize = () => {
      if (marqueeResizeRaf !== null) return;
      marqueeResizeRaf = requestAnimationFrame(() => {
        marqueeResizeRaf = null;
        rows.forEach((row) => buildRow(row));
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="slide slide28" data-bg="">
      <div className="slide28TextContainer">
        <strong>How does your belonging take shape?</strong>
      </div>

      <div ref={marqueeRef} className="finalSvgMarquee" aria-hidden="true">
        <div className="finalSvgRow finalSvgRow--left">
          <div className="finalSvgTrack" />
        </div>
        <div className="finalSvgRow finalSvgRow--right">
          <div className="finalSvgTrack" />
        </div>
      </div>

      <button className="makeIconButton">Make my icon</button>

      <div className="slide28BottomText">
        Editing by <span className="bold-underline">Yuchun Zhang</span>
        <br />
        <br />
        With thanks to:
        <br />
        <span className="bold-underline">500 Acres</span>, for hosting and
        supporting this fellowship research project.
        <br />
        Aidan Miller (500 Acres), for building the website and supporting its
        development.
        <br />
        The seven Gen Z participants who generously shared their time, stories,
        drawings, and reflections, making this project possible.
        <br />
        Additional thanks to collaborators and reviewers within the 500 Acres
        community who offered feedback, discussion, and care during development.
      </div>
    </section>
  );
}
