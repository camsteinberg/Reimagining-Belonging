import { useState, useRef } from "react";
import useReveal from "../hooks/useReveal";

const CATEGORIES = [
  "All",
  "Financial Literacy",
  "Housing Rights",
  "Community Building",
  "Policy & Advocacy",
];

const RESOURCES = [
  {
    title: "First-Time Homebuyer Guide",
    category: "Financial Literacy",
    description:
      "A comprehensive guide to understanding mortgages, down payments, and the home buying process for Gen Z.",
    type: "Guide",
    accent: "bg-amber/10 border-amber/30",
    accentDot: "bg-amber",
  },
  {
    title: "Know Your Tenant Rights",
    category: "Housing Rights",
    description:
      "State-by-state overview of tenant protections, eviction procedures, and how to advocate for yourself.",
    type: "Toolkit",
    accent: "bg-clay/10 border-clay/30",
    accentDot: "bg-clay",
  },
  {
    title: "Building Community Spaces",
    category: "Community Building",
    description:
      "How to create and maintain third places that foster belonging and connection in your neighborhood.",
    type: "Article",
    accent: "bg-sage/10 border-sage/30",
    accentDot: "bg-sage",
  },
  {
    title: "Housing Policy 101",
    category: "Policy & Advocacy",
    description:
      "Understanding zoning, affordable housing policy, and how young people can influence housing decisions.",
    type: "Course",
    accent: "bg-navy/10 border-navy/30",
    accentDot: "bg-navy",
  },
  {
    title: "Budgeting for Housing",
    category: "Financial Literacy",
    description:
      "Practical budgeting strategies for saving toward housing while managing student debt and rising costs.",
    type: "Toolkit",
    accent: "bg-amber/10 border-amber/30",
    accentDot: "bg-amber",
  },
  {
    title: "Community Land Trusts",
    category: "Community Building",
    description:
      "How community land trusts work and why they matter for equitable, affordable housing.",
    type: "Article",
    accent: "bg-sage/10 border-sage/30",
    accentDot: "bg-sage",
  },
];

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const ref = useReveal();
  const gridRef = useRef(null);

  const filtered =
    activeCategory === "All"
      ? RESOURCES
      : RESOURCES.filter((r) => r.category === activeCategory);

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        <div className="absolute top-[15%] left-[-8%] w-[40vw] h-[40vw] bg-navy/5 blob pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-5%] w-[25vw] h-[25vw] bg-forest/5 blob pointer-events-none" style={{ animationDelay: "-3s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-10">
            Resources
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Tools for
            <br />
            <span className="text-forest">building futures.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/50 max-w-md leading-relaxed">
            Curated guides, toolkits, and educational content to help you navigate
            the housing landscape.
          </p>
        </div>
      </section>

      {/* Running marquee of categories */}
      <div className="py-6 border-y border-charcoal/10 overflow-hidden">
        <div className="marquee-track">
          {[...Array(3)].map((_, setIdx) =>
            CATEGORIES.filter((c) => c !== "All").map((cat, i) => (
              <span
                key={`${setIdx}-${i}`}
                className="font-sans text-sm uppercase tracking-[0.3em] text-charcoal/20 whitespace-nowrap px-10"
              >
                {cat} &#x2022;
              </span>
            ))
          )}
        </div>
      </div>

      {/* Filter + Grid */}
      <section className="py-16 md:py-24">
        <div className="page-container">
          {/* Category pills */}
          <div className="reveal-up flex flex-wrap gap-3 mb-12 md:mb-16">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-sans text-sm tracking-wide transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-charcoal text-cream scale-105"
                    : "bg-transparent border border-charcoal/20 text-charcoal/60 hover:border-charcoal/50 hover:text-charcoal"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Resource cards — bento grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((resource, i) => (
              <div
                key={resource.title}
                className={`reveal-up stagger-${(i % 4) + 1} group relative p-6 md:p-8 rounded-2xl border ${resource.accent}
                  transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer
                  ${i === 0 && filtered.length > 2 ? "md:col-span-2 md:row-span-1" : ""}`}
              >
                {/* Decorative number */}
                <span className="absolute top-6 right-8 font-sans text-5xl font-bold text-charcoal/[0.03]">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-2 rounded-full ${resource.accentDot}`} />
                  <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/40">
                    {resource.category}
                  </span>
                </div>

                <h3 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-3 group-hover:text-forest transition-colors">
                  {resource.title}
                </h3>

                <p className="font-serif text-base text-charcoal/60 leading-relaxed mb-6">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs uppercase tracking-wider bg-charcoal/5 px-4 py-2 rounded-full text-charcoal/50">
                    {resource.type}
                  </span>
                  <span className="font-sans text-sm text-charcoal/30 group-hover:text-forest group-hover:translate-x-1 transition-all duration-300">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners section */}
      <section className="py-24 md:py-36 bg-charcoal diagonal-top">
        <div className="page-container text-center">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/40 mb-4">
            Our Partners
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-cream mb-6">
            Building together.
          </h2>
          <p className="reveal-up stagger-2 font-serif text-lg text-cream/50 max-w-xl mx-auto mb-16">
            We collaborate with organizations that share our vision for equitable housing and Gen Z empowerment.
          </p>
          <div className="reveal-up stagger-3 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 items-center opacity-40">
            {["Partner A", "Partner B", "Partner C", "Partner D"].map((p) => (
              <div
                key={p}
                className="font-sans text-sm uppercase tracking-widest text-cream/60 py-8 border border-cream/10 rounded-xl hover:border-cream/30 transition-colors"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
