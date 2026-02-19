import { useRef, useEffect } from "react";
import drawing1 from "../../assets/images/section06-1.webp";
import drawing2 from "../../assets/images/section06-2.webp";
import drawing3 from "../../assets/images/section06-3.webp";
import drawing4 from "../../assets/images/section06-4.webp";
import quote1 from "../../assets/images/slide191.webp";
import quote2 from "../../assets/images/slide192.webp";
import quote3 from "../../assets/images/slide193.webp";
import quote4 from "../../assets/images/slide194.webp";

export default function ParticipantDrawings() {
  const slideRef = useRef(null);

  useEffect(() => {
    const slide19 = slideRef.current;
    if (!slide19) return;

    const slide19Drawings = slide19.querySelectorAll(".slide19Drawing");
    const slide19Quotes = slide19.querySelectorAll(".slide19QuoteContainer img");

    if (!slide19Drawings.length || !slide19Quotes.length) return;

    const centerDrawingInSlide = (drawingEl) => {
      const slideRect = slide19.getBoundingClientRect();
      const drawingRect = drawingEl.getBoundingClientRect();
      const desiredHeight = window.innerHeight * 0.6;
      const scale = desiredHeight / drawingRect.height;
      const slideCenterX = slideRect.left + slideRect.width / 2;
      const slideCenterY = slideRect.top + slideRect.height / 2;
      const drawingCenterX = drawingRect.left + drawingRect.width / 2;
      const drawingCenterY = drawingRect.top + drawingRect.height / 2;
      const dx = slideCenterX - drawingCenterX;
      const dy = slideCenterY - drawingCenterY - 50;
      drawingEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
    };

    const isWithin = (rect, x, y) =>
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

    let activeDrawing = null;
    let activeQuote = null;
    let activeOriginRect = null;

    const resetActive = () => {
      if (!activeDrawing || !activeQuote) return;
      activeQuote.style.opacity = "0";
      activeDrawing.style.transform = "translate3d(0px, 0px, 0) scale(1)";
      activeDrawing = null;
      activeQuote = null;
      activeOriginRect = null;
      document.removeEventListener("mousemove", onPointerMove);
    };

    const onPointerMove = (event) => {
      if (!activeDrawing || !activeOriginRect) return;
      const currentRect = activeDrawing.getBoundingClientRect();
      const withinOrigin = isWithin(activeOriginRect, event.clientX, event.clientY);
      const withinCurrent = isWithin(currentRect, event.clientX, event.clientY);
      if (withinOrigin || withinCurrent) return;
      resetActive();
    };

    // Detect touch device at event-binding time
    const isTouchDevice =
      window.matchMedia("(hover: none), (pointer: coarse)").matches;

    const handlers = [];
    slide19Drawings.forEach((drawingEl, index) => {
      const quoteEl = slide19Quotes[index];
      if (!quoteEl) return;

      const activate = () => {
        if (activeDrawing === drawingEl) return;
        if (activeDrawing && activeDrawing !== drawingEl) resetActive();
        activeDrawing = drawingEl;
        activeQuote = quoteEl;
        activeOriginRect = drawingEl.getBoundingClientRect();
        activeQuote.style.opacity = "1";
        centerDrawingInSlide(drawingEl);
        document.addEventListener("mousemove", onPointerMove);
      };

      if (!isTouchDevice) {
        // Desktop: mouseenter triggers expansion
        drawingEl.addEventListener("mouseenter", activate);
        handlers.push({ el: drawingEl, type: "mouseenter", handler: activate });
      } else {
        // Touch: tap toggles expansion; tap same drawing to collapse
        const touchHandler = (e) => {
          e.preventDefault();
          if (activeDrawing === drawingEl) {
            resetActive();
          } else {
            activate();
          }
        };
        drawingEl.addEventListener("click", touchHandler);
        handlers.push({ el: drawingEl, type: "click", handler: touchHandler });
      }
    });

    // On touch devices, tapping outside any drawing collapses the active one
    const onDocumentTouch = (e) => {
      if (!activeDrawing) return;
      const tappedDrawing = e.target.closest(".slide19Drawing");
      if (!tappedDrawing) resetActive();
    };

    if (isTouchDevice) {
      document.addEventListener("touchstart", onDocumentTouch, { passive: true });
    }

    return () => {
      handlers.forEach(({ el, type, handler }) =>
        el.removeEventListener(type, handler)
      );
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("touchstart", onDocumentTouch);
    };
  }, []);

  return (
    <section ref={slideRef} className="slide slide19" data-bg="">
      <div className="slide19TextContainer" style={{ zIndex: 40 }}>
        <div>
          Belonging isn't about knowing more people.
          <br />
          For many Gen Z, what matters is whether connection can be{" "}
          <strong>optional, reversible, and repeatable.</strong>
          <br />
          <br />
          <em>Hover or tap to explore.</em>
        </div>
      </div>

      <div className="slide19Media">
        <div className="slide19Drawing" role="button" tabIndex={0} aria-label="Sherry's belonging drawing — hover or tap to explore">
          <svg
            className="slide19Circle"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="50" cy="50" r="50" fill="#ffffff" />
          </svg>
          <img className="drawing1" src={drawing1} alt="Sherry's drawing about belonging" />
        </div>
        <div className="slide19Drawing" role="button" tabIndex={0} aria-label="Michaella's belonging drawing — hover or tap to explore">
          <svg
            className="slide19Circle"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="50" cy="50" r="50" fill="#ffffff" />
          </svg>
          <img className="drawing2" src={drawing2} alt="Michaella's drawing about belonging" />
        </div>
        <div className="slide19Drawing" role="button" tabIndex={0} aria-label="Oliver's belonging drawing — hover or tap to explore">
          <svg
            className="slide19Circle"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="50" cy="50" r="50" fill="#ffffff" />
          </svg>
          <img className="drawing3" src={drawing3} alt="Oliver's drawing about belonging" />
        </div>
        <div className="slide19Drawing" role="button" tabIndex={0} aria-label="FY's belonging drawing — hover or tap to explore">
          <svg
            className="slide19Circle"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="50" cy="50" r="50" fill="#ffffff" />
          </svg>
          <img className="drawing4" src={drawing4} alt="FY's drawing about belonging" />
        </div>
      </div>

      <div className="slide19QuoteContainer" aria-hidden="true">
        <img className="slide19Quote1" src={quote1} alt="" />
        <img className="slide19Quote2" src={quote2} alt="" />
        <img className="slide19Quote3" src={quote3} alt="" />
        <img className="slide19Quote4" src={quote4} alt="" />
      </div>
    </section>
  );
}
