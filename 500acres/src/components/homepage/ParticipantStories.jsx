import { useState, useEffect, useRef } from "react";
import { participants } from "../../data/participants";
import Modal from "../shared/Modal";

// Import all inline SVGs
import svg01 from "../../assets/svg/01inline.svg";
import svg02 from "../../assets/svg/02inline.svg";
import svg03 from "../../assets/svg/03inline.svg";
import svg04 from "../../assets/svg/04inline.svg";
import svg05 from "../../assets/svg/05inline.svg";
import svg06 from "../../assets/svg/06inline.svg";
import svg07 from "../../assets/svg/07inline.svg";

const svgMap = { "01": svg01, "02": svg02, "03": svg03, "04": svg04, "05": svg05, "06": svg06, "07": svg07 };

export default function ParticipantStories() {
  const [activePopup, setActivePopup] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const slide24 = sectionRef.current;
    if (!slide24) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("slide24-active", entry.isIntersecting);
      },
      { threshold: [0.3] }
    );
    observer.observe(slide24);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="slide slide24" data-bg="">
      <div className="slide24TextContainer" style={{ zIndex: 40 }}>
        <div>
          Belonging can return to reality,
          <br />
          but only when certain conditions are in place.
          <br />
          Across these stories,
          <br />
          the same needs surface again and again:
          <br />
          care, control, and continuity
          <br />
          <br />
          <em>Click to see their stories</em>
        </div>
      </div>

      <div className="slide24SVGContainer">
        {participants.map((p) => (
          <img
            key={p.id}
            src={svgMap[p.svgIndex]}
            alt={p.name}
            className="participant-svg"
            style={p.svgStyle}
            onClick={() => setActivePopup(p.id)}
          />
        ))}
      </div>

      {participants.map((p) => (
        <Modal
          key={p.id}
          isOpen={activePopup === p.id}
          onClose={() => setActivePopup(null)}
          className="w-[80vw] h-[80vh]"
        >
          <img
            src={svgMap[p.svgIndex]}
            alt={p.name}
            style={{
              width: "35%",
              position: "absolute",
              top: "3vh",
              left: "-3vw",
            }}
          />
          <div className="popupHeader">{p.name}</div>
          <div className="popupDesc">
            {p.age} years old
            <br />
            {p.occupation}
            <br />
            {p.status}
          </div>
          <div className="popupTopText">{p.summary}</div>
          <div className="popupBottomText">
            {p.quotes.map((quote, i) => (
              <span key={i}>
                {quote}
                <br />
                <br />
              </span>
            ))}
          </div>
        </Modal>
      ))}
    </section>
  );
}
