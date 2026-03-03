import { Link } from "react-router-dom";
import { participants } from "../data/participants";
import useReveal from "../hooks/useReveal";
import storiesHero from "../assets/photos/stories-hero-barn.webp";
import SectionDivider from "../components/shared/SectionDivider";
import CTABand from "../components/shared/CTABand";

/* Theme tags assigned per participant based on their story content */
const THEME_TAGS = {
  sherry: ["Housing Insecurity", "Optional Engagement", "Gen Z Experience"],
  klyee: ["Found Community", "Design for Belonging", "Sensory Environments"],
  lexi: ["Global Belonging", "Routine & Ritual", "Found Community"],
  michaella: ["Third Places", "Housing Insecurity", "Gen Z Experience"],
  oliver: ["Maker Culture", "Inclusive Spaces", "Gen Z Experience"],
  joy: ["Housing Insecurity", "Cultural Identity", "Urban Life"],
  fy: ["Introvert Belonging", "Language & Identity", "Online Community"],
};

const TAG_COLORS = {
  "Housing Insecurity": "bg-ember/10 text-ember",
  "Gen Z Experience": "bg-amber/10 text-amber",
  "Found Community": "bg-sage/10 text-sage",
  "Design for Belonging": "bg-forest/10 text-forest",
  "Optional Engagement": "bg-clay/10 text-clay",
  "Sensory Environments": "bg-moss/10 text-moss",
  "Global Belonging": "bg-navy/10 text-navy",
  "Routine & Ritual": "bg-bark/10 text-bark",
  "Third Places": "bg-sage/10 text-sage",
  "Maker Culture": "bg-amber/10 text-amber",
  "Inclusive Spaces": "bg-forest/10 text-forest",
  "Cultural Identity": "bg-clay/10 text-clay",
  "Urban Life": "bg-bark/10 text-bark",
  "Introvert Belonging": "bg-moss/10 text-moss",
  "Language & Identity": "bg-navy/10 text-navy",
  "Online Community": "bg-ember/10 text-ember",
};

const CARD_ACCENTS = ["#6b8f71", "#5c3d2e", "#3d6b4f", "#365f45", "#d4a84b", "#b8755d", "#c45d3e"];

/* Indices 0 and 3 (Sherry and Michaella) are featured — larger cards */
const FEATURED_INDICES = [0, 3];

/* Pick a random spotlight participant for the quote section */
const SPOTLIGHT_INDEX = Math.floor(Math.random() * participants.length);
const SPOTLIGHT = participants[SPOTLIGHT_INDEX];

function FeaturedStoryCard({ participant, index }) {
  const svgUrl = new URL(
    `../assets/svg/${participant.svgIndex}inline.svg`,
    import.meta.url
  ).href;
  const tags = THEME_TAGS[participant.slug] || [];

  return (
    <Link
      to={`/stories/${participant.slug}`}
      aria-label={`Read ${participant.name}'s story`}
      className={`reveal-up stagger-${(index % 4) + 1} story-card group relative rounded-2xl overflow-hidden border border-charcoal/8 bg-warm-white md:col-span-2 lg:col-span-2`}
    >
      {/* Top accent line */}
      <div
        className="h-1.5 w-full transition-all duration-500 group-hover:h-2.5"
        style={{ background: CARD_ACCENTS[index] }}
        aria-hidden="true"
      />

      <div className="p-8 md:p-14 flex flex-col md:flex-row gap-8 md:gap-12">
        {/* SVG portrait — larger for featured */}
        <div className="flex-shrink-0 flex justify-center md:justify-start items-center">
          <img
            src={svgUrl}
            alt={`Portrait illustration of ${participant.name}`}
            loading="lazy"
            decoding="async"
            className="w-40 h-28 md:w-52 md:h-36 object-contain transition-all duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/20 mb-3" aria-hidden="true">
            Participant {String(index + 1).padStart(2, "0")}
          </span>

          <h2 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-1 group-hover:text-forest transition-colors">
            {participant.name}
          </h2>
          <p className="font-sans text-xs text-charcoal/60 mb-5 tracking-wide">
            {participant.age} · {participant.location}
          </p>

          {/* Belonging quote — amplified for featured card */}
          <blockquote className="font-serif text-lg md:text-xl text-charcoal/80 italic leading-[1.6] mb-6">
            "{participant.belongingQuote}"
          </blockquote>

          {/* Theme tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`inline-block px-3 py-1 rounded-full text-xs font-sans tracking-wide ${TAG_COLORS[tag] || "bg-charcoal/5 text-charcoal/60"}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Read more arrow */}
          <div className="mt-auto flex items-center gap-2 text-charcoal/60 group-hover:text-forest transition-all duration-300">
            <span className="font-sans text-xs uppercase tracking-wider">Read story</span>
            <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StoryCard({ participant, index }) {
  const svgUrl = new URL(
    `../assets/svg/${participant.svgIndex}inline.svg`,
    import.meta.url
  ).href;
  const tags = THEME_TAGS[participant.slug] || [];

  return (
    <Link
      to={`/stories/${participant.slug}`}
      aria-label={`Read ${participant.name}'s story`}
      className={`reveal-up stagger-${(index % 4) + 1} story-card group relative rounded-2xl overflow-hidden border border-charcoal/8 bg-warm-white`}
    >
      {/* Top accent line */}
      <div
        className="h-1 w-full transition-all duration-500 group-hover:h-2"
        style={{ background: CARD_ACCENTS[index] }}
        aria-hidden="true"
      />

      <div className="p-8 md:p-12 flex flex-col">
        {/* Participant number */}
        <span className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/20 mb-auto" aria-hidden="true">
          Participant {String(index + 1).padStart(2, "0")}
        </span>

        {/* SVG portrait */}
        <div className="my-8 flex justify-center">
          <img
            src={svgUrl}
            alt={`Portrait illustration of ${participant.name}`}
            className="w-32 h-20 md:w-40 md:h-24 object-contain transition-all duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Info */}
        <div className="mt-auto">
          <h2 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-1 group-hover:text-forest transition-colors">
            {participant.name}
          </h2>
          <p className="font-sans text-xs text-charcoal/60 mb-4 tracking-wide">
            {participant.age} · {participant.location}
          </p>

          {/* Belonging quote — amplified */}
          <p className="font-serif text-base md:text-lg text-charcoal/70 italic leading-[1.6] mb-5">
            "{participant.belongingQuote}"
          </p>

          {/* Theme tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-sans tracking-wide ${TAG_COLORS[tag] || "bg-charcoal/5 text-charcoal/60"}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Read more arrow */}
          <div className="mt-6 flex items-center gap-2 text-charcoal/60 group-hover:text-forest transition-all duration-300">
            <span className="font-sans text-xs uppercase tracking-wider">Read story</span>
            <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StoriesPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero — shorter to get to content faster */}
      <section className="relative min-h-[70vh] flex flex-col justify-end pb-20 md:pb-28">
        <img src={storiesHero} alt="Historic barn in pastoral landscape" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
        <div className="absolute top-[20%] right-[5%] w-[35vw] h-[35vw] bg-clay/5 blob pointer-events-none" aria-hidden="true" />

        <div className="page-container relative z-10">
          <p className="reveal-clip-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            Stories
          </p>
          <h1 className="reveal-clip-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Seven voices,
            <br />
            <span className="italic text-forest">one vision.</span>
          </h1>
          <p className="reveal-clip-up stagger-2 font-serif text-lg md:text-xl text-charcoal/70 max-w-md leading-[1.8]">
            Gen Z participants shared their stories, drawings, and visions
            of home as part of the Reimagining Belonging research project.
            Their insights shaped the 500 Acres model — here's what they said.
          </p>
        </div>
      </section>

      <SectionDivider variant="dot" />

      {/* Spotlight Quote — dark inset section */}
      <section className="bg-charcoal section-inset py-20 md:py-28 overflow-hidden">
        <div className="page-container max-w-4xl mx-auto text-center">
          <blockquote className="reveal-clip-up">
            <p className="font-serif text-2xl md:text-4xl italic text-cream leading-[1.5]">
              "{SPOTLIGHT.belongingQuote}"
            </p>
          </blockquote>
          <Link
            to={`/stories/${SPOTLIGHT.slug}`}
            className="reveal-up stagger-2 inline-flex items-center gap-3 mt-10 font-sans text-sm uppercase tracking-[0.3em] text-cream/60 hover:text-cream transition-colors"
          >
            <span>— {SPOTLIGHT.name}</span>
            <span className="transition-transform duration-300 hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      <SectionDivider variant="space" />

      {/* Participant grid — masonry/staggered layout with featured cards */}
      <section className="pb-24 md:pb-32">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {participants.map((p, i) => {
              if (FEATURED_INDICES.includes(i)) {
                return (
                  <FeaturedStoryCard
                    key={p.slug}
                    participant={p}
                    index={i}
                  />
                );
              }
              return (
                <StoryCard
                  key={p.slug}
                  participant={p}
                  index={i}
                />
              );
            })}
          </div>
        </div>
      </section>

      <CTABand
        bg="bg-bark"
        diagonal
        heading="What does belonging mean to you?"
        description="The Reimagining Belonging research continues. Your voice helps shape what we build next."
        ctas={[
          { label: "Share your experience", to: "/get-involved" },
          { label: "Read the research", to: "/about/white-paper", variant: "text" },
        ]}
      />
    </div>
  );
}
