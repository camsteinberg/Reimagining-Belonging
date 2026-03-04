'use client';

import React from "react";
import Link from "next/link";

interface CTA {
  label: string;
  to?: string;
  href?: string;
  variant?: "primary" | "outline" | "text";
  external?: boolean;
}

interface CTABandProps {
  bg?: string;
  heading: React.ReactNode;
  description?: string;
  ctas?: CTA[];
  label?: string;
  diagonal?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * CTABand -- Full-width colored section with heading, description, and CTA buttons.
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
}: CTABandProps) {
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
              const isExternal = cta.external || cta.href;
              const destination = cta.href || cta.to || "/";

              if (cta.variant === "text") {
                if (isExternal) {
                  return (
                    <a
                      key={key}
                      href={destination}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-[0.2em] text-cream/70 hover:text-cream transition-colors duration-300"
                    >
                      {cta.label} <span aria-hidden="true">&rarr;</span>
                    </a>
                  );
                }
                return (
                  <Link
                    key={key}
                    href={destination}
                    className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-[0.2em] text-cream/70 hover:text-cream transition-colors duration-300"
                  >
                    {cta.label} <span aria-hidden="true">&rarr;</span>
                  </Link>
                );
              }

              if (cta.variant === "outline") {
                if (isExternal) {
                  return (
                    <a
                      key={key}
                      href={destination}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-transparent border-2 border-cream text-cream px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-cream/10"
                    >
                      {cta.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={key}
                    href={destination}
                    className="inline-block bg-transparent border-2 border-cream text-cream px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-cream/10"
                  >
                    {cta.label}
                  </Link>
                );
              }

              // Default: primary
              if (isExternal) {
                return (
                  <a
                    key={key}
                    href={destination}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-sage hover:text-cream"
                  >
                    {cta.label}
                  </a>
                );
              }
              return (
                <Link
                  key={key}
                  href={destination}
                  className="inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-sage hover:text-cream"
                >
                  {cta.label}
                </Link>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
