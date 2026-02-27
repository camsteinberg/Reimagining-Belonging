import { Link } from "react-router-dom";
import { useState } from "react";
import useReveal from "../hooks/useReveal";
import Logo from "../components/shared/Logo";

export default function OurMissionPage() {
  const ref = useReveal();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero — generous spacing, clears logo */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        {/* Decorative blob */}
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-sage/8 blob pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30vw] h-[30vw] bg-clay/6 blob pointer-events-none" style={{ animationDelay: "-4s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            About 500 Acres
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Turning empty land
            <br />
            <span className="text-forest">into real homes.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/60 max-w-lg">
            500 Acres is a social enterprise transforming underutilized land
            near America's national parks into communities where young adults
            learn to build sustainable housing — and build their own path
            to homeownership.
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

      {/* Mission — asymmetric two-column editorial */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-4 md:col-start-1">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Our Mission
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15]">
              Empty land becomes shelter.
              <br />Shelter becomes skill.
              <br />Skill becomes wealth.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-6 flex flex-col justify-center">
            <p className="reveal-right font-serif text-lg text-charcoal/70 leading-[1.8] mb-6">
              500 Acres pairs a Qualified Opportunity Zone investment fund with
              a 501(c)(3) foundation to acquire land, train the next generation
              of builders through hands-on fellowships, and deliver low-cost,
              rapidly assembled housing kits. The result: stabilized workforce
              housing, measurable career outcomes, and a tested pathway to
              earned homeownership.
            </p>
            <p className="reveal-right stagger-1 font-serif text-lg text-charcoal/70 leading-[1.8]">
              What began as the "Reimagining Belonging" research project — a
              qualitative study exploring what home means to Gen Z — became the
              blueprint for everything we build. The research revealed that when
              housing stability is missing, belonging shifts to portable anchors
              of meaning. 500 Acres exists to bring that meaning back to
              physical reality.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container">
          <div className="text-center mb-20 md:mb-24">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              What We Believe
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal">
              Our Values
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-14">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-ember" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 36c-6 0-14-4-14-14C6 12 20 4 20 4s14 8 14 18c0 10-8 14-14 14z" />
                    <path d="M20 36c-2 0-6-2-6-8 0-6 6-10 6-10s6 4 6 10c0 6-4 8-6 8z" />
                  </svg>
                ),
                title: "Build Homes, Build Hope",
                color: "bg-hearth/10",
                accent: "bg-ember",
                desc: "We deliver habitable capacity quickly and affordably — camp pods, nesting kits, and A-frames. Each structure is a training site and revenue asset that reduces housing costs and creates pathways to ownership.",
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-forest" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 4L10 18h6l-5 10h6l-5 10h16l-5-10h6l-5-10h6L20 4z" />
                    <line x1="20" y1="34" x2="20" y2="38" />
                  </svg>
                ),
                title: "Grow People, Close Gaps",
                color: "bg-sage/10",
                accent: "bg-forest",
                desc: "Our Six Steps fellowship curriculum teaches digital fabrication, timber framing, and small-business skills so participants can increase wages and launch micro-enterprises. We track completion, placement, and verified wage uplift.",
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-gold" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="20" cy="20" r="14" />
                    <line x1="20" y1="6" x2="20" y2="34" />
                    <path d="M14 14c0 0 3-2 6-2s6 2 6 2" />
                    <path d="M14 26c0 0 3 2 6 2s6-2 6-2" />
                  </svg>
                ),
                title: "Social Repair",
                color: "bg-amber/10",
                accent: "bg-gold",
                desc: "We invest in community trust through transparent communication and facilitated mediation built into every site's governance. Better relationships reduce turnover, speed builds, and improve long-term outcomes.",
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-bark" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 32L20 8l12 24" />
                    <line x1="12" y1="26" x2="28" y2="26" />
                    <line x1="20" y1="8" x2="20" y2="32" />
                    <circle cx="14" cy="20" r="2" />
                    <circle cx="26" cy="20" r="2" />
                  </svg>
                ),
                title: "Design & Stewardship",
                color: "bg-clay/10",
                accent: "bg-bark",
                desc: "Every housing unit is scored for form, comfort, and connection to place. Stewardship of land — low-impact siting, native planting, and site maintenance — is built into project budgets and fellow responsibilities.",
              },
            ].map((value, i) => (
              <div
                key={value.title}
                className={`reveal-up stagger-${i + 1} group relative p-8 md:p-10 rounded-2xl ${value.color} transition-transform duration-500 hover:-translate-y-2`}
              >
                <div className={`w-12 h-12 rounded-xl ${value.color} flex items-center justify-center mb-6`}>
                  {value.icon}
                </div>
                <div className={`w-8 h-[3px] ${value.accent} rounded-full mb-5`} />
                <h3 className="font-serif text-lg md:text-xl font-bold text-charcoal mb-4">
                  {value.title}
                </h3>
                <p className="font-serif text-sm text-charcoal/70 leading-[1.8] card-prose">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pull quote — full-width dramatic */}
      <section className="relative py-28 md:py-40 bg-charcoal diagonal-top diagonal-bottom overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Logo className="absolute -right-[10%] top-1/2 -translate-y-1/2 w-[60vw] h-[60vw]" showText={false} />
        </div>
        <div className="page-container relative z-10 text-center max-w-4xl mx-auto">
          <blockquote className="reveal-scale font-serif text-2xl md:text-4xl lg:text-5xl text-cream leading-[1.5] font-bold italic">
            "Empty land becomes shelter. Shelter becomes skill. Skill becomes wealth."
          </blockquote>
          <p className="reveal-up stagger-2 font-sans text-sm uppercase tracking-[0.3em] text-cream/60 mt-10">
            — 500 Acres Mission
          </p>
        </div>
      </section>

      {/* Vision Timeline — horizontal stepped cards */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
            The Path Forward
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-20 md:mb-24">
            2024 &rarr; 2026 &rarr; Beyond
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {[
              {
                num: "01",
                title: "Research & Design",
                color: "bg-amber",
                textColor: "text-charcoal",
                desc: "Published the Habitable White Paper. Completed the Reimagining Belonging study with seven Gen Z participants. Ran fellowship pilots, assembled core team, and identified site pipeline near Grand Canyon, Yellowstone, Bryce, and Olympic.",
              },
              {
                num: "02",
                title: "Prototype & Train",
                color: "bg-bark",
                textColor: "text-cream",
                desc: "Set up ShopBot CNC production in Boise. Designed and revealed the Camp Pod kit with CWI students. Running the first 'Raise the Pod' prototype build. Developing the Six Steps workforce training curriculum.",
              },
              {
                num: "03",
                title: "Deploy & Scale",
                color: "bg-moss",
                textColor: "text-cream",
                desc: "Producing four housing kits and deploying to Grand Canyon. Scaling into A-Frame production. Expanding fellowship cohorts and matched savings programs. Opening site pipeline across national park gateway communities.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`reveal-up stagger-${i + 1} group relative p-10 md:p-14 rounded-2xl ${step.color} transition-transform duration-500 hover:-translate-y-2`}
              >
                <span className={`block font-sans text-6xl md:text-7xl font-bold ${step.textColor} opacity-10 mb-8`}>
                  {step.num}
                </span>
                <h3 className={`font-serif text-2xl md:text-3xl font-bold ${step.textColor} mb-8`}>
                  {step.title}
                </h3>
                <p className={`font-serif text-base ${step.textColor} opacity-80 leading-[1.85]`}>
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
            <p className="reveal-right font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              How We Started
            </p>
            <h2 className="reveal-right stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal mb-6 leading-[1.15]">
              From Research
              <br />to Reality
            </h2>
            <p className="reveal-right stagger-2 font-serif text-lg text-charcoal/70 leading-[1.8] mb-6">
              500 Acres grew from the "Reimagining Belonging" research project —
              a qualitative study led by the 500 Acres Foundation that explored
              what home means to seven Gen Z participants. Through interviews,
              drawings, and conversations, the research revealed a central
              finding: when material stability is missing, people anchor
              belonging in portable meaning — places, objects, people, and
              language.
            </p>
            <p className="reveal-right stagger-3 font-serif text-lg text-charcoal/70 leading-[1.8]">
              That insight became the foundation for the 500 Acres model:
              acquire underutilized land near national parks, train young adults
              to build through hands-on fellowships, and deliver housing kits
              that convert labor into asset ownership. The research didn't just
              inform the mission — it is the mission.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24 md:py-32 bg-night overflow-hidden">
        <div className="page-container relative z-10 text-center max-w-2xl mx-auto">
          {/* Decorative stars */}
          <div className="absolute top-8 left-[15%] w-1 h-1 bg-starlight rounded-full opacity-40" />
          <div className="absolute top-16 right-[20%] w-1.5 h-1.5 bg-starlight rounded-full opacity-30" />
          <div className="absolute bottom-12 left-[25%] w-1 h-1 bg-starlight rounded-full opacity-25" />
          <div className="absolute top-24 right-[35%] w-0.5 h-0.5 bg-starlight rounded-full opacity-50" />

          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-bold text-cream mb-4">
            Stay Connected
          </h2>
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/60 mb-10 max-w-lg mx-auto">
            Build updates, fellowship announcements, and Live Forum
            invitations — delivered to your inbox, never more than twice
            a month.
          </p>

          {subscribed ? (
            <div className="reveal-up stagger-2">
              <p className="font-serif text-lg text-sage">
                You're in. We'll be in touch.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletter}
              className="reveal-up stagger-2 flex flex-col sm:flex-row items-center gap-5 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address for newsletter"
                className="w-full sm:flex-1 px-6 py-5 rounded-full bg-cream/10 border border-cream/20 text-cream placeholder-cream/30 font-serif text-base focus:outline-none focus:border-sage/60 transition-colors duration-300"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-ember text-cream font-serif text-base font-bold hover:bg-rust transition-colors duration-300 whitespace-nowrap"
              >
                Join Us
              </button>
            </form>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative py-24 md:py-36 bg-moss overflow-hidden">
        <div className="page-container relative z-10 text-center">
          <h2 className="reveal-up font-serif text-3xl md:text-5xl font-bold text-cream mb-6">
            Ready to build?
          </h2>
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/70 mb-10 max-w-xl mx-auto">
            Whether you want to apply for a fellowship, attend a Live Forum,
            volunteer for a build weekend, or support the mission — there's
            a place for you here.
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
