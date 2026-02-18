import { useState, useEffect } from "react";

export default function LoadingScreen({ show = true }) {
  const [hidden, setHidden] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Skip timers entirely when not shown (e.g. subpages)
    if (!show) return;

    // Start fade out after writing animation completes
    const timer = setTimeout(() => setFadeOut(true), 2800);
    const removeTimer = setTimeout(() => setHidden(true), 3400);
    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [show]);

  if (!show || hidden) return null;

  const strokeLength = 2000;
  const textColor = "#e8e0d0";

  return (
    <div className={`loading-screen ${fadeOut ? "is-hidden" : ""}`}>
      <style>{`
        @keyframes writeStroke {
          0% {
            stroke-dashoffset: ${strokeLength};
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fillIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes fadeInTagline {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.4;
          }
        }

        .loading-title-stroke {
          fill: none;
          stroke: ${textColor};
          stroke-width: 1.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: ${strokeLength};
          stroke-dashoffset: ${strokeLength};
          animation: writeStroke 2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
          font-family: var(--font-serif), 'EB Garamond', 'Georgia', serif;
          font-size: 72px;
          font-style: italic;
        }

        .loading-title-fill {
          fill: ${textColor};
          stroke: none;
          opacity: 0;
          animation: fillIn 0.5s ease forwards;
          animation-delay: 1.8s;
          font-family: var(--font-serif), 'EB Garamond', 'Georgia', serif;
          font-size: 72px;
          font-style: italic;
        }

        .loading-tagline {
          fill: ${textColor};
          opacity: 0;
          animation: fadeInTagline 0.6s ease forwards;
          animation-delay: 2.2s;
          font-family: var(--font-serif), 'EB Garamond', 'Georgia', serif;
          font-size: 14px;
          letter-spacing: 0.3em;
          font-variant: small-caps;
          text-transform: lowercase;
        }

        @media (max-width: 640px) {
          .loading-title-stroke,
          .loading-title-fill {
            font-size: 54px;
          }

          .loading-tagline {
            font-size: 12px;
            letter-spacing: 0.25em;
          }
        }
      `}</style>

      <svg
        aria-hidden="true"
        style={{
          overflow: "visible",
          width: "600px",
          maxWidth: "90vw",
          height: "160px",
        }}
        viewBox="0 0 600 160"
      >
        {/* Stroke version — animated "writing" effect */}
        <text
          className="loading-title-stroke"
          x="50%"
          y="80"
          textAnchor="middle"
          dominantBaseline="central"
        >
          500 Acres
        </text>

        {/* Fill version — fades in after stroke completes */}
        <text
          className="loading-title-fill"
          x="50%"
          y="80"
          textAnchor="middle"
          dominantBaseline="central"
        >
          500 Acres
        </text>

        {/* Tagline — fades in last */}
        <text
          className="loading-tagline"
          x="50%"
          y="130"
          textAnchor="middle"
          dominantBaseline="central"
        >
          Build your home · Build your skills · Build your wealth
        </text>
      </svg>
    </div>
  );
}
