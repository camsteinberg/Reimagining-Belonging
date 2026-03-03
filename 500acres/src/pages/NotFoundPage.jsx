import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";

const SUGGESTED_PAGES = [
  {
    to: "/about/mission",
    title: "Our Mission",
    description: "Learn how 500 Acres transforms land into housing and opportunity.",
    accent: "forest",
  },
  {
    to: "/stories",
    title: "Stories",
    description: "Hear from Gen Z about housing, belonging, and what home means.",
    accent: "amber",
  },
  {
    to: "/resources",
    title: "Resources",
    description: "Tools, research, and references for housing innovation.",
    accent: "sage",
  },
  {
    to: "/get-involved",
    title: "Get Involved",
    description: "Apply for a fellowship, volunteer, or support the mission.",
    accent: "clay",
  },
];

const ACCENT_BG = {
  forest: "bg-forest/10 border-forest/30",
  amber: "bg-amber/10 border-amber/30",
  sage: "bg-sage/10 border-sage/30",
  clay: "bg-clay/10 border-clay/30",
};

export default function NotFoundPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-sage/8 blob pointer-events-none blur-2xl" aria-hidden="true" />
      <div className="absolute bottom-[15%] right-[10%] w-[20vw] h-[20vw] bg-amber/10 blob pointer-events-none blur-2xl" style={{ animationDelay: "-3s" }} aria-hidden="true" />

      {/* Hero section */}
      <div className="relative z-10 pt-40 md:pt-52 pb-16 text-center page-container">
        <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/50 mb-8">
          Page Not Found
        </p>
        <h1 className="reveal-up stagger-1 font-serif text-[clamp(5rem,15vw,12rem)] leading-none font-bold text-charcoal/10 mb-4">
          404
        </h1>
        <p className="reveal-up stagger-2 font-serif text-xl md:text-2xl text-charcoal/60 mb-4 max-w-md mx-auto leading-[1.8]">
          This path doesn't lead anywhere yet.
        </p>
        <p className="reveal-up stagger-3 font-serif text-base text-charcoal/60 mb-10 max-w-sm mx-auto">
          But there are plenty of trails to explore.
        </p>
        <Link
          to="/"
          className="reveal-up stagger-4 group inline-flex items-center gap-3 bg-charcoal text-cream px-8 py-4 rounded-full font-serif text-lg transition-all duration-300 hover:bg-forest hover:gap-5"
        >
          <span>Back to Home</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {/* Divider */}
      <div className="page-container relative z-10">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* You might be looking for... */}
      <div className="relative z-10 page-container pb-32 pt-16">
        <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/50 mb-10">
          You might be looking for
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SUGGESTED_PAGES.map((page, i) => (
            <Link
              key={page.to}
              to={page.to}
              className={`reveal-up stagger-${(i % 4) + 1} group block rounded-2xl p-8 border ${ACCENT_BG[page.accent]} transition-all duration-500 hover:-translate-y-2 hover:shadow-lg`}
            >
              <h2 className="font-serif text-xl font-bold text-charcoal mb-2 group-hover:translate-x-1 transition-transform duration-300">
                {page.title}
              </h2>
              <p className="font-serif text-sm text-charcoal/60 leading-[1.8]">
                {page.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.3em] text-charcoal/40 group-hover:text-charcoal/70 transition-colors">
                Visit
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
