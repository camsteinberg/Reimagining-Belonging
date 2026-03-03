/**
 * PullQuote — Reusable blockquote component with three variants.
 *
 * Props:
 *   quote       — Quote text (string)
 *   attribution — Optional attribution (e.g., "— HABITABLE White Paper")
 *   variant     — "centered" (default) | "dark" | "bordered"
 *   bg          — Override background class (default varies by variant)
 *   accentColor — Accent bar color for "bordered" variant (default "bg-forest/40")
 *   reveal      — Reveal animation class (default "reveal-scale")
 *   className   — Additional section classes
 *   children    — Optional content rendered after the quote
 */
export default function PullQuote({
  quote,
  attribution,
  variant = "centered",
  bg,
  accentColor = "bg-forest/40",
  reveal = "reveal-scale",
  className = "",
  children,
}) {
  if (variant === "dark") {
    return (
      <section
        className={`py-20 md:py-28 ${bg || "bg-charcoal"} overflow-hidden ${className}`}
      >
        <div className="page-container max-w-4xl mx-auto text-center">
          <blockquote className={reveal}>
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-cream leading-[1.5] font-bold italic">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>
          {attribution && (
            <p className={`${reveal} stagger-1 font-sans text-xs uppercase tracking-[0.3em] text-cream/40 mt-6`}>
              {attribution}
            </p>
          )}
          {children}
        </div>
      </section>
    );
  }

  if (variant === "bordered") {
    return (
      <section
        className={`py-16 md:py-20 ${bg || ""} ${className}`}
      >
        <div className="page-container max-w-3xl">
          <div className={`${reveal} flex gap-6 items-start`}>
            <div
              className={`w-1 shrink-0 self-stretch ${accentColor} rounded-full`}
            />
            <div>
              <blockquote className="font-serif text-xl md:text-2xl text-charcoal/80 leading-[1.6] italic mb-4">
                &ldquo;{quote}&rdquo;
              </blockquote>
              {attribution && (
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/40">
                  {attribution}
                </p>
              )}
              {children}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default: "centered"
  return (
    <section
      className={`py-16 md:py-20 ${bg || ""} ${className}`}
    >
      <div className="page-container max-w-3xl mx-auto text-center">
        <blockquote className={reveal}>
          <p className="font-serif text-xl md:text-2xl text-charcoal/80 leading-[1.6] italic">
            &ldquo;{quote}&rdquo;
          </p>
        </blockquote>
        {attribution && (
          <p className={`${reveal} stagger-1 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/40 mt-6`}>
            {attribution}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
