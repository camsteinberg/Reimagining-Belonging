import { Link } from "react-router-dom";
import { participants } from "../data/participants";
import useReveal from "../hooks/useReveal";

export default function StoriesPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        <div className="absolute top-[20%] right-[5%] w-[35vw] h-[35vw] bg-clay/5 blob pointer-events-none" aria-hidden="true" />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-10">
            Stories
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Seven voices,
            <br />
            <span className="italic text-forest">one vision.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/50 max-w-md leading-[1.8]">
            Gen Z participants shared their stories, drawings, and visions
            of home as part of the Reimagining Belonging research project.
            Their insights shaped the 500 Acres model — here's what they said.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* Participant grid — editorial masonry-style */}
      <section className="py-24 md:py-32">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12" role="list">
            {participants.map((p, i) => {
              const svgUrl = new URL(
                `../assets/svg/${p.svgIndex}inline.svg`,
                import.meta.url
              ).href;

              return (
                <Link
                  key={p.slug}
                  to={`/stories/${p.slug}`}
                  role="listitem"
                  aria-label={`Read ${p.name}'s story`}
                  className={`reveal-up stagger-${(i % 4) + 1} story-card group relative rounded-2xl overflow-hidden border border-charcoal/8 bg-warm-white`}
                >
                  {/* Top accent line */}
                  <div
                    className="h-1 w-full transition-all duration-500 group-hover:h-2"
                    style={{
                      background: ["#6b8f71", "#8b5e3c", "#4a7c59", "#5a7d8b", "#c9a96e", "#c4856d", "#3d6b4f"][i],
                    }}
                    aria-hidden="true"
                  />

                  <div className="p-8 md:p-12 flex flex-col">
                    {/* Participant number */}
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-charcoal/25 mb-auto" aria-hidden="true">
                      Participant {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* SVG portrait */}
                    <div className="my-8 flex justify-center">
                      <img
                        src={svgUrl}
                        alt={`Portrait illustration of ${p.name}`}
                        className="w-32 h-20 md:w-40 md:h-24 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="mt-auto">
                      <h3 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-1 group-hover:text-forest transition-colors">
                        {p.name}
                      </h3>
                      <p className="font-sans text-xs text-charcoal/40 mb-6 tracking-wide">
                        {p.age} · {p.location}
                      </p>
                      <p className="font-serif text-sm text-charcoal/50 italic leading-[1.75] line-clamp-2 mb-8">
                        "{p.belongingQuote}"
                      </p>

                      {/* Read more arrow */}
                      <div className="mt-6 flex items-center gap-2 text-charcoal/20 group-hover:text-forest transition-all duration-300">
                        <span className="font-sans text-xs uppercase tracking-wider">Read story</span>
                        <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-36 bg-charcoal diagonal-top">
        <div className="page-container text-center">
          <h2 className="reveal-up font-serif text-3xl md:text-5xl font-bold text-cream mb-6">
            Your story matters too.
          </h2>
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/40 leading-[1.8] mb-10 max-w-xl mx-auto">
            The Reimagining Belonging research continues. Want to share
            your experience with housing, belonging, and home? Your voice
            helps shape what we build next.
          </p>
          <Link
            to="/get-involved"
            className="reveal-up stagger-2 inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </div>
  );
}
