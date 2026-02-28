import { Link } from "react-router-dom";
import { useState } from "react";
import useReveal from "../hooks/useReveal";
import Logo from "../components/shared/Logo";
import originClassroom from "../assets/photos/origin-classroom.webp";
import pullquoteBarndo from "../assets/photos/pullquote-barndo-storm.webp";
import missionWorkbench from "../assets/photos/mission-team-workbench.webp";
import timelineResearch from "../assets/photos/timeline-research.webp";
import timelinePrototype from "../assets/photos/timeline-prototype.webp";
import timelineDeploy from "../assets/photos/timeline-deploy.webp";

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
      {/* Hero */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-sage/8 blob pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30vw] h-[30vw] bg-clay/6 blob pointer-events-none" aria-hidden="true" style={{ animationDelay: "-4s" }} />

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
          <div className="text-center mb-20 md:mb-24">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              What We Believe
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal">
              Our Values
            </h2>
          </div>

          {/* Bento grid: first two cards are featured/larger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-8 md:mb-10">
            {/* Featured value 1 */}
            <div className="reveal-up stagger-1 group relative p-10 md:p-14 rounded-2xl bg-hearth/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-hearth/10 flex items-center justify-center mb-8">
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
            <div className="reveal-up stagger-2 group relative p-10 md:p-14 rounded-2xl bg-sage/10 transition-transform duration-500 hover:-translate-y-2">
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
            <div className="reveal-up stagger-3 group relative p-8 md:p-10 rounded-2xl bg-amber/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="20" cy="20" r="14" />
                  <line x1="20" y1="6" x2="20" y2="34" />
                  <path d="M14 14c0 0 3-2 6-2s6 2 6 2" />
                  <path d="M14 26c0 0 3 2 6 2s6-2 6-2" />
                </svg>
              </div>
              <div className="w-8 h-[3px] bg-gold rounded-full mb-5" />
              <h3 className="font-serif text-lg md:text-xl font-bold text-charcoal mb-4">
                Social Repair
              </h3>
              <p className="font-serif text-sm text-charcoal/70 leading-[1.8]">
                We invest in community trust through transparent communication and facilitated mediation built into every site's governance. Better relationships reduce turnover, speed builds, and improve long-term outcomes.
              </p>
            </div>

            <div className="reveal-up stagger-4 group relative p-8 md:p-10 rounded-2xl bg-clay/10 transition-transform duration-500 hover:-translate-y-2">
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

      {/* Pull quote — full-width dramatic */}
      <section className="relative py-28 md:py-40 bg-charcoal diagonal-top diagonal-bottom overflow-hidden">
        <img src={pullquoteBarndo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
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

      {/* Vision Timeline — redesigned with connecting lines and varied heights */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
            The Path Forward
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-20 md:mb-24">
            2024 &rarr; 2026 &rarr; Beyond
          </h2>

          {/* Desktop: horizontal with connecting lines */}
          <div className="relative">
            {/* Horizontal connector line (desktop only) */}
            <div className="hidden md:block absolute top-6 left-[5%] right-[5%] h-[2px] bg-charcoal/10 z-0" aria-hidden="true" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative z-10">
              {[
                {
                  num: "01",
                  title: "Research & Design",
                  year: "2024",
                  image: timelineResearch,
                  color: "bg-amber",
                  textColor: "text-charcoal",
                  dotColor: "bg-amber",
                  desc: "Published the Habitable White Paper. Completed the Reimagining Belonging study with seven Gen Z participants. Ran fellowship pilots, assembled core team, and identified site pipeline near Grand Canyon, Yellowstone, Bryce, and Olympic.",
                  height: "min-h-[480px]",
                },
                {
                  num: "02",
                  title: "Prototype & Train",
                  year: "2025",
                  image: timelinePrototype,
                  color: "bg-bark",
                  textColor: "text-cream",
                  dotColor: "bg-bark",
                  desc: "Set up ShopBot CNC production in Boise. Designed and revealed the Camp Pod kit with CWI students. Running the first 'Raise the Pod' prototype build. Developing the Six Steps workforce training curriculum.",
                  height: "min-h-[520px]",
                },
                {
                  num: "03",
                  title: "Deploy & Scale",
                  year: "2026+",
                  image: timelineDeploy,
                  color: "bg-moss",
                  textColor: "text-cream",
                  dotColor: "bg-moss",
                  desc: "Producing four housing kits and deploying to Grand Canyon. Scaling into A-Frame production. Expanding fellowship cohorts and matched savings programs. Opening site pipeline across national park gateway communities.",
                  height: "min-h-[460px]",
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`reveal-up stagger-${i + 1} flex flex-col`}
                >
                  {/* Timeline node */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-full ${step.dotColor} flex items-center justify-center`}>
                      <span className="font-sans text-xs font-bold text-cream">{step.year}</span>
                    </div>
                    <div className="hidden md:block h-[2px] flex-1 bg-charcoal/10" aria-hidden="true" />
                  </div>

                  {/* Card with varied height */}
                  <div className={`group relative p-8 md:p-12 rounded-2xl ${step.color} ${step.height} transition-transform duration-500 hover:-translate-y-2 flex flex-col`}>
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-6">
                      <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <span className={`block font-sans text-5xl md:text-6xl font-bold ${step.textColor} opacity-10 mb-4`}>
                      {step.num}
                    </span>
                    <h3 className={`font-serif text-2xl md:text-3xl font-bold ${step.textColor} mb-6`}>
                      {step.title}
                    </h3>
                    <p className={`font-serif text-base ${step.textColor} opacity-80 leading-[1.85] flex-1`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="absolute top-8 left-[15%] w-1 h-1 bg-starlight rounded-full opacity-40" aria-hidden="true" />
          <div className="absolute top-16 right-[20%] w-1.5 h-1.5 bg-starlight rounded-full opacity-30" aria-hidden="true" />
          <div className="absolute bottom-12 left-[25%] w-1 h-1 bg-starlight rounded-full opacity-25" aria-hidden="true" />
          <div className="absolute top-24 right-[35%] w-0.5 h-0.5 bg-starlight rounded-full opacity-50" aria-hidden="true" />

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
