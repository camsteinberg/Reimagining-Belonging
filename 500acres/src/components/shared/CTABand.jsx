import { Link } from "react-router-dom";

/**
 * CTABand — Full-width colored section with heading, description, and CTA buttons.
 *
 * Props:
 *   bg          — Tailwind bg class (e.g., "bg-forest", "bg-bark", "bg-charcoal")
 *   heading     — Heading text (string or ReactNode)
 *   description — Body text below heading
 *   ctas        — Array of CTA objects:
 *                  { label, to, href, variant: "primary"|"outline"|"text", external }
 *   label       — Optional pretitle label above heading
 *   diagonal    — If true, applies "diagonal-top" class
 *   className   — Additional section classes
 *   children    — Optional content rendered after CTAs
 */
export default function CTABand({
  bg = "bg-moss",
  heading,
  description,
  ctas = [],
  label,
  diagonal = false,
  className = "",
  children,
}) {
  return (
    <section
      className={`relative py-16 md:py-24 lg:py-36 ${bg} overflow-hidden${diagonal ? " diagonal-top" : ""} ${className}`}
    >
      <div className="page-container relative z-10 text-center">
        {label && (
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/70 mb-10">
            {label}
          </p>
        )}
        <h2 className="reveal-up font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-cream mb-6">
          {heading}
        </h2>
        {description && (
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/70 mb-10 max-w-xl mx-auto">
            {description}
          </p>
        )}
        {ctas.length > 0 && (
          <div className="reveal-up stagger-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {ctas.map((cta) => {
              const key = cta.label;

              if (cta.variant === "text") {
                const El = cta.external || cta.href ? "a" : Link;
                const linkProps = cta.external || cta.href
                  ? { href: cta.href || cta.to, target: "_blank", rel: "noopener noreferrer" }
                  : { to: cta.to };
                return (
                  <El
                    key={key}
                    {...linkProps}
                    className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-[0.2em] text-cream/70 hover:text-cream transition-colors duration-300"
                  >
                    {cta.label} <span aria-hidden="true">&rarr;</span>
                  </El>
                );
              }

              if (cta.variant === "outline") {
                const El = cta.external || cta.href ? "a" : Link;
                const linkProps = cta.external || cta.href
                  ? { href: cta.href || cta.to, target: "_blank", rel: "noopener noreferrer" }
                  : { to: cta.to };
                return (
                  <El
                    key={key}
                    {...linkProps}
                    className="inline-block bg-transparent border-2 border-cream text-cream px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-cream/10"
                  >
                    {cta.label}
                  </El>
                );
              }

              // Default: primary
              const El = cta.external || cta.href ? "a" : Link;
              const linkProps = cta.external || cta.href
                ? { href: cta.href || cta.to, target: "_blank", rel: "noopener noreferrer" }
                : { to: cta.to };
              return (
                <El
                  key={key}
                  {...linkProps}
                  className="inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-sage hover:text-cream"
                >
                  {cta.label}
                </El>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
