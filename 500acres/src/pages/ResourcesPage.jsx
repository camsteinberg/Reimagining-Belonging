import { useState, useRef } from "react";
import useReveal from "../hooks/useReveal";
import resourcesHero from "../assets/photos/resources-hero-ranch.webp";

/* ───────────────────────────── Constants ───────────────────────────── */

const CATEGORIES = [
  "All",
  "Financial Literacy",
  "Housing Rights",
  "Community Building",
  "Policy & Advocacy",
  "Alternative Building",
];

const FEATURED_RESOURCE = {
  title: "Habitable: The New Science of Housing",
  category: "Research",
  description:
    "The foundational white paper from 500 Acres exploring how underutilized land near national parks can be transformed into workforce housing through digital fabrication, fellowship training, and Qualified Opportunity Zone investment. Published December 2025.",
  type: "White Paper",
  link: "#",
  accent: "bg-forest/10 border-forest/30",
  accentDot: "bg-forest",
  cta: "Read the paper",
};

const RESOURCES = [
  {
    title: "First-Time Homebuyer Guide",
    category: "Financial Literacy",
    description:
      "A comprehensive guide to understanding mortgages, down payments, and the home buying process -- written with Gen Z in mind.",
    type: "Guide",
    link: "https://www.consumerfinance.gov/owning-a-home/",
    accent: "bg-amber/10 border-amber/30",
    accentDot: "bg-amber",
  },
  {
    title: "Know Your Tenant Rights",
    category: "Housing Rights",
    description:
      "State-by-state overview of tenant protections, eviction procedures, and how to advocate for yourself as a renter.",
    type: "Toolkit",
    link: "https://www.hud.gov/topics/rental_assistance",
    accent: "bg-clay/10 border-clay/30",
    accentDot: "bg-clay",
  },
  {
    title: "Community Land Trusts Explained",
    category: "Community Building",
    description:
      "How community land trusts keep housing permanently affordable by separating the ownership of land from the homes built on it.",
    type: "Article",
    link: "https://groundedsolutions.org/strengthening-neighborhoods/community-land-trusts",
    accent: "bg-sage/10 border-sage/30",
    accentDot: "bg-sage",
  },
  {
    title: "Housing Policy 101",
    category: "Policy & Advocacy",
    description:
      "Understanding zoning, affordable housing policy, and how young people can influence the decisions that shape their communities.",
    type: "Course",
    link: "https://www.nlihc.org/explore-issues",
    accent: "bg-navy/10 border-navy/30",
    accentDot: "bg-navy",
  },
  {
    title: "Budgeting for Housing on a Gen Z Income",
    category: "Financial Literacy",
    description:
      "Practical budgeting strategies for saving toward housing while managing student debt, gig income, and rising costs of living.",
    type: "Toolkit",
    link: "https://www.nerdwallet.com/article/finance/how-to-budget",
    accent: "bg-amber/10 border-amber/30",
    accentDot: "bg-amber",
  },
  {
    title: "Building Third Places in Rural Communities",
    category: "Community Building",
    description:
      "How to create gathering spaces -- from community gardens to maker workshops -- that foster belonging in small towns and rural areas.",
    type: "Article",
    link: "https://www.ruralhome.org/our-initiatives/",
    accent: "bg-sage/10 border-sage/30",
    accentDot: "bg-sage",
  },
  {
    title: "Cob, Straw Bale & Earthship: Alternative Building Methods",
    category: "Alternative Building",
    description:
      "An introduction to natural and alternative building techniques that lower costs, reduce environmental impact, and reconnect us with the land.",
    type: "Guide",
    link: "https://www.buildnaturally.com/",
    accent: "bg-moss/10 border-moss/30",
    accentDot: "bg-moss",
  },
  {
    title: "Rural Housing Assistance Programs",
    category: "Financial Literacy",
    description:
      "A directory of USDA and state-level programs that help young people afford housing in rural areas -- from direct loans to repair grants.",
    type: "Directory",
    link: "https://www.rd.usda.gov/programs-services/single-family-housing-programs",
    accent: "bg-amber/10 border-amber/30",
    accentDot: "bg-amber",
  },
  {
    title: "YIMBY Advocacy Toolkit for Young People",
    category: "Policy & Advocacy",
    description:
      "Step-by-step guidance for attending city council meetings, writing public comment letters, and organizing around pro-housing policy in your town.",
    type: "Toolkit",
    link: "https://yimbyaction.org/resources/",
    accent: "bg-navy/10 border-navy/30",
    accentDot: "bg-navy",
  },
  {
    title: "Tiny Homes & ADUs: Right-Sizing for a New Generation",
    category: "Alternative Building",
    description:
      "How accessory dwelling units and tiny homes are opening up affordable pathways to ownership -- and the zoning battles still ahead.",
    type: "Article",
    link: "https://www.aarp.org/livable-communities/housing/info-2019/accessory-dwelling-units-702.html",
    accent: "bg-moss/10 border-moss/30",
    accentDot: "bg-moss",
  },
];


/* ───────────────────────────── Component ───────────────────────────── */

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
        <img src={resourcesHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-12" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
        <div className="absolute top-[15%] left-[-8%] w-[40vw] h-[40vw] bg-sage/5 blob pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-5%] w-[25vw] h-[25vw] bg-forest/5 blob pointer-events-none" style={{ animationDelay: "-3s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            Resources
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Research, tools,
            <br />
            <span className="text-forest">and frameworks.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/70 max-w-md leading-[1.8]">
            Publications, guides, and resources to understand the housing
            landscape — and the tools 500 Acres is building to change it.
          </p>
        </div>
      </section>

      {/* Featured Resource */}
      <section className="py-24 md:py-32 bg-forest/[0.03]">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-8">
            Featured
          </p>
          <a
            href={FEATURED_RESOURCE.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`reveal-up stagger-1 group relative block p-10 md:p-16 lg:p-20 rounded-2xl border ${FEATURED_RESOURCE.accent}
              transition-all duration-500 hover:-translate-y-2 hover:shadow-xl`}
          >
            {/* Decorative element */}
            <span className="absolute top-8 right-10 font-sans text-7xl md:text-8xl font-bold text-charcoal/[0.03]">
              *
            </span>

            <div className="flex items-center gap-3 mb-10">
              <div className={`w-2.5 h-2.5 rounded-full ${FEATURED_RESOURCE.accentDot}`} />
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/60">
                {FEATURED_RESOURCE.category}
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl font-bold text-charcoal mb-8 group-hover:text-forest transition-colors max-w-2xl">
              {FEATURED_RESOURCE.title}
            </h2>

            <p className="font-serif text-base md:text-lg text-charcoal/60 leading-[1.85] mb-12 max-w-2xl">
              {FEATURED_RESOURCE.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="font-sans text-xs uppercase tracking-wider bg-charcoal/5 px-4 py-2 rounded-full text-charcoal/70">
                {FEATURED_RESOURCE.type}
              </span>
              <span className="font-sans text-sm text-forest/60 group-hover:text-forest group-hover:translate-x-2 transition-all duration-300 flex items-center gap-2">
                {FEATURED_RESOURCE.cta || "Read more"} <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* Running marquee of categories */}
      <div className="py-6 border-y border-charcoal/10 overflow-hidden">
        <div className="marquee-track">
          {[...Array(3)].map((_, setIdx) =>
            CATEGORIES.filter((c) => c !== "All").map((cat, i) => (
              <span
                key={`${setIdx}-${i}`}
                className="font-sans text-sm uppercase tracking-[0.3em] text-charcoal/60 whitespace-nowrap px-10"
              >
                {cat} &#x2022;
              </span>
            ))
          )}
        </div>
      </div>

      {/* Filter + Grid */}
      <section className="py-20 md:py-28">
        <div className="page-container">
          {/* Category pills */}
          <div className="reveal-up flex flex-wrap gap-3 mb-14 md:mb-20" role="tablist" aria-label="Filter resources by category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
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

          {/* Resource cards -- bento grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filtered.map((resource, i) => (
              <a
                key={resource.title}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`reveal-up stagger-${(i % 4) + 1} group relative p-10 md:p-14 rounded-2xl border ${resource.accent}
                  transition-all duration-500 hover:-translate-y-2 hover:shadow-xl
                  ${i === 0 && filtered.length > 2 ? "md:col-span-2 md:row-span-1" : ""}`}
              >
                {/* Decorative number */}
                <span className="absolute top-6 right-8 font-sans text-5xl font-bold text-charcoal/[0.03]">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex items-center gap-3 mb-10">
                  <div className={`w-2 h-2 rounded-full ${resource.accentDot}`} />
                  <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/60">
                    {resource.category}
                  </span>
                </div>

                <h2 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-6 group-hover:text-forest transition-colors">
                  {resource.title}
                </h2>

                <p className="font-serif text-base text-charcoal/60 leading-[1.8] mb-10 max-w-md">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs uppercase tracking-wider bg-charcoal/5 px-4 py-2 rounded-full text-charcoal/70">
                    {resource.type}
                  </span>
                  <span className="font-sans text-sm text-charcoal/50 group-hover:text-forest group-hover:translate-x-1 transition-all duration-300" aria-hidden="true">
                    &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
