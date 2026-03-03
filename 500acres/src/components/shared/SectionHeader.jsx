import { Link } from "react-router-dom";

/**
 * SectionHeader — Reusable section intro pattern.
 *
 * Props:
 *   label       — Uppercase pretitle label (e.g., "Our Mission")
 *   title       — Heading text (string or ReactNode for <br/>, <span>, etc.)
 *   description — Optional subtitle paragraph
 *   align       — "center" | "left" (default "left")
 *   headingSize — "lg" | "xl" (default "xl" → text-3xl md:text-5xl)
 *   maxWidth    — Tailwind max-w class for description (default "max-w-2xl")
 *   reveal      — Reveal class prefix (default "reveal-up")
 *   className   — Additional wrapper classes
 */
export default function SectionHeader({
  label,
  title,
  description,
  align = "left",
  headingSize = "xl",
  maxWidth = "max-w-2xl",
  reveal = "reveal-up",
  className = "",
}) {
  const isCenter = align === "center";
  const headingCls =
    headingSize === "lg"
      ? "font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15]"
      : "font-serif text-3xl md:text-5xl font-bold text-charcoal";

  return (
    <div
      className={`${isCenter ? "text-center" : ""} ${className}`}
    >
      {label && (
        <p
          className={`${reveal} font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4`}
        >
          {label}
        </p>
      )}
      <h2
        className={`${reveal} stagger-1 ${headingCls}${description ? " mb-4" : ""}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`${reveal} stagger-2 font-serif text-lg text-charcoal/60 ${maxWidth}${isCenter ? " mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
