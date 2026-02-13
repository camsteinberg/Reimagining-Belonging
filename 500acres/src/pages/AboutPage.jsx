import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import Logo from "../components/shared/Logo";

export default function AboutPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero — generous spacing, clears logo */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        {/* Decorative blob */}
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-sage/8 blob pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30vw] h-[30vw] bg-clay/6 blob pointer-events-none" style={{ animationDelay: "-4s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-10">
            About 500 Acres
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Equitable housing
            <br />
            <span className="text-forest">through technology.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/60 max-w-md leading-relaxed">
            Helping Gen Z build houses with robots by 2026.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="reveal-up stagger-3 absolute bottom-16 right-[max(2.5rem,6vw)] flex flex-col items-center gap-2">
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-charcoal/30 rotate-90 origin-center translate-y-8">
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

      {/* Mission — asymmetric two-column editorial */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-4 md:col-start-1">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-4">
              Our Mission
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15]">
              Making home
              <br />possible.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-6 flex flex-col justify-center">
            <p className="reveal-right font-serif text-lg text-charcoal/70 leading-[1.8] mb-6">
              500 Acres is a non-profit organization focused on making housing
              equitable through technology. We believe that by empowering Gen Z with
              the tools, knowledge, and community to build — literally build — their
              own housing, we can begin to close the gap between imagination and
              reality.
            </p>
            <p className="reveal-right stagger-1 font-serif text-lg text-charcoal/70 leading-[1.8]">
              What started as a research project exploring belonging has
              become a bridge between imagination and reality: a place where Gen Z
              can not only imagine belonging, but build it together.
            </p>
          </div>
        </div>
      </section>

      {/* Pull quote — full-width dramatic */}
      <section className="relative py-28 md:py-40 bg-charcoal diagonal-top diagonal-bottom overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Logo className="absolute -right-[10%] top-1/2 -translate-y-1/2 w-[60vw] h-[60vw]" showText={false} />
        </div>
        <div className="page-container relative z-10 text-center max-w-4xl mx-auto">
          <blockquote className="reveal-scale font-serif text-2xl md:text-4xl lg:text-5xl text-cream leading-[1.3] font-bold italic">
            "Home is not just four walls — it's the feeling that you belong somewhere,
            that somewhere belongs to you."
          </blockquote>
          <p className="reveal-up stagger-2 font-sans text-sm uppercase tracking-[0.3em] text-cream/40 mt-10">
            — From participant interviews
          </p>
        </div>
      </section>

      {/* Vision Timeline — horizontal stepped cards */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-4">
            The Path Forward
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-16 md:mb-20">
            Vision: 2024 → 2026
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                num: "01",
                title: "Research",
                color: "bg-amber",
                textColor: "text-charcoal",
                desc: "Understanding how Gen Z reimagines belonging through interviews, drawings, and data.",
              },
              {
                num: "02",
                title: "Prototype",
                color: "bg-bark",
                textColor: "text-cream",
                desc: "Developing robotic construction tools and community design frameworks.",
              },
              {
                num: "03",
                title: "Build",
                color: "bg-moss",
                textColor: "text-cream",
                desc: "Gen Z building houses with robots, turning belonging from imagination into reality.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`reveal-up stagger-${i + 1} group relative p-8 md:p-10 rounded-2xl ${step.color} transition-transform duration-500 hover:-translate-y-2`}
              >
                <span className={`block font-sans text-6xl md:text-7xl font-bold ${step.textColor} opacity-10 mb-4`}>
                  {step.num}
                </span>
                <h3 className={`font-serif text-2xl md:text-3xl font-bold ${step.textColor} mb-4`}>
                  {step.title}
                </h3>
                <p className={`font-serif text-base ${step.textColor} opacity-80 leading-relaxed`}>
                  {step.desc}
                </p>
                {/* Connecting line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-charcoal/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* Origin — editorial image + text overlap */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-5 md:col-start-1 relative">
            <div className="reveal-scale aspect-square bg-charcoal/5 rounded-2xl flex items-center justify-center overflow-hidden">
              <Logo className="w-2/3 h-2/3" showText={true} />
            </div>
            {/* Decorative dot */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-sage/20 rounded-full" />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="reveal-right font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-4">
              How We Started
            </p>
            <h2 className="reveal-right stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal mb-6 leading-[1.15]">
              From Research
              <br />to Reality
            </h2>
            <p className="reveal-right stagger-2 font-serif text-lg text-charcoal/70 leading-[1.8] mb-6">
              500 Acres grew from the "Reimagining Belonging" research project —
              a design fellowship that explored how seven Gen Z participants
              relate to home, place, and community in the face of housing
              instability.
            </p>
            <p className="reveal-right stagger-3 font-serif text-lg text-charcoal/70 leading-[1.8]">
              Their stories, drawings, and dreams of home became the foundation
              for everything we do. Each voice revealed a universal truth:
              belonging isn't given — it's built.
            </p>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative py-24 md:py-36 bg-moss overflow-hidden">
        <div className="page-container relative z-10 text-center">
          <h2 className="reveal-up font-serif text-3xl md:text-5xl font-bold text-cream mb-6">
            Ready to build belonging?
          </h2>
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/70 mb-10 max-w-xl mx-auto">
            Whether you want to learn, volunteer, or build — there's a place for you.
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
