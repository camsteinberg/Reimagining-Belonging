import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import sectionBg5 from "../../assets/images/section01-bg-5.png";

gsap.registerPlugin(ScrollTrigger);

export default function ZoomTransition() {
  const containerRef = useRef(null);

  useGSAP(() => {
    const slide6BottomText = document.querySelector(".slide6BottomText");
    const slide6Stage7 = document.querySelector(".slide6Stage7");
    const slide7Overlay = document.querySelector(".slide7BgOverlay");
    const slide7Text = document.querySelector(".slide7TextContainer");

    if (slide6BottomText) {
      gsap.set(slide6BottomText, { scale: 1, opacity: 1, transformOrigin: "center center" });

      gsap.timeline({
        scrollTrigger: {
          trigger: slide6BottomText,
          start: "center center",
          endTrigger: slide6Stage7 || ".slide8",
          end: "top top",
          scrub: true,
          pin: true,
          pinReparent: true,
          onEnter: () => {
            document.body.classList.add("slide6-zoom-active");
            gsap.set(slide6BottomText, { opacity: 1 });
          },
          onEnterBack: () => {
            document.body.classList.add("slide6-zoom-active");
            gsap.set(slide6BottomText, { opacity: 1 });
          },
          onLeave: () => {
            gsap.set(slide6BottomText, { opacity: 0 });
            document.body.classList.remove("slide6-zoom-active");
          },
          onLeaveBack: () => {
            gsap.set(slide6BottomText, { opacity: 0 });
            document.body.classList.remove("slide6-zoom-active");
          },
          invalidateOnRefresh: true,
        },
      })
        .to(slide6BottomText, { scale: 1.35, ease: "none", duration: 1 })
        .to(slide6BottomText, { opacity: 0, ease: "none", duration: 0.2 }, 0.8);
    }

    // Slide 8 body class toggle
    ScrollTrigger.create({
      trigger: ".slide8",
      start: "top bottom",
      end: "bottom top",
      toggleClass: { targets: document.body, className: "slide8-active" },
    });

    // Slide 7 fadeout logic
    if (slide7Overlay && slide6Stage7) {
      gsap.set(slide7Overlay, { opacity: 0 });
      if (slide7Text) {
        gsap.set(slide7Text, { scale: 1, opacity: 0, transformOrigin: "center center" });
      }

      ScrollTrigger.create({
        trigger: slide6Stage7,
        start: "top top",
        endTrigger: slide6Stage7,
        end: "bottom top",
        onEnter: () => {
          if (window.__bg) window.__bg.isSlide7FadeoutRef.current = true;
          document.body.classList.add("slide7-active", "slide7-fadeout");
          if (window.__bg) window.__bg.changeBg(null, 500);
        },
        onEnterBack: () => {
          if (window.__bg) window.__bg.isSlide7FadeoutRef.current = false;
          document.body.classList.add("slide7-active");
          document.body.classList.remove("slide7-fadeout");
          if (window.__bg) window.__bg.setBgInstant(window.__bg.pickMostVisibleSlide().dataset.bg);
        },
        onLeave: () => {
          if (window.__bg) window.__bg.isSlide7FadeoutRef.current = false;
          document.body.classList.remove("slide7-active", "slide7-fadeout");
          if (window.__bg) window.__bg.setBgInstant(window.__bg.pickMostVisibleSlide().dataset.bg);
        },
        onLeaveBack: () => {
          if (window.__bg) window.__bg.isSlide7FadeoutRef.current = false;
          document.body.classList.remove("slide7-active", "slide7-fadeout");
          if (window.__bg) window.__bg.setBgInstant(window.__bg.pickMostVisibleSlide().dataset.bg);
        },
        invalidateOnRefresh: true,
      });
    }
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="slide slide6 tight-text" data-bg={sectionBg5}>
      <div className="slide6TextContainer">
        <div>And</div>
        <div>We rarely stop</div>
        <div>to ask:</div>
      </div>
      <div className="slide6BottomText">
        <div>Is this place</div>
        <div>still</div>
        <div className="brownText">home?</div>
      </div>
      <div className="slide6Stage7" aria-hidden="true" />
      <div className="slide7TextContainer" style={{ fontSize: "30px" }}>
        <div>Is this place</div>
        <div>still</div>
        <div className="brownText">home?</div>
      </div>
    </section>
  );
}
