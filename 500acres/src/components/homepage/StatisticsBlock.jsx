import { useState, useEffect, useRef, useCallback } from "react";

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const animate = useCallback(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [target, duration, hasAnimated]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate();
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [animate]);

  return (
    <span
      ref={ref}
      className="counter-number"
      style={{ color: "#9f4f2e" }}
    >
      {count}%
    </span>
  );
}

export default function StatisticsBlock() {
  return (
    <>
      <section className="slide slide8" data-bg="">
        <div className="slide8TextContainer">
          <div style={{ color: "#e5dccf" }}>For a long time,</div>
          <div style={{ color: "#e5dccf" }}>home was a clear and stable concept.</div>
        </div>
        <div className="slide8BottomText" style={{ display: "flex", flexDirection: "column", position: "absolute", top: "55%", textAlign: "center", zIndex: 20 }}>
          <div style={{ color: "#e5dccf" }}>But for many Gen Z today,</div>
          <div style={{ color: "#e5dccf" }}>that reality is shifting.</div>
        </div>
      </section>

      <section className="slide slide9" data-bg="">
        <div className="slide9TextContainer" style={{ display: "flex", flexDirection: "column", position: "absolute", top: "40%", textAlign: "center", zIndex: 20 }}>
          <div style={{ color: "#e5dccf" }}>
            In the United States, young people's homeownership
          </div>
          <div style={{ color: "#e5dccf" }}>
            rates are significantly lower than those of previous
          </div>
          <div style={{ color: "#e5dccf" }}>
            generations at the same age.{" "}
            <a
              href="https://www.pewresearch.org/short-reads/2025/04/17/the-shares-of-young-adults-living-with-parents-vary-widely-across-the-us/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#c4a448", fontStyle: "italic" }}
            >
              (Pew Research Center)
            </a>
          </div>
        </div>
        <div className="slide9BottomText" style={{ display: "flex", flexDirection: "column", position: "absolute", top: "55%", textAlign: "center", zIndex: 20 }}>
          <div style={{ color: "#e5dccf" }}>
            <AnimatedCounter target={81} /> of Gen Z say they
            cannot afford a home right now,
          </div>
          <div style={{ color: "#e5dccf" }}>
            and <AnimatedCounter target={82} /> worry the housing
            market will get worse
          </div>
          <div style={{ color: "#e5dccf" }}>
            before they are able to buy.{" "}
            <a
              href="https://cleveroffers.com/research/gen-z-homeownership-rate/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#c4a448", fontStyle: "italic" }}
            >
              (Clever Offers&trade;)
            </a>
          </div>
        </div>
      </section>

      <section className="slide slide10" data-bg="">
        <div className="slide10TextContainer">
          <div style={{ color: "#e5dccf" }}>
            This is not because they no longer want a home.
          </div>
          <div style={{ color: "#e5dccf" }}>On the contrary,</div>
          <div style={{ color: "#e5dccf" }}>
            <AnimatedCounter target={90} /> of Gen Z hope to own a
            home someday,
          </div>
          <div style={{ color: "#e5dccf" }}>
            yet <AnimatedCounter target={62} /> worry that it may
            never happen.
          </div>
          <div style={{ color: "#e5dccf" }}>
            <a
              href="https://cleveroffers.com/research/gen-z-homeownership-rate/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#c4a448", fontStyle: "italic" }}
            >
              (Clever Offers&trade;)
            </a>
          </div>
        </div>
      </section>

      <section className="slide slide11" data-bg="">
        <div className="slide11TextContainer">
          <div style={{ color: "#e5dccf" }}>
            When the future feels harder to afford,
          </div>
          <div style={{ color: "#e5dccf" }}>long-term plans get delayed.</div>
        </div>
        <div className="slide11BottomText" style={{ display: "flex", flexDirection: "column", position: "absolute", top: "55%", textAlign: "center", zIndex: 20 }}>
          <div style={{ color: "#e5dccf" }}>Under that pressure,</div>
          <div style={{ color: "#e5dccf" }}>
            home loses its sense of stability.
          </div>
        </div>
      </section>
    </>
  );
}
