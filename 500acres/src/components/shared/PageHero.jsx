/**
 * PageHero — Reusable hero section for inner pages.
 *
 * Supports two modes:
 *   - Light (default): cream background with decorative blobs
 *   - Dark (isDark): charcoal background with blurred blobs and optional background image
 *
 * Props:
 *   title     — ReactNode for the h1 (can include <br/>, <span>, etc.)
 *   subtitle  — String for the paragraph below the heading
 *   pretitle  — String for the uppercase label above the heading
 *   image     — Optional background image URL (shown at low opacity)
 *   isDark    — Boolean to switch to dark-on-charcoal variant
 *   children  — Optional extra content rendered after subtitle
 */
export default function PageHero({ title, subtitle, pretitle, image, isDark, children }) {
  const textColor = isDark ? "text-cream" : "text-charcoal";
  const mutedColor = isDark ? "text-cream/70" : "text-charcoal/60";
  const scrollColor = isDark ? "text-cream/50" : "text-charcoal/50";
  const scrollBar = isDark ? "bg-cream/20" : "bg-charcoal/20";
  const scrollPulse = isDark ? "bg-cream/60" : "bg-charcoal/60";

  return (
    <section
      className={`relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28 overflow-hidden ${
        isDark ? "bg-charcoal" : ""
      }`}
    >
      {/* Background image (low opacity) */}
      {image && (
        <>
          <img
            src={image}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${
              isDark ? "opacity-20" : "opacity-15"
            }`}
          />
          <div
            className={`absolute inset-0 ${
              isDark
                ? "bg-gradient-to-b from-charcoal via-charcoal/80 to-charcoal/40"
                : "bg-gradient-to-b from-cream via-cream/80 to-cream/40"
            }`}
          />
        </>
      )}

      {/* Decorative blobs */}
      {isDark ? (
        <>
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-bark/20 blob pointer-events-none blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-[10%] right-[15%] w-[25vw] h-[25vw] bg-amber/15 blob pointer-events-none blur-3xl" style={{ animationDelay: "-3s" }} aria-hidden="true" />
          <div className="absolute top-[60%] left-[50%] w-[20vw] h-[20vw] bg-sage/10 blob pointer-events-none blur-3xl" style={{ animationDelay: "-6s" }} aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-sage/8 blob pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[20%] left-[-5%] w-[30vw] h-[30vw] bg-clay/6 blob pointer-events-none" style={{ animationDelay: "-4s" }} aria-hidden="true" />
        </>
      )}

      {/* Content */}
      <div className="page-container relative z-10">
        {pretitle && (
          <p className={`reveal-up font-sans text-xs uppercase tracking-[0.4em] ${mutedColor} mb-10`}>
            {pretitle}
          </p>
        )}
        <h1 className={`reveal-up stagger-1 hero-title text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold ${textColor} mb-8`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`reveal-up stagger-2 font-serif text-lg md:text-xl ${mutedColor} max-w-lg leading-[1.8]`}>
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {/* Scroll indicator */}
      <div className="reveal-up stagger-3 absolute bottom-16 right-[max(2.5rem,6vw)] flex flex-col items-center gap-2">
        <span className={`font-sans text-xs uppercase tracking-[0.3em] ${scrollColor} rotate-90 origin-center translate-y-8`}>
          Scroll
        </span>
        <div className={`w-[1px] h-16 ${scrollBar} mt-12`}>
          <div className={`w-full h-1/3 ${scrollPulse} animate-pulse`} />
        </div>
      </div>
    </section>
  );
}
