"use client";

// TerrainBackground — SVG backdrop evoking the 500 Acres land near national parks.
// Layers (back to front): sky gradient → distant mountains → rolling hills → trees → ground plane.
// Position absolute, inset-0, low z-index so game content overlays it.

interface TerrainBackgroundProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Tree helper — simple triangular pixel-art conifer (SimCity style)
// ---------------------------------------------------------------------------

interface TreeProps {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}

function PixelTree({ x, y, scale = 1, color = "#3d6b4f" }: TreeProps) {
  const s = scale;
  // Three tiers of triangles stacked, with a thin trunk
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Trunk */}
      <rect x={-2 * s} y={0} width={4 * s} height={6 * s} fill="#4a3728" />
      {/* Bottom tier */}
      <polygon
        points={`${-10 * s},${0} ${10 * s},${0} ${0},${-12 * s}`}
        fill={color}
      />
      {/* Middle tier */}
      <polygon
        points={`${-8 * s},${-8 * s} ${8 * s},${-8 * s} ${0},${-18 * s}`}
        fill={color}
      />
      {/* Top tier */}
      <polygon
        points={`${-5 * s},${-15 * s} ${5 * s},${-15 * s} ${0},${-24 * s}`}
        fill={color}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TerrainBackground({ className = "" }: TerrainBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", opacity: 0.65 }}
      >
        <defs>
          {/* Sky gradient: warm cream to pale sage at horizon */}
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f1ea" />
            <stop offset="60%" stopColor="#e8e0d0" />
            <stop offset="100%" stopColor="#d6e2d8" />
          </linearGradient>

          {/* Subtle ground texture */}
          <linearGradient id="groundGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4c9b4" />
            <stop offset="100%" stopColor="#c8bb9f" />
          </linearGradient>

          {/* Parallax CSS for layers */}
          <style>{`
            @media (prefers-reduced-motion: no-preference) {
              .terrain-layer-far {
                animation: terrain-drift-far 60s ease-in-out infinite alternate;
              }
              .terrain-layer-mid {
                animation: terrain-drift-mid 45s ease-in-out infinite alternate;
              }
              .terrain-layer-near {
                animation: terrain-drift-near 30s ease-in-out infinite alternate;
              }
              @keyframes terrain-drift-far {
                0%   { transform: translateX(0px) translateY(0px); }
                100% { transform: translateX(-6px) translateY(2px); }
              }
              @keyframes terrain-drift-mid {
                0%   { transform: translateX(0px) translateY(0px); }
                100% { transform: translateX(-10px) translateY(3px); }
              }
              @keyframes terrain-drift-near {
                0%   { transform: translateX(0px) translateY(0px); }
                100% { transform: translateX(-14px) translateY(4px); }
              }
            }
          `}</style>
        </defs>

        {/* ── Layer 0: Sky ───────────────────────────────────────────── */}
        <rect width="1440" height="900" fill="url(#skyGradient)" />

        {/* ── Layer 1: Distant mountains (farthest back, lightest) ──── */}
        <g className="terrain-layer-far" opacity="0.55">
          {/* Mountain range A — leftmost, palest sage */}
          <polygon
            points="0,520 120,320 260,450 380,280 520,420 640,300 760,480 900,340 1060,460 1200,310 1360,430 1440,360 1440,600 0,600"
            fill="#8fa894"
          />
        </g>

        {/* ── Layer 2: Mid mountains (darker sage/forest) ───────────── */}
        <g className="terrain-layer-far" opacity="0.7">
          <polygon
            points="0,560 80,400 180,500 300,350 450,490 580,370 700,510 840,390 980,520 1100,400 1240,530 1380,420 1440,470 1440,650 0,650"
            fill="#6b8f71"
          />
        </g>

        {/* ── Layer 3: Near mountains (forest tone) ─────────────────── */}
        <g className="terrain-layer-mid" opacity="0.8">
          <polygon
            points="0,600 100,460 200,540 320,420 460,550 600,440 740,570 880,450 1020,580 1160,470 1300,590 1440,500 1440,700 0,700"
            fill="#3d6b4f"
          />
        </g>

        {/* ── Layer 4: Rolling hills (mid-ground) ───────────────────── */}
        <g className="terrain-layer-mid">
          {/* Hill A */}
          <ellipse cx="300" cy="680" rx="420" ry="120" fill="#4d7a5a" opacity="0.75" />
          {/* Hill B */}
          <ellipse cx="900" cy="690" rx="500" ry="110" fill="#568063" opacity="0.7" />
          {/* Hill C */}
          <ellipse cx="1300" cy="675" rx="380" ry="105" fill="#4d7a5a" opacity="0.65" />
          {/* Connecting ground swell */}
          <path
            d="M0,720 C160,660 340,700 520,680 C700,660 880,695 1060,678 C1240,661 1360,690 1440,675 L1440,900 L0,900 Z"
            fill="#507558"
            opacity="0.6"
          />
        </g>

        {/* ── Layer 5: Trees along hills ─────────────────────────────── */}
        <g className="terrain-layer-near" opacity="0.85">
          {/* Left cluster — forest color, varied scales */}
          <PixelTree x={60}  y={700} scale={1.2} color="#3d6b4f" />
          <PixelTree x={110} y={690} scale={1.5} color="#365f45" />
          <PixelTree x={158} y={705} scale={1.0} color="#3d6b4f" />
          <PixelTree x={195} y={695} scale={1.3} color="#6b8f71" />
          <PixelTree x={235} y={710} scale={0.9} color="#3d6b4f" />

          {/* Center-left cluster */}
          <PixelTree x={380} y={688} scale={1.4} color="#3d6b4f" />
          <PixelTree x={425} y={698} scale={1.1} color="#6b8f71" />
          <PixelTree x={465} y={685} scale={1.6} color="#365f45" />
          <PixelTree x={510} y={700} scale={1.0} color="#3d6b4f" />

          {/* Center cluster */}
          <PixelTree x={650} y={692} scale={1.3} color="#6b8f71" />
          <PixelTree x={695} y={680} scale={1.7} color="#3d6b4f" />
          <PixelTree x={740} y={694} scale={1.2} color="#365f45" />
          <PixelTree x={780} y={705} scale={0.9} color="#6b8f71" />

          {/* Center-right cluster */}
          <PixelTree x={920} y={686} scale={1.4} color="#3d6b4f" />
          <PixelTree x={965} y={696} scale={1.1} color="#6b8f71" />
          <PixelTree x={1005} y={683} scale={1.5} color="#365f45" />

          {/* Right cluster */}
          <PixelTree x={1150} y={695} scale={1.2} color="#3d6b4f" />
          <PixelTree x={1195} y={682} scale={1.6} color="#6b8f71" />
          <PixelTree x={1240} y={696} scale={1.0} color="#3d6b4f" />
          <PixelTree x={1280} y={706} scale={1.3} color="#365f45" />
          <PixelTree x={1330} y={690} scale={1.1} color="#3d6b4f" />
          <PixelTree x={1370} y={700} scale={0.9} color="#6b8f71" />
        </g>

        {/* ── Layer 6: Ground plane / foreground terrain ─────────────── */}
        <g className="terrain-layer-near">
          <path
            d="M0,760 C200,740 400,755 600,745 C800,735 1000,752 1200,742 C1320,736 1400,748 1440,744 L1440,900 L0,900 Z"
            fill="url(#groundGradient)"
            opacity="0.5"
          />
          {/* Subtle grass texture strokes */}
          <path d="M0,790 C240,778 480,785 720,780 C960,775 1200,782 1440,778 L1440,900 L0,900 Z"
            fill="#c8bb9f" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}
