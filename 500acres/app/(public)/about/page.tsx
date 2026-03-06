'use client';

import Link from 'next/link';
import useReveal from '@/hooks/useReveal';
import Breadcrumbs from '@/components/public/shared/Breadcrumbs';
import SectionDivider from '@/components/public/shared/SectionDivider';
import pullquoteBarndo from '@/assets/photos/pullquote-barndo-storm.webp';

const ABOUT_CARDS = [
  {
    to: "/about/mission",
    title: "Our Mission",
    description:
      "Empty land becomes shelter, training becomes careers, and a new generation builds its way to homeownership.",
    accent: "forest" as const,
  },
  {
    to: "/about/team",
    title: "Our Team",
    description:
      "Meet the people building 500 Acres — from leadership to fellows, designers to builders.",
    accent: "amber" as const,
  },
  {
    to: "/about/sponsors",
    title: "Our Sponsors",
    description:
      "The organizations and partners supporting our mission to create pathways to housing and belonging.",
    accent: "clay" as const,
  },
  {
    to: "/about/white-paper",
    title: "White Paper",
    description:
      "The HABITABLE research paper — a deep dive into Gen Z housing, belonging, and the 500 Acres model.",
    accent: "sage" as const,
  },
];

const ACCENT_STYLES = {
  forest: {
    bg: "bg-forest/10",
    border: "border-forest/30",
    dot: "bg-forest",
    hover: "group-hover:border-forest/60",
  },
  amber: {
    bg: "bg-amber/10",
    border: "border-amber/30",
    dot: "bg-amber",
    hover: "group-hover:border-amber/60",
  },
  clay: {
    bg: "bg-clay/10",
    border: "border-clay/30",
    dot: "bg-clay",
    hover: "group-hover:border-clay/60",
  },
  sage: {
    bg: "bg-sage/10",
    border: "border-sage/30",
    dot: "bg-sage",
    hover: "group-hover:border-sage/60",
  },
};

export default function AboutLandingPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-end pb-14 md:pb-20 lg:pb-28">
        <img src={pullquoteBarndo.src} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/90 to-cream/60" />

        <div className="page-container relative z-10">
          <Breadcrumbs items={[{ label: "About" }]} />
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            About 500 Acres
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Learn about
            <br />
            <span className="text-forest">what we do.</span>
          </h1>
        </div>
      </section>

      {/* Full-bleed mission statement — dramatic typographic moment */}
      <section className="py-20 md:py-32 lg:py-40 overflow-hidden">
        <div className="page-container">
          <p className="reveal-clip-up font-display text-[clamp(2rem,5vw,4rem)] leading-[1.15] text-charcoal/10 font-bold max-w-5xl">
            We believe empty land near national parks can become homes,
            fellowship training can become careers, and a new generation
            can build its way to belonging.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Entry-point cards — asymmetric layout */}
      <section className="py-16 md:py-24 lg:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-12">
            Explore
          </p>

          {/* First card — full-width hero card */}
          {(() => {
            const card = ABOUT_CARDS[0];
            const style = ACCENT_STYLES[card.accent];
            return (
              <Link
                href={card.to}
                className={`reveal-scale stagger-1 group relative block rounded-2xl p-10 md:p-14 lg:p-20 border ${style.border} ${style.bg} ${style.hover} transition-all duration-500 hover:-translate-y-2 hover:shadow-lg mb-8 md:mb-10 overflow-hidden`}
              >
                <span className="num-accent font-display text-[8rem] md:text-[12rem] absolute -top-6 -right-2 md:right-4 select-none pointer-events-none" aria-hidden="true">01</span>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal mb-4 group-hover:translate-x-2 transition-transform duration-300">
                    {card.title}
                  </h2>
                  <p className="font-serif text-lg md:text-xl text-charcoal/60 leading-[1.8] max-w-xl">
                    {card.description}
                  </p>
                  <div className="mt-8 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50 group-hover:text-charcoal transition-colors">
                    <span>Read more</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">
                      &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })()}

          {/* Remaining 3 cards — 3-column row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {ABOUT_CARDS.slice(1).map((card, i) => {
              const style = ACCENT_STYLES[card.accent];
              const num = String(i + 2).padStart(2, '0');
              return (
                <Link
                  key={card.to}
                  href={card.to}
                  className={`reveal-scale stagger-${i + 2} group relative block rounded-2xl p-10 md:p-14 border ${style.border} ${style.bg} ${style.hover} transition-all duration-500 hover:-translate-y-2 hover:shadow-lg overflow-hidden`}
                >
                  <span className="num-accent font-display text-[6rem] md:text-[8rem] absolute -top-4 -right-1 md:right-2 select-none pointer-events-none" aria-hidden="true">{num}</span>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-4 group-hover:translate-x-2 transition-transform duration-300">
                      {card.title}
                    </h2>
                    <p className="font-serif text-base text-charcoal/60 leading-[1.8]">
                      {card.description}
                    </p>
                    <div className="mt-8 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50 group-hover:text-charcoal transition-colors">
                      <span>Read more</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
