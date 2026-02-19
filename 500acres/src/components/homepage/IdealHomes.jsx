import { useState, useEffect, useRef } from "react";
import { participants } from "../../data/participants";
import Modal from "../shared/Modal";

// Import ideal home images
import ih01 from "../../assets/images/idealHome/01.webp";
import ih02 from "../../assets/images/idealHome/02.webp";
import ih03 from "../../assets/images/idealHome/03.webp";
import ih04 from "../../assets/images/idealHome/04.webp";
import ih05 from "../../assets/images/idealHome/05.webp";
import ih06 from "../../assets/images/idealHome/06.webp";
import ih07 from "../../assets/images/idealHome/07.webp";

const idealHomeImages = { "01.webp": ih01, "02.webp": ih02, "03.webp": ih03, "04.webp": ih04, "05.webp": ih05, "06.webp": ih06, "07.webp": ih07 };


export default function IdealHomes() {
  const [activePopup, setActivePopup] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const slide25 = sectionRef.current;
    const slide24Text = document.querySelector(".slide24TextContainer");
    if (!slide25) return;

    let isSlide25Visible = false;
    let isSlide24TextVisible = false;

    const update = () => {
      const isActive = isSlide25Visible && !isSlide24TextVisible;
      document.body.classList.toggle("slide25-active", isActive);
    };

    const slide25Observer = new IntersectionObserver(
      ([entry]) => {
        isSlide25Visible = entry.isIntersecting;
        update();
      },
      { threshold: [0.3] }
    );
    slide25Observer.observe(slide25);

    let slide24TextObserver;
    if (slide24Text) {
      slide24TextObserver = new IntersectionObserver(
        ([entry]) => {
          isSlide24TextVisible = entry.isIntersecting;
          update();
        },
        { threshold: [0.1] }
      );
      slide24TextObserver.observe(slide24Text);
    }

    return () => {
      slide25Observer.disconnect();
      if (slide24TextObserver) slide24TextObserver.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="slide slide25" data-bg="">
      <div className="slide25TextContainer" style={{ zIndex: 40 }}>
        <div>
          When those conditions can't coexist,
          <br />
          the limit isn't imagination,
          <br />
          but what the real world can support.
          <br />
          So, belonging stays in meaning,
          <br />
          in what we imagine, and what we scroll past.
          <br />
          <br />
          <em>Click to see their ideal home drawings</em>
        </div>
      </div>

      {participants.map((p, index) => {
        const imgSrc = idealHomeImages[p.idealHomeImage];
        const containerClass = index === 0 ? "imgContainer" : `imgContainer${index + 1}`;
        return (
          <div
            key={p.id}
            className={containerClass}
            onClick={() => setActivePopup(p.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActivePopup(p.id); } }}
            role="button"
            tabIndex={0}
            aria-label={`View ${p.name}'s ideal home: ${p.idealHomeTitle}`}
          >
            <img src={imgSrc} alt={p.idealHomeTitle} loading="lazy" />
          </div>
        );
      })}

      {participants.map((p) => {
        const imgSrc = idealHomeImages[p.idealHomeImage];
        return (
          <Modal
            key={p.id}
            isOpen={activePopup === p.id}
            onClose={() => setActivePopup(null)}
            className="w-[75vw] h-[75vh]"
          >
            <img
              src={imgSrc}
              alt={p.idealHomeTitle}
              loading="lazy"
              style={{ height: "100%", padding: "50px" }}
            />
            <div className="popWinHeader">{p.idealHomeTitle}</div>
            <div className="popWinDesc">{p.idealHomeDescription}</div>
          </Modal>
        );
      })}
    </section>
  );
}
