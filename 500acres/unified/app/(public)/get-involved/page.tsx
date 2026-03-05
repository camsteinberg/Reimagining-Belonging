'use client';

import { useState } from 'react';
import Link from 'next/link';
import useReveal from '@/hooks/useReveal';
import SectionHeader from '@/components/public/shared/SectionHeader';
import SectionDivider from '@/components/public/shared/SectionDivider';
import heroConstruction from '@/assets/photos/getinvolved-hero-crane.webp';
import cardApply from '@/assets/photos/card-apply.webp';
import cardAttend from '@/assets/photos/card-attend.webp';
import cardBuild from '@/assets/photos/card-build.webp';
import { StaticImageData } from 'next/image';
import React from 'react';

/* ---- Constants ---- */

interface EngagementStep {
  num: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
  linkTo: string;
  linkLabel: string;
  isAnchor?: boolean;
  isExternal?: boolean;
  image: StaticImageData;
}

const ENGAGEMENT_STEPS: EngagementStep[] = [
  {
    num: "01",
    title: "Apply",
    desc: "Join the next fellowship cohort. Learn digital fabrication, timber framing, and small-business skills through the Six Steps curriculum — and build your path to homeownership.",
    color: "text-amber",
    bg: "bg-amber/8",
    linkTo: "#volunteer-form",
    linkLabel: "Express interest",
    isAnchor: true,
    image: cardApply,
  },
  {
    num: "02",
    title: "Attend",
    desc: "Join the monthly Live Forum — the last Friday of every month. Hear from the team, see build progress, ask questions, and connect with the 500 Acres community.",
    color: "text-clay",
    bg: "bg-clay/8",
    linkTo: "/resources",
    linkLabel: "See upcoming events",
    isExternal: false,
    image: cardAttend,
  },
  {
    num: "03",
    title: "Build",
    desc: "Volunteer for a build weekend and get hands-on with real construction. No experience required — just a willingness to learn, lift, and work alongside the crew.",
    color: "text-sage",
    bg: "bg-sage/8",
    linkTo: "#build",
    linkLabel: "Learn more",
    isAnchor: true,
    image: cardBuild,
  },
];

const FAQ_ITEMS = [
  {
    question: "Is there a cost to participate?",
    answer:
      "No. The 500 Acres fellowship is fully funded through our Foundation endowment. Fellows receive training, materials, and mentorship at no cost. We also provide scholarship support for certifications, and participants in our matched savings program receive Roth IRA contributions to begin building wealth.",
  },
  {
    question: "How long is the fellowship?",
    answer:
      "The core fellowship runs approximately 12 weeks, covering the full Six Steps curriculum — from digital fabrication and CNC operation to timber framing, assembly, and small-business skills. After the initial cohort, graduates can continue into advanced roles as certified builders or instructors, which extends the engagement over several months.",
  },
  {
    question: "Where does the program take place?",
    answer:
      "Training and builds take place near national park gateway communities in Idaho, starting in the Boise-Nampa-Caldwell corridor. Our first site pipeline includes locations near Grand Canyon, Yellowstone, Bryce Canyon, and Olympic National Park. Fellows should be prepared to work on-site during build weekends.",
  },
  {
    question: "Do I need construction experience?",
    answer:
      "Not at all. The fellowship is designed for people with no prior building experience. The Six Steps curriculum starts from the fundamentals — safety, tool operation, reading plans — and progressively builds to CNC fabrication and full housing assembly. All you need is a willingness to learn, show up, and work alongside the crew.",
  },
];

/* ---- Component ---- */

export default function GetInvolvedPage() {
  const ref = useReveal();
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    interest: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormState({ firstName: "", lastName: "", email: "", interest: "", message: "" });
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    const id = href?.replace("#", "");
    const el = id ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero -- immersive full-bleed with CTA */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-14 md:pb-20 lg:pb-28 bg-charcoal overflow-hidden">
        <img src={heroConstruction.src} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        {/* Decorative blobs */}
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-bark/20 blob pointer-events-none blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[10%] right-[15%] w-[25vw] h-[25vw] bg-amber/15 blob pointer-events-none blur-3xl" aria-hidden="true" />
        <div className="absolute top-[60%] left-[50%] w-[20vw] h-[20vw] bg-sage/10 blob pointer-events-none blur-3xl" aria-hidden="true" />

        <div className="page-container relative z-10 w-full">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/70 mb-10">
            Get Involved
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-cream mb-8">
            Build with
            <br />
            <span className="italic text-sage">us.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-cream/70 max-w-md leading-[1.8] mb-10">
            500 Acres brings together fellows, builders, and supporters to
            transform land near national parks into homes. Whether you want to
            train in digital fabrication, volunteer for a build weekend, or
            support the mission — there&apos;s a way in.
          </p>
          {/* CTA button in hero -- unique to Get Involved */}
          <a
            href="#volunteer-form"
            onClick={scrollToSection}
            className="reveal-up stagger-3 inline-block bg-ember text-cream px-8 sm:px-10 py-3 sm:py-4 rounded-full font-serif text-base sm:text-lg font-bold btn-pill hover:bg-clay"
          >
            Express Interest
          </a>
        </div>
      </section>

      {/* Engagement funnel -- featured Apply card + 2-column grid */}
      <section className="py-16 md:py-24 lg:py-36">
        <div className="page-container">
          <SectionHeader
            label="Your Journey"
            title="Three ways in."
            className="mb-20 md:mb-24"
          />

          {/* Featured Apply card -- full width, horizontal layout */}
          {(() => {
            const applyStep = ENGAGEMENT_STEPS[0];
            return (
              <a
                href={applyStep.linkTo}
                onClick={scrollToSection}
                className="reveal-scale group relative block border-2 border-amber/30 bg-amber/10 rounded-2xl p-10 md:p-16 mb-10 md:mb-14 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                  <div className="w-full aspect-video rounded-xl overflow-hidden">
                    <img src={applyStep.image.src} alt={applyStep.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl md:text-4xl font-bold text-charcoal mb-8">
                      {applyStep.title}
                    </h3>
                    <p className="font-serif text-base text-charcoal/60 leading-[1.85] mb-10 max-w-sm">
                      {applyStep.desc}
                    </p>
                    <div className="flex items-center gap-2 text-charcoal/50 group-hover:text-charcoal transition-colors">
                      <span className="font-sans text-sm">{applyStep.linkLabel}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-2">&rarr;</span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })()}

          {/* Attend + Build -- standard 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
            {ENGAGEMENT_STEPS.slice(1).map((step, i) => {
              const revealClass = i === 0 ? "reveal-left" : "reveal-right";
              const cardContent = (
                <>
                  <div className="w-full aspect-video rounded-xl overflow-hidden mb-6">
                    <img src={step.image.src} alt={step.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl font-bold text-charcoal mb-8">
                    {step.title}
                  </h3>
                  <p className="font-serif text-base text-charcoal/60 leading-[1.85] mb-10 max-w-sm">
                    {step.desc}
                  </p>
                  <div className="flex items-center gap-2 text-charcoal/50 group-hover:text-charcoal transition-colors">
                    <span className="font-sans text-sm">{step.linkLabel}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2">&rarr;</span>
                  </div>
                </>
              );

              const cardClasses = `${revealClass} stagger-${i + 1} group relative block ${step.bg} rounded-2xl p-10 md:p-16 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl`;

              if (step.isAnchor) {
                return (
                  <a
                    key={step.num}
                    href={step.linkTo}
                    onClick={scrollToSection}
                    className={cardClasses}
                  >
                    {cardContent}
                  </a>
                );
              }

              return (
                <Link
                  key={step.num}
                  href={step.linkTo}
                  className={cardClasses}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* FAQ Accordion */}
      <section className="py-16 md:py-24 lg:py-36">
        <div className="page-container max-w-3xl mx-auto">
          <SectionHeader
            label="Common Questions"
            title="Frequently Asked"
            align="center"
            className="mb-16 md:mb-20"
          />

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              const panelId = `faq-panel-${i}`;
              const buttonId = `faq-button-${i}`;
              return (
                <div
                  key={i}
                  className={`reveal-up stagger-${(i % 4) + 1} rounded-2xl border border-charcoal/10 overflow-hidden transition-colors duration-300 ${isOpen ? "bg-charcoal/[0.03]" : ""}`}
                >
                  <h3>
                    <button
                      id={buttonId}
                      onClick={() => toggleFaq(i)}
                      className="w-full flex items-center justify-between p-6 md:p-8 text-left cursor-pointer"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span className="font-serif text-lg md:text-xl font-bold text-charcoal pr-8">
                        {item.question}
                      </span>
                      <span
                        className="shrink-0 w-10 h-10 rounded-full border border-charcoal/20 flex items-center justify-center text-charcoal/60 transition-transform duration-300"
                        style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    aria-hidden={!isOpen}
                    className={`accordion-panel${isOpen ? " is-open" : ""}`}
                  >
                    <div className="accordion-inner">
                      <div className="px-6 md:px-8 pb-6 md:pb-8">
                        <p className="font-serif text-base text-charcoal/60 leading-[1.8]">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Volunteer form -- editorial split layout */}
      <section id="volunteer-form" className="py-16 md:py-24 lg:py-36 bg-warm-white">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-4">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Get Started
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15] mb-6">
              Express
              <br />interest.
            </h2>
            <p className="reveal-left stagger-2 font-serif text-base text-charcoal/70">
              Tell us about yourself and what interests you. Whether you&apos;re
              exploring the fellowship, want to volunteer at a build weekend,
              or have another way to contribute — we want to hear from you.
            </p>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            {submitted ? (
              <div className="success-enter flex flex-col items-center justify-center text-center py-16 md:py-20">
                <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-forest"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-4">
                  Thanks for reaching out.
                </h3>
                <p className="font-serif text-base text-charcoal/70 max-w-sm mb-8">
                  We&apos;ve received your message and a member of our team will
                  get back to you soon.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="group flex items-center gap-3 text-charcoal/60 hover:text-charcoal font-sans text-sm transition-colors"
                >
                  <span className="transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
                  <span>Submit another response</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="reveal-right space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="relative">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formState.firstName}
                      onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                      className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-3 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                      placeholder="First Name"
                    />
                    <label
                      htmlFor="firstName"
                      className="absolute left-3 top-4 font-sans text-sm text-charcoal/60 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                    >
                      First Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formState.lastName}
                      onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                      className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-3 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                      placeholder="Last Name"
                    />
                    <label
                      htmlFor="lastName"
                      className="absolute left-3 top-4 font-sans text-sm text-charcoal/60 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                    >
                      Last Name
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-3 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                    placeholder="Email"
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-3 top-4 font-sans text-sm text-charcoal/60 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    Email
                  </label>
                </div>

                <div className="relative">
                  <label htmlFor="interest" className="sr-only">
                    How would you like to help?
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    value={formState.interest}
                    onChange={(e) => setFormState({ ...formState, interest: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-charcoal/15 px-3 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>What are you interested in?</option>
                    <option value="fellowship">Fellowship Application</option>
                    <option value="build-weekend">Build Weekend Volunteer</option>
                    <option value="live-forum">Live Forum RSVP</option>
                    <option value="general">General Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal/50 pointer-events-none">&darr;</span>
                </div>

                <div className="relative">
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-3 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none placeholder-transparent"
                    placeholder="Message"
                  />
                  <label
                    htmlFor="message"
                    className="absolute left-3 top-4 font-sans text-sm text-charcoal/60 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    Tell us about yourself...
                  </label>
                </div>

                <button
                  type="submit"
                  className="group flex items-center gap-4 bg-charcoal text-cream px-10 py-4 rounded-full font-serif text-lg btn-pill hover:bg-moss hover:gap-6 mt-4"
                >
                  <span>Submit</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Build section anchor */}
      <section id="build" className="py-16 md:py-24 lg:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
            Build Program
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-10">
            Hands-on training,
            <br />
            <span className="italic text-forest">real housing.</span>
          </h2>
          <div className="reveal-up stagger-2 max-w-2xl">
            <p className="font-serif text-base md:text-lg text-charcoal/60 leading-[1.8] mb-8">
              Our build weekends bring fellows and volunteers together on real
              sites near national parks. Working side by side, crews learn
              digital fabrication with CNC and ShopBot tools, assemble Camp Pod
              kits, and raise structures that become workforce housing.
            </p>
            <p className="font-serif text-base md:text-lg text-charcoal/60 leading-[1.8]">
              Apply for a fellowship to learn the Six Steps curriculum — from
              digital fabrication to timber framing to small-business skills. Or
              volunteer for a build weekend and get hands-on with construction.
              No prior experience needed.
            </p>
          </div>
        </div>
      </section>

      {/* Donate -- dramatic CTA */}
      <section className="relative py-16 md:py-28 lg:py-40 bg-charcoal overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-sage/5 rounded-full blur-3xl" aria-hidden="true" />
        </div>
        <div className="page-container relative z-10 text-center">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/70 mb-10">
            Support
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-cream leading-[1.05] mb-6">
            Help us build homes
            <br />
            <span className="italic text-sage">where they&apos;re needed most.</span>
          </h2>
          <p className="reveal-up stagger-2 font-serif text-lg text-cream/60 max-w-xl mx-auto mb-10">
            Your contribution helps acquire land near national parks, fund
            fellowship training, produce housing kits, and create communities
            where the next generation can afford to live and build careers.
          </p>
          <a
            href="https://donate.500acres.org"
            target="_blank"
            rel="noopener noreferrer"
            className="reveal-up stagger-3 inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold btn-pill hover:bg-sage hover:text-cream"
          >
            Donate
          </a>
        </div>
      </section>
    </div>
  );
}
