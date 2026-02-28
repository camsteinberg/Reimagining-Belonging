import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import Breadcrumbs from "../components/shared/Breadcrumbs";

const ABOUT_CARDS = [
  {
    to: "/about/mission",
    title: "Our Mission",
    description:
      "Empty land becomes shelter, training becomes careers, and a new generation builds its way to homeownership.",
    accent: "forest",
  },
  {
    to: "/about/team",
    title: "Our Team",
    description:
      "Meet the people building 500 Acres — from leadership to fellows, designers to builders.",
    accent: "amber",
  },
  {
    to: "/about/sponsors",
    title: "Our Sponsors",
    description:
      "The organizations and partners supporting our mission to create pathways to housing and belonging.",
    accent: "clay",
  },
  {
    to: "/about/white-paper",
    title: "White Paper",
    description:
      "The HABITABLE research paper — a deep dive into Gen Z housing, belonging, and the 500 Acres model.",
    accent: "sage",
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
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        {/* Decorative blobs */}
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-sage/8 blob pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30vw] h-[30vw] bg-amber/6 blob pointer-events-none" style={{ animationDelay: "-4s" }} aria-hidden="true" />

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
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/60 max-w-lg">
            Explore our mission, meet the team, discover our partners, and read
            the research driving 500 Acres forward.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="reveal-up stagger-3 absolute bottom-16 right-[max(2.5rem,6vw)] flex flex-col items-center gap-2">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50 rotate-90 origin-center translate-y-8">
            Scroll
          </span>
          <div className="w-[1px] h-16 bg-charcoal/20 mt-12">
            <div className="w-full h-1/3 bg-charcoal/60 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* Entry-point cards */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-12">
            Explore
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {ABOUT_CARDS.map((card, i) => {
              const style = ACCENT_STYLES[card.accent];
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className={`reveal-up stagger-${i + 1} group block rounded-3xl p-10 md:p-14 border-2 ${style.border} ${style.bg} ${style.hover} transition-all duration-500 hover:-translate-y-3 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <span className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-4 group-hover:translate-x-2 transition-transform duration-300">
                    {card.title}
                  </h2>
                  <p className="font-serif text-base text-charcoal/60 leading-relaxed card-prose">
                    {card.description}
                  </p>
                  <div className="mt-8 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50 group-hover:text-charcoal transition-colors">
                    <span>Read more</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">
                      &rarr;
                    </span>
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
