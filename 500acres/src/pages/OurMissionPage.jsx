import { useState } from "react";
import useReveal from "../hooks/useReveal";
import SectionDivider from "../components/shared/SectionDivider";
import SectionHeader from "../components/shared/SectionHeader";
import CTABand from "../components/shared/CTABand";
import originClassroom from "../assets/photos/origin-classroom.webp";
import missionWorkbench from "../assets/photos/mission-team-workbench.webp";

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
      {/* Hero — centered layout with background image */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
        <img src={missionWorkbench} alt="" className="absolute inset-0 w-full h-full object-cover opacity-12" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />

        <div className="page-container relative z-10 flex flex-col items-center">
          <p className="reveal-scale font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            About 500 Acres
          </p>
          <h1 className="reveal-scale stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Turning empty land
            <br />
            <span className="text-forest">into real homes.</span>
          </h1>
          <p className="reveal-scale stagger-2 font-serif text-lg md:text-xl text-charcoal/60 max-w-lg">
            500 Acres is a social enterprise transforming underutilized land
            near America's national parks into communities where young adults
            learn to build sustainable housing — and build their own path
            to homeownership.
          </p>
        </div>
      </section>

      <SectionDivider />

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
            <div className="reveal-left stagger-2 mt-10 aspect-[3/4] rounded-2xl overflow-hidden hidden md:block">
              <img src={missionWorkbench} alt="Fellowship team at construction workbench" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
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

      {/* Values Section — bento-style staggered grid with featured cards */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container">
          <SectionHeader
            label="What We Believe"
            title="Our Values"
            align="center"
            className="mb-20 md:mb-24"
          />

          {/* Bento grid: first two cards are featured/larger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-8 md:mb-10">
            {/* Featured value 1 */}
            <div className="reveal-up stagger-1 group relative p-10 md:p-14 rounded-2xl border border-clay/30 bg-clay/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-clay/10 flex items-center justify-center mb-8">
                <svg className="w-10 h-10 text-ember" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 36c-6 0-14-4-14-14C6 12 20 4 20 4s14 8 14 18c0 10-8 14-14 14z" />
                  <path d="M20 36c-2 0-6-2-6-8 0-6 6-10 6-10s6 4 6 10c0 6-4 8-6 8z" />
                </svg>
              </div>
              <div className="w-10 h-[3px] bg-ember rounded-full mb-6" />
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-6">
                Build Homes, Build Hope
              </h3>
              <p className="font-serif text-base text-charcoal/70 leading-[1.8]">
                We deliver habitable capacity quickly and affordably — camp pods, nesting kits, and A-frames. Each structure is a training site and revenue asset that reduces housing costs and creates pathways to ownership.
              </p>
            </div>

            {/* Featured value 2 */}
            <div className="reveal-up stagger-2 group relative p-10 md:p-14 rounded-2xl border border-sage/30 bg-sage/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-sage/10 flex items-center justify-center mb-8">
                <svg className="w-10 h-10 text-forest" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 4L10 18h6l-5 10h6l-5 10h16l-5-10h6l-5-10h6L20 4z" />
                  <line x1="20" y1="34" x2="20" y2="38" />
                </svg>
              </div>
              <div className="w-10 h-[3px] bg-forest rounded-full mb-6" />
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-6">
                Grow People, Close Gaps
              </h3>
              <p className="font-serif text-base text-charcoal/70 leading-[1.8]">
                Our Six Steps fellowship curriculum teaches digital fabrication, timber framing, and small-business skills so participants can increase wages and launch micro-enterprises. We track completion, placement, and verified wage uplift.
              </p>
            </div>
          </div>

          {/* Secondary values — smaller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
            <div className="reveal-up stagger-3 group relative p-8 md:p-10 rounded-2xl border border-amber/30 bg-amber/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-amber" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="20" cy="20" r="14" />
                  <line x1="20" y1="6" x2="20" y2="34" />
                  <path d="M14 14c0 0 3-2 6-2s6 2 6 2" />
                  <path d="M14 26c0 0 3 2 6 2s6-2 6-2" />
                </svg>
              </div>
              <div className="w-8 h-[3px] bg-amber rounded-full mb-5" />
              <h3 className="font-serif text-lg md:text-xl font-bold text-charcoal mb-4">
                Social Repair
              </h3>
              <p className="font-serif text-sm text-charcoal/70 leading-[1.8]">
                We invest in community trust through transparent communication and facilitated mediation built into every site's governance. Better relationships reduce turnover, speed builds, and improve long-term outcomes.
              </p>
            </div>

            <div className="reveal-up stagger-4 group relative p-8 md:p-10 rounded-2xl border border-clay/30 bg-clay/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 rounded-xl bg-clay/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-bark" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 32L20 8l12 24" />
                  <line x1="12" y1="26" x2="28" y2="26" />
                  <line x1="20" y1="8" x2="20" y2="32" />
                  <circle cx="14" cy="20" r="2" />
                  <circle cx="26" cy="20" r="2" />
                </svg>
              </div>
              <div className="w-8 h-[3px] bg-bark rounded-full mb-5" />
              <h3 className="font-serif text-lg md:text-xl font-bold text-charcoal mb-4">
                Design & Stewardship
              </h3>
              <p className="font-serif text-sm text-charcoal/70 leading-[1.8]">
                Every housing unit is scored for form, comfort, and connection to place. Stewardship of land — low-impact siting, native planting, and site maintenance — is built into project budgets and fellow responsibilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Word Mantra Triptych */}
      <section className="bg-charcoal py-20 md:py-28 overflow-hidden">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0">
            {[
              { num: "01", text: "Empty land becomes shelter.", reveal: "reveal-left" },
              { num: "02", text: "Shelter becomes skill.", reveal: "reveal-up" },
              { num: "03", text: "Skill becomes wealth.", reveal: "reveal-right" },
            ].map((item, i) => (
              <div
                key={item.num}
                className={`${item.reveal} stagger-${i + 1} text-center px-6 md:px-10 ${
                  i < 2 ? "md:border-r md:border-cream/10" : ""
                }`}
              >
                <span className="block font-sans text-sm uppercase tracking-[0.4em] text-cream/30 mb-6">
                  {item.num}
                </span>
                <p className="font-serif text-xl md:text-2xl lg:text-3xl text-cream italic leading-[1.5]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Origin — editorial image + text overlap */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
          <div className="md:col-span-5 md:col-start-1 relative">
            <div className="reveal-scale aspect-square bg-charcoal/5 rounded-2xl flex items-center justify-center overflow-hidden">
              <img src={originClassroom} alt="Fellowship learning session in barn classroom" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            {/* Decorative dot */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-sage/20 rounded-full" aria-hidden="true" />
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
          <div className="absolute top-8 left-[15%] w-1 h-1 bg-cream rounded-full opacity-40" aria-hidden="true" />
          <div className="absolute top-16 right-[20%] w-1.5 h-1.5 bg-cream rounded-full opacity-30" aria-hidden="true" />
          <div className="absolute bottom-12 left-[25%] w-1 h-1 bg-cream rounded-full opacity-25" aria-hidden="true" />
          <div className="absolute top-24 right-[35%] w-0.5 h-0.5 bg-cream rounded-full opacity-50" aria-hidden="true" />

          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-bold text-cream mb-4">
            Stay Connected
          </h2>
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/60 mb-10 max-w-lg mx-auto">
            Build updates, fellowship announcements, and Live Forum
            invitations — delivered to your inbox, never more than twice
            a month.
          </p>

          {subscribed ? (
            <div className="success-enter">
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
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-ember text-cream font-serif text-base font-bold btn-pill hover:bg-bark whitespace-nowrap"
              >
                Join Us
              </button>
            </form>
          )}
        </div>
      </section>

      <CTABand
        bg="bg-forest"
        heading="See the research behind the model."
        description="The HABITABLE white paper lays out the full vision — from Housing Capacity Units to the Six Steps curriculum to Opportunity Zone investment."
        ctas={[
          { label: "Read the White Paper", to: "/about/white-paper" },
          { label: "Or get involved", to: "/get-involved", variant: "text" },
        ]}
      />
    </div>
  );
}
