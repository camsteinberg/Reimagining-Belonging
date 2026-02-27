import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";

/* Photos */
import heroBarndo from "../assets/photos/pullquote-barndo-storm.webp";
import researchSession from "../assets/photos/timeline-research.webp";
import firepit from "../assets/photos/team-hero-firepit.webp";
import classroom from "../assets/photos/origin-classroom.webp";
import prototype from "../assets/photos/timeline-prototype.webp";
import workbench from "../assets/photos/mission-team-workbench.webp";
import fellowship from "../assets/photos/card-apply.webp";
import ranchLand from "../assets/photos/resources-hero-ranch.webp";

/* ───────────────────────────── Data ───────────────────────────── */

const IMPACT_TARGETS = [
  {
    metric: "10,000+",
    label: "Housing Capacity Units",
    sub: "Deployed across all tiers",
    accent: "bg-forest/10 border-forest/30",
    dot: "bg-forest",
  },
  {
    metric: "1,000",
    label: "Career Units",
    sub: "Certifications completed",
    accent: "bg-amber/10 border-amber/30",
    dot: "bg-amber",
  },
  {
    metric: "+20%",
    label: "Social Repair Index",
    sub: "Community improvement",
    accent: "bg-sage/10 border-sage/30",
    dot: "bg-sage",
  },
];

const HCU_TIERS = [
  {
    tier: "HCU-1",
    name: "Safe Landing",
    description:
      "Emergency housing that restores stability and safety so a person can work, sleep, and plan.",
    color: "bg-clay",
    textColor: "text-cream",
  },
  {
    tier: "HCU-2",
    name: "Learn + Build",
    description:
      "Training housing where participants learn modern construction and fabrication methods while building real housing.",
    color: "bg-bark",
    textColor: "text-cream",
  },
  {
    tier: "HCU-3",
    name: "Ownership Tier",
    description:
      "A permanent starter home — a first home — owned within 24 months through a supported pathway.",
    color: "bg-forest",
    textColor: "text-cream",
  },
  {
    tier: "HCU-4",
    name: "Earn + Lead",
    description:
      "Income and net worth grow as graduates mentor and teach the next cohort.",
    color: "bg-moss",
    textColor: "text-cream",
  },
  {
    tier: "HCU-5",
    name: "Bankable Housing",
    description:
      "Code-compliant, mortgage-ready housing and mainstream equity.",
    color: "bg-charcoal",
    textColor: "text-cream",
  },
];

const NESTING_BENEFITS = [
  {
    title: "Affordability",
    desc: "Reduces cost by shifting precision labor from the jobsite to robotic fabrication.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="12" />
        <path d="M16 10v12M12 14h8M12 18h6" />
      </svg>
    ),
  },
  {
    title: "Speed",
    desc: "Parts arrive ready; assembly becomes teachable and repeatable.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="14,4 6,28 16,20 18,28 26,4 16,12" />
      </svg>
    ),
  },
  {
    title: "Environment",
    desc: "Optimized cutting reduces waste and supports durable, efficient wood systems.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 28V14M16 14c-4-6-10-8-10-8s4 6 10 8zM16 14c4-6 10-8 10-8s-4 6-10 8z" />
        <path d="M16 22c-3-4-8-5-8-5s3 4 8 5zM16 22c3-4 8-5 8-5s-3 4-8 5z" />
      </svg>
    ),
  },
  {
    title: "Workforce",
    desc: "Converts housing into a training engine and a career pathway.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="4" />
        <circle cx="22" cy="12" r="3" />
        <path d="M4 26c0-5 4-8 8-8 2 0 4 .8 5.5 2M18 26c0-4 2.5-6 5-6s5 2 5 6" />
      </svg>
    ),
  },
];

const FLYWHEEL_STEPS = [
  "Fellows train and certify in modern fabrication and assembly.",
  "Graduates build locally — and then teach others.",
  "Teaching creates local instructors and local capacity nodes.",
  "Capacity nodes accelerate HCU deployment and Career Units, improving SRI over time.",
];

const ENDOWMENT_FUNDS = [
  "Scholarships for Fellows to earn certification and employable skills",
  "Literacy training and basic education support",
  "Roth IRA matching to begin wealth-building early",
  "Health insurance reimbursements to stabilize participation and outcomes",
  "Build-your-first-house support to move participants into ownership",
];

const OZ_CRITERIA = [
  "Proximity to training partners",
  "Land/zoning feasibility for small-footprint wood housing",
  "Workforce-housing mismatch severity (working homeless indicators)",
  "Ability to host training cohorts + assembly builds",
  "Local government / employer partnership readiness",
];

const REFERENCES = [
  'Rukmini Callimachi, "In a Snow Paradise, They Live in This Parking Lot," The New York Times (April 12, 2025).',
  'U.S. Government Accountability Office, "Opportunity Zones: Improved Oversight Needed" (GAO-22-104019, 2021).',
  "U.S. Forest Service, Wood Innovations Grant Program.",
  "IRS, Section 45L Energy Efficient Home Credit.",
  'McKinsey & Company, "How modular building could build on its strengths" (2023). Modular techniques may accelerate timelines by 20–50% and reduce costs by up to 20%.',
  'McKinsey & Company, "Modular construction: From projects to products (in brief)" (2019). Schedule improvements of 20–50% and potential >20% cost savings at scale.',
  "W. Lu et al., Resources, Conservation & Recycling 175 (2021): 105579. Study found 15.38% waste reduction vs conventional in 114 high-rise projects.",
  "A. Hemmati et al., USDA Forest Service, Forest Products Laboratory (2024). Found 19% lower emissions for mass timber vs steel.",
  'Frontiers in Built Environment, "Carbon intensity of mass timber materials..." (2023).',
  'KUNC/NPR, "Paying to sleep in a parking lot? For some Summit County workers, it\'s the best housing option" (April 18, 2025).',
];

/* ───────────────────────────── Component ───────────────────────────── */

export default function WhitePaperPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        <img src={heroBarndo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/90 to-cream/70" />
        <div className="absolute top-[8%] right-[-12%] w-[55vw] h-[55vw] bg-forest/5 blob pointer-events-none" />
        <div className="absolute bottom-[15%] left-[-8%] w-[35vw] h-[35vw] bg-amber/5 blob pointer-events-none" style={{ animationDelay: "-4s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            White Paper &middot; January 2026
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(3rem,7vw,7rem)] leading-[0.9] font-bold text-charcoal mb-6">
            HABITABLE
          </h1>
          <p className="reveal-up stagger-2 font-serif text-xl md:text-2xl text-charcoal/80 max-w-2xl leading-[1.4] mb-4">
            Housing as Capacity Infrastructure
          </p>
          <p className="reveal-up stagger-3 font-serif text-lg md:text-xl text-charcoal/60 max-w-xl leading-[1.6]">
            A 10-Year Framework to End the Working Homeless Crisis
          </p>
        </div>

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
      <div className="page-container"><div className="h-px bg-charcoal/10" /></div>

      {/* ── Executive Summary ── */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-5">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Executive Summary
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15] mb-8">
              The fastest-growing group of homeless Americans isn't
              unemployed — it's working.
            </h2>
            <p className="reveal-left stagger-2 font-serif text-lg text-charcoal/70 leading-[1.8] mb-6">
              HABITABLE is a 10-year research framework to test a new
              solution: housing capacity as infrastructure. Housing is not
              simply shelter — it is the platform that makes work, learning,
              health, savings, and ownership possible.
            </p>
            <p className="reveal-left stagger-3 font-serif text-lg text-charcoal/70 leading-[1.8]">
              Our model combines: a clear ladder of Housing Capacity Units,
              Nesting Pods that reduce cost and waste, robotic fabrication with
              human assembly, and a Foundation-funded fellowship system that
              trains local builders who teach others — especially in
              Opportunity Zones.
            </p>
            <div className="reveal-left stagger-3 mt-10 aspect-[4/3] rounded-2xl overflow-hidden hidden md:block">
              <img src={researchSession} alt="Team research and planning session" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7 flex flex-col gap-6">
            <p className="reveal-right font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-2">
              10-Year Impact Targets
            </p>
            {IMPACT_TARGETS.map((t, i) => (
              <div
                key={t.label}
                className={`reveal-right stagger-${i + 1} p-8 md:p-10 rounded-2xl border ${t.accent}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                  <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/60">
                    {t.sub}
                  </span>
                </div>
                <span className="block font-serif text-4xl md:text-5xl font-bold text-charcoal mb-2">
                  {t.metric}
                </span>
                <span className="font-serif text-lg text-charcoal/70">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem — dark section ── */}
      <section className="relative py-28 md:py-40 bg-charcoal diagonal-top overflow-hidden">
        <img src={firepit} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="page-container relative z-10 max-w-4xl mx-auto text-center">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/50 mb-8">
            The Crisis
          </p>
          <blockquote className="reveal-scale font-serif text-2xl md:text-3xl lg:text-4xl text-cream leading-[1.5] font-bold italic mb-10">
            "Workers in wealthy resort towns sleep in their cars because rent
            is out of reach — even while working full time. They are not
            outside the workforce. They are the workforce."
          </blockquote>
          <p className="reveal-up stagger-2 font-sans text-sm uppercase tracking-[0.3em] text-cream/40">
            — The New York Times, April 2025
          </p>
        </div>
      </section>

      {/* ── What is Housing Capacity? ── */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-4">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Core Concept
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15]">
              What is Housing Capacity?
            </h2>
            <div className="reveal-left stagger-2 mt-10 aspect-square rounded-2xl overflow-hidden hidden md:block">
              <img src={classroom} alt="Fellowship learning session" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6 flex flex-col justify-center">
            <p className="reveal-right font-serif text-lg text-charcoal/70 leading-[1.8] mb-6">
              Housing capacity means housing is the platform for a stable life.
              When someone has stable housing, they can keep their job, complete
              training, stay healthy, save money, and build wealth. When housing
              disappears, capacity disappears — and everything becomes harder.
            </p>
            <p className="reveal-right stagger-1 font-serif text-lg text-charcoal/70 leading-[1.8]">
              HABITABLE treats housing as capacity infrastructure and measures
              what housing restores: stability, employability, education
              outcomes, health, and ownership trajectories.
            </p>
          </div>
        </div>
      </section>

      {/* ── The Hypothesis ── */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container max-w-4xl mx-auto">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4 text-center">
            The HABITABLE Hypothesis
          </p>
          <p className="reveal-up stagger-1 font-serif text-xl md:text-2xl text-charcoal/80 leading-[1.7] text-center mb-16 max-w-3xl mx-auto">
            If we deliver laddered, affordable, environmentally responsible
            housing — paired with career training and community-based
            instruction — then working homeless households will increase
            stability and wealth, and communities will show measurable
            improvement in social repair.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                metric: "HCUs",
                title: "Housing Capacity Units",
                desc: "Measure real housing capacity added to the system.",
                color: "bg-forest",
              },
              {
                metric: "CUs",
                title: "Career Units",
                desc: "Measure whether the model builds local capability and income pathways.",
                color: "bg-amber",
              },
              {
                metric: "SRI",
                title: "Social Repair Index",
                desc: "Measures whether the community becomes measurably healthier and more resilient.",
                color: "bg-sage",
              },
            ].map((m, i) => (
              <div
                key={m.metric}
                className={`reveal-up stagger-${i + 1} text-center p-8 rounded-2xl bg-cream`}
              >
                <span className={`inline-block px-4 py-2 rounded-full text-cream font-sans text-xs uppercase tracking-widest ${m.color} mb-6`}>
                  {m.metric}
                </span>
                <h3 className="font-serif text-lg font-bold text-charcoal mb-3">
                  {m.title}
                </h3>
                <p className="font-serif text-sm text-charcoal/60 leading-[1.7]">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The HCU Ladder ── */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <div className="text-center mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Framework
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              The HCU Ladder
            </h2>
            <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/60 max-w-2xl mx-auto">
              Most systems stop at shelter. HABITABLE is a ladder designed to
              move working homeless households from crisis to stability to
              ownership to bankable housing.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {HCU_TIERS.map((tier, i) => (
              <div
                key={tier.tier}
                className={`reveal-up stagger-${(i % 4) + 1} ${tier.color} ${tier.textColor} rounded-2xl p-8 md:p-10 transition-transform duration-500 hover:-translate-y-1 hover:shadow-xl`}
                style={{ marginLeft: `${i * 2}%`, marginRight: `${(4 - i) * 2}%` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-sans text-xs uppercase tracking-widest opacity-60">
                      {tier.tier}
                    </span>
                    <span className="font-serif text-xl md:text-2xl font-bold">
                      {tier.name}
                    </span>
                  </div>
                  <div className="hidden sm:block h-px flex-1 bg-current opacity-15" />
                  <p className="font-serif text-sm md:text-base opacity-80 leading-[1.7] sm:max-w-sm">
                    {tier.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nesting Pods ── */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container">
          <div className="text-center mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Unit
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              Why Nesting Pods Matter
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {NESTING_BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className={`reveal-up stagger-${i + 1} p-8 md:p-10 rounded-2xl bg-cream transition-transform duration-500 hover:-translate-y-2`}
              >
                <div className="text-forest mb-6">{b.icon}</div>
                <h3 className="font-serif text-lg font-bold text-charcoal mb-3">
                  {b.title}
                </h3>
                <p className="font-serif text-sm text-charcoal/60 leading-[1.8]">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Robotic Fabrication ── */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-5">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Method
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15] mb-8">
              Robotic Fabrication
              <br />
              <span className="text-forest">(With Human Assembly)</span>
            </h2>
            <p className="reveal-left stagger-2 font-serif text-xl text-charcoal/80 leading-[1.6] italic">
              Robots do the precision work. People do the assembly. The future
              of housing is built by humans — with robotic tools that multiply
              what humans can do.
            </p>
            <div className="reveal-left stagger-3 mt-10 aspect-[4/3] rounded-2xl overflow-hidden hidden md:block">
              <img src={prototype} alt="Housing prototype under construction with crane" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7 flex flex-col justify-center gap-8">
            {[
              "Robotic cutting increases dimensional accuracy, reduces rework, and reduces material waste.",
              "Human assembly keeps the work local, teachable, and job-creating.",
              "This shifts housing delivery from a scarce-skilled-labor bottleneck to a repeatable community build process.",
            ].map((point, i) => (
              <div
                key={i}
                className={`reveal-right stagger-${i + 1} flex gap-5 items-start`}
              >
                <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-forest" />
                </div>
                <p className="font-serif text-base md:text-lg text-charcoal/70 leading-[1.8]">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pull Quote ── */}
      <section className="relative py-28 md:py-40 bg-charcoal diagonal-top diagonal-bottom overflow-hidden">
        <img src={workbench} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="page-container relative z-10 text-center max-w-4xl mx-auto">
          <blockquote className="reveal-scale font-serif text-2xl md:text-4xl lg:text-5xl text-cream leading-[1.5] font-bold italic">
            "We don't just build housing. We build builders — and builders
            build the next one."
          </blockquote>
        </div>
      </section>

      {/* ── The Foundation ── */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <div className="text-center mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Engine
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              How We Create Builders,
              <br />Not Just Buildings
            </h2>
            <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/60 max-w-2xl mx-auto">
              A $5M endowment generates approximately $250K/year in perpetual
              funding to support workforce development and reduce barriers for
              working adults.
            </p>
          </div>

          {/* Editorial image */}
          <div className="reveal-up stagger-3 mb-14 aspect-[21/9] rounded-2xl overflow-hidden">
            <img src={fellowship} alt="Fellows planning and organizing at workstation" className="w-full h-full object-cover" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
            {/* Endowment */}
            <div className="reveal-up p-10 md:p-14 rounded-2xl border bg-amber/10 border-amber/30">
              <h3 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-8">
                What the Endowment Funds
              </h3>
              <ul className="space-y-5">
                {ENDOWMENT_FUNDS.map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-amber mt-2.5 shrink-0" />
                    <span className="font-serif text-base text-charcoal/70 leading-[1.7]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Flywheel */}
            <div className="reveal-up stagger-1 p-10 md:p-14 rounded-2xl border bg-forest/10 border-forest/30">
              <h3 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-8">
                The Fellowship-to-Instruction Flywheel
              </h3>
              <div className="space-y-6">
                {FLYWHEEL_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="font-sans text-xs font-bold text-forest bg-forest/10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="font-serif text-base text-charcoal/70 leading-[1.7]">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Opportunity Zones ── */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-5">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Where
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15] mb-8">
              Opportunity Zones: Turning Capital Into Local Capacity
            </h2>
            <p className="reveal-left stagger-2 font-serif text-lg text-charcoal/70 leading-[1.8] mb-8">
              Opportunity Zones were created to attract investment into
              underserved communities, but many projects have focused on real
              estate outcomes without reliably improving resident outcomes.
              HABITABLE proposes tying investment to measurable resident
              outcomes — skills, jobs, stability, and ownership.
            </p>
            <div className="reveal-left stagger-3 aspect-[16/9] rounded-2xl overflow-hidden mb-8 hidden md:block">
              <img src={ranchLand} alt="Idaho ranch land — potential housing site" className="w-full h-full object-cover" />
            </div>
            <div className="reveal-left stagger-3 p-6 rounded-xl bg-sage/10 border border-sage/30">
              <p className="font-sans text-xs uppercase tracking-widest text-charcoal/60 mb-3">
                Recommended launch sequence
              </p>
              <p className="font-serif text-base text-charcoal/80 leading-[1.7]">
                <strong>Boise</strong> (demonstration + visibility) &rarr;{" "}
                <strong>North Nampa</strong> (training + throughput) &rarr;{" "}
                <strong>Caldwell</strong> (replication + ownership pilots)
              </p>
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="reveal-right font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-6">
              OZ Site Selection Criteria
            </p>
            <div className="space-y-4">
              {OZ_CRITERIA.map((criterion, i) => (
                <div
                  key={i}
                  className={`reveal-right stagger-${i + 1} flex gap-5 items-start p-6 rounded-xl bg-cream`}
                >
                  <span className="font-sans text-sm font-bold text-charcoal/30 shrink-0 w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-base text-charcoal/70 leading-[1.7]">
                    {criterion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Business Model ── */}
      <section className="py-24 md:py-36">
        <div className="page-container max-w-4xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Model
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              Business Model
            </h2>
            <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/60 max-w-2xl mx-auto">
              HABITABLE scales as a network, not a single factory. Digital
              fabrication enables kits to be produced with robotic precision,
              shipped flat, and assembled locally by certified builders.
            </p>
          </div>

          {/* Value Chain */}
          <div className="reveal-up stagger-3 p-8 md:p-12 rounded-2xl bg-charcoal/[0.03] border border-charcoal/10 mb-12">
            <p className="font-sans text-xs uppercase tracking-widest text-charcoal/50 mb-6">
              The HABITABLE Value Chain
            </p>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {[
                "Design as Data",
                "Robotic Fabrication",
                "Kit Delivery",
                "Human Assembly",
                "Nesting Pods",
                "Fellowship Scholarships",
                "Certified Builders",
                "Instructors",
                "OZ Deployment Nodes",
                "Annual Scoreboard",
              ].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2 md:gap-3">
                  <span className="font-serif text-sm md:text-base text-charcoal/80 whitespace-nowrap">
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-forest/60 text-lg" aria-hidden="true">&rarr;</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="reveal-up p-8 rounded-2xl border bg-forest/10 border-forest/30">
              <h3 className="font-serif text-lg font-bold text-charcoal mb-4">
                Revenue
              </h3>
              <ul className="space-y-3">
                {[
                  "Kit sales (DIY / assisted / turnkey)",
                  "Certification and training tuition (with Foundation scholarships)",
                  "Licensing / network fees for certified builders who sell kits",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-forest mt-2.5 shrink-0" />
                    <span className="font-serif text-sm text-charcoal/70 leading-[1.7]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal-up stagger-1 p-8 rounded-2xl border bg-amber/10 border-amber/30">
              <h3 className="font-serif text-lg font-bold text-charcoal mb-4">
                Equity
              </h3>
              <ul className="space-y-3">
                {[
                  "Scholarships + health support",
                  "Roth IRA match",
                  "Build-your-first-house funding",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber mt-2.5 shrink-0" />
                    <span className="font-serif text-sm text-charcoal/70 leading-[1.7]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Accountability ── */}
      <section className="py-20 md:py-28 bg-warm-white">
        <div className="page-container max-w-3xl mx-auto text-center">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
            Public Accountability
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal mb-6">
            Annual Impact Report
          </h2>
          <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/70 leading-[1.8]">
            Each year we publish a public Impact Report — a simple report card
            showing exactly what we built and what changed. We track Housing
            Capacity Units deployed, Career Units completed, and Social Repair
            Index change. We include participant outcomes, what we learned, what
            we improved, and next-year goals. We do not measure success by
            activity. We measure capacity gained.
          </p>
        </div>
      </section>

      {/* ── Policy Tailwinds ── */}
      <section className="py-24 md:py-36">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-4">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Policy Context
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15]">
              Policy Tailwinds
            </h2>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="reveal-right font-serif text-lg text-charcoal/70 leading-[1.8] mb-8">
              HABITABLE sites may be eligible for public incentives that support
              domestic wood product manufacturing, job creation in underserved
              areas, and energy-efficient new home construction.
            </p>
            <div className="space-y-4">
              {[
                "USDA / US Forest Service Wood Innovations grants supporting domestic wood products and manufacturing.",
                "Federal and state programs supporting domestic manufacturing and workforce training tied to local job creation.",
                "IRS Section 45L energy-efficient home credits (based on certification pathway and home type).",
              ].map((item, i) => (
                <div
                  key={i}
                  className={`reveal-right stagger-${i + 1} flex gap-4 items-start`}
                >
                  <div className="w-6 h-6 rounded-full bg-sage/10 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                  </div>
                  <p className="font-serif text-base text-charcoal/70 leading-[1.7]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Conclusion ── */}
      <section className="relative py-28 md:py-40 bg-moss overflow-hidden">
        <div className="page-container relative z-10 text-center max-w-3xl mx-auto">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/50 mb-8">
            Conclusion
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-cream leading-[1.3] mb-8">
            The working homeless crisis is the workforce crisis.
          </h2>
          <p className="reveal-up stagger-2 font-serif text-lg text-cream/70 leading-[1.8] mb-12">
            HABITABLE is designed to test — rigorously and transparently —
            whether housing can be built like infrastructure and whether
            stability can be financed like strength. By year 10, our targets
            are clear: 10,000+ Housing Capacity Units, 1,000 Career Units, and
            a +20% improvement in Social Repair. We will publish annual results
            so the model can be audited, improved, and replicated.
          </p>
          <Link
            to="/get-involved"
            className="reveal-up stagger-3 inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300"
          >
            Get Involved
          </Link>
        </div>
      </section>

      {/* ── References ── */}
      <section className="py-20 md:py-28 bg-charcoal">
        <div className="page-container max-w-3xl mx-auto">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/40 mb-10">
            References
          </p>
          <ol className="space-y-4">
            {REFERENCES.map((ref, i) => (
              <li key={i} className="reveal-up flex gap-4 items-start">
                <span className="font-sans text-xs text-cream/30 shrink-0 w-5 mt-1 text-right">
                  {i + 1}.
                </span>
                <span className="font-serif text-sm text-cream/50 leading-[1.7]">
                  {ref}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
