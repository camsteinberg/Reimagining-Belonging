import { useParams, Link } from "react-router-dom";
import { participants } from "../data/participants";
import useReveal from "../hooks/useReveal";

const ACCENT_COLORS = ["#6b8f71", "#8b5e3c", "#4a7c59", "#5a7d8b", "#c9a96e", "#c4856d", "#3d6b4f"];

export default function StoryDetailPage() {
  const { slug } = useParams();
  const participant = participants.find((p) => p.slug === slug);
  const ref = useReveal();

  if (!participant) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-6xl font-bold text-charcoal mb-6">404</h1>
          <p className="font-serif text-xl text-charcoal/50 mb-10">Story not found.</p>
          <Link
            to="/stories"
            className="inline-block bg-charcoal text-cream px-8 py-3 rounded-full font-serif hover:bg-forest transition-colors"
          >
            Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = participants.findIndex((p) => p.slug === slug);
  const prev = participants[currentIndex - 1];
  const next = participants[currentIndex + 1];
  const accentColor = ACCENT_COLORS[currentIndex] || "#6b8f71";

  const svgUrl = new URL(
    `../assets/svg/${participant.svgIndex}inline.svg`,
    import.meta.url
  ).href;

  const idealHomeUrl = new URL(
    `../assets/images/idealHome/${participant.idealHomeImage}`,
    import.meta.url
  ).href;

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero — full-screen editorial intro */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-16 md:pb-24 overflow-hidden">
        {/* Background accent blob */}
        <div
          className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] blob pointer-events-none opacity-10 blur-2xl"
          style={{ backgroundColor: accentColor }}
        />

        {/* Back link */}
        <div className="page-container relative z-10 mb-10">
          <Link
            to="/stories"
            className="reveal-up font-sans text-xs uppercase tracking-[0.3em] text-charcoal/40 hover:text-charcoal transition-colors creative-link"
          >
            ← All Stories
          </Link>
        </div>

        {/* Content */}
        <div className="page-container relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
          {/* SVG portrait — large */}
          <div className="md:col-span-5 flex justify-center md:justify-start">
            <img
              src={svgUrl}
              alt={participant.name}
              loading="lazy"
              className="reveal-scale w-56 h-36 md:w-72 md:h-48 object-contain"
            />
          </div>

          {/* Name + info */}
          <div className="md:col-span-7">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/30 mb-4">
              Participant {String(currentIndex + 1).padStart(2, "0")} / {String(participants.length).padStart(2, "0")}
            </p>
            <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-5">
              {participant.name}
            </h1>
            <div className="reveal-up stagger-2 flex flex-wrap items-center gap-4">
              <span className="font-sans text-sm text-charcoal/40">{participant.age} years old</span>
              <span className="w-1 h-1 rounded-full bg-charcoal/20" />
              <span className="font-sans text-sm text-charcoal/40">{participant.location}</span>
              <span className="w-1 h-1 rounded-full bg-charcoal/20" />
              <span className="font-sans text-sm text-charcoal/40">{participant.occupation}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Belonging quote — dramatic pull quote */}
      <section className="py-20 md:py-28 border-t border-charcoal/10">
        <div className="page-container max-w-4xl mx-auto">
          <blockquote className="reveal-up">
            <span className="block font-serif text-6xl md:text-8xl leading-none opacity-10" style={{ color: accentColor }}>"</span>
            <p className="font-serif text-xl md:text-3xl lg:text-4xl text-charcoal italic leading-[1.5] -mt-8 md:-mt-12">
              {participant.belongingQuote}
            </p>
          </blockquote>
        </div>
      </section>

      {/* Summary */}
      <section className="py-16 md:py-24">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-3">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/30 sticky top-28">
              Their Story
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-5">
            <p className="reveal-right font-serif text-lg text-charcoal/70 leading-[1.8]">
              {participant.summary}
            </p>
          </div>
        </div>
      </section>

      {/* Quotes — staggered editorial layout */}
      <section className="py-20 md:py-28 bg-warm-white">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-3">
              <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/30 sticky top-28">
                In Their Words
              </p>
            </div>
          </div>

          <div className="space-y-12 md:space-y-16">
            {participant.quotes.map((quote, i) => (
              <blockquote
                key={i}
                className={`reveal-up stagger-${(i % 4) + 1} max-w-3xl ${
                  i % 2 === 0 ? "md:ml-[16.67%]" : "md:ml-[33.33%]"
                }`}
              >
                <div
                  className="w-8 h-[2px] mb-4"
                  style={{ backgroundColor: accentColor }}
                />
                <p className="font-serif text-lg italic leading-[1.7]" style={{ color: accentColor }}>
                  {quote}
                </p>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal Home — immersive image + text */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
            <div className="md:col-span-3">
              <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/30 sticky top-28">
                Ideal Home
              </p>
            </div>

            <div className="md:col-span-7 md:col-start-5">
              <h2 className="reveal-up font-serif text-2xl md:text-3xl font-bold text-charcoal mb-8">
                {participant.idealHomeTitle}
              </h2>

              <div className="reveal-scale rounded-2xl overflow-hidden bg-charcoal/5 mb-8">
                <img
                  src={idealHomeUrl}
                  alt={`${participant.name}'s ideal home: ${participant.idealHomeTitle}`}
                  loading="lazy"
                  className="w-full max-h-[60vh] object-contain p-6 md:p-10"
                />
              </div>

              <p className="reveal-up font-serif text-lg text-charcoal/60 leading-[1.8] max-w-2xl">
                {participant.idealHomeDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation — prev/next with hover effects */}
      <section className="border-t border-charcoal/10">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {prev ? (
            <Link
              to={`/stories/${prev.slug}`}
              className="group page-container py-12 md:py-16 hover:bg-charcoal/5 transition-colors"
            >
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/30 mb-2">
                Previous
              </p>
              <p className="font-serif text-lg md:text-2xl font-bold text-charcoal group-hover:text-forest transition-colors">
                ← {prev.name}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/stories/${next.slug}`}
              className="group page-container py-12 md:py-16 text-right hover:bg-charcoal/5 transition-colors border-l border-charcoal/10"
            >
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/30 mb-2">
                Next
              </p>
              <p className="font-serif text-lg md:text-2xl font-bold text-charcoal group-hover:text-forest transition-colors">
                {next.name} →
              </p>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>
    </div>
  );
}
