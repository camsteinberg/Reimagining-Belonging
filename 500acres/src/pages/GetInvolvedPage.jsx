import { useState } from "react";
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import heroConstruction from "../assets/photos/getinvolved-hero-crane.webp";
import cardApply from "../assets/photos/card-apply.webp";
import cardAttend from "../assets/photos/card-attend.webp";
import cardBuild from "../assets/photos/card-build.webp";
import timelineResearch from "../assets/photos/timeline-research.webp";
import timelinePrototype from "../assets/photos/timeline-prototype.webp";

/* ───────────────────────────── Constants ───────────────────────────── */

const ENGAGEMENT_STEPS = [
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

const TIMELINE_STEPS = [
  {
    label: "Apply",
    desc: "Submit your interest and background info through the online form.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    ),
    color: "bg-amber",
  },
  {
    label: "Cohort Start",
    desc: "Get matched with a cohort of fellows and meet the training team.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
        <path d="M1 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
      </svg>
    ),
    color: "bg-clay",
  },
  {
    label: "Training",
    desc: "Complete the Six Steps curriculum — CNC fabrication, framing, and business skills.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </svg>
    ),
    color: "bg-forest",
    image: timelineResearch,
  },
  {
    label: "Build Weekend",
    desc: "Hands-on construction at a real site near a national park.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" />
        <path d="M5 20V8l7-5 7 5v12" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
    color: "bg-sage",
    image: timelinePrototype,
  },
  {
    label: "Ownership Path",
    desc: "Transition from fellow to certified builder, instructor, or homeowner.",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
      </svg>
    ),
    color: "bg-moss",
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

/* ───────────────────────────── Component ───────────────────────────── */

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
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormState({ firstName: "", lastName: "", email: "", interest: "", message: "" });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setNewsletterSubmitted(true);
    setNewsletterEmail("");
  };

  const scrollToSection = (e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    const id = href?.replace("#", "");
    const el = id ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero -- immersive full-bleed */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28 bg-charcoal overflow-hidden">
        <img src={heroConstruction} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        {/* Animated gradient blobs */}
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-bark/20 blob pointer-events-none blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[10%] right-[15%] w-[25vw] h-[25vw] bg-amber/15 blob pointer-events-none blur-3xl" aria-hidden="true" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[60%] left-[50%] w-[20vw] h-[20vw] bg-sage/10 blob pointer-events-none blur-3xl" aria-hidden="true" style={{ animationDelay: "-6s" }} />

        <div className="page-container relative z-10 w-full">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/70 mb-10">
            Get Involved
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-cream mb-8">
            Build with
            <br />
            <span className="italic text-sage">us.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-cream/70 max-w-md leading-[1.8]">
            500 Acres brings together fellows, builders, and supporters to
            transform land near national parks into homes. Whether you want to
            train in digital fabrication, volunteer for a build weekend, or
            support the mission — there's a way in.
          </p>
        </div>
      </section>

      {/* Engagement funnel -- stacked editorial cards */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
            Your Journey
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-20 md:mb-24">
            Three ways in.
          </h2>

          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-14">
            {ENGAGEMENT_STEPS.map((step, i) => {
              const cardContent = (
                <>
                  <div className="w-full aspect-video rounded-xl overflow-hidden mb-6">
                    <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <span className={`block font-sans text-6xl font-bold ${step.color} opacity-15 mb-6`}>
                    {step.num}
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl font-bold text-charcoal mb-8">
                    {step.title}
                  </h3>
                  <p className="font-serif text-base text-charcoal/60 leading-[1.85] mb-10 max-w-sm">
                    {step.desc}
                  </p>
                  {/* Arrow on hover */}
                  <div className="flex items-center gap-2 text-charcoal/50 group-hover:text-charcoal transition-colors">
                    <span className="font-sans text-sm">{step.linkLabel}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-2">&rarr;</span>
                  </div>
                </>
              );

              const cardClasses = `reveal-up stagger-${i + 1} group relative block ${step.bg} rounded-2xl p-10 md:p-16 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl`;

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
                  to={step.linkTo}
                  className={cardClasses}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application Timeline */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container">
          <div className="text-center mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              The Process
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              Your path from application to ownership.
            </h2>
            <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/60 max-w-2xl mx-auto">
              The fellowship is a structured journey — each step builds on the
              last, leading from interest to impact.
            </p>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-10 left-[10%] right-[10%] h-[2px] bg-charcoal/10" aria-hidden="true" />

              <div className="grid grid-cols-5 gap-6">
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step.label} className={`reveal-up stagger-${(i % 4) + 1} flex flex-col items-center text-center`}>
                    {/* Circle node */}
                    <div className={`relative z-10 w-20 h-20 rounded-full ${step.color} text-cream flex items-center justify-center mb-6 transition-transform duration-500 hover:scale-110`}>
                      {step.icon}
                    </div>
                    <h4 className="font-serif text-lg font-bold text-charcoal mb-2">
                      {step.label}
                    </h4>
                    <p className="font-serif text-sm text-charcoal/60 leading-[1.7] max-w-[180px]">
                      {step.desc}
                    </p>
                    {step.image && (
                      <div className="mt-4 w-full aspect-video rounded-xl overflow-hidden">
                        <img src={step.image} alt={step.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="md:hidden">
            <div className="relative pl-12">
              {/* Vertical connector line */}
              <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-charcoal/10" aria-hidden="true" />

              <div className="space-y-12">
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step.label} className={`reveal-up stagger-${(i % 4) + 1} relative`}>
                    {/* Circle node */}
                    <div className={`absolute -left-12 top-0 w-10 h-10 rounded-full ${step.color} text-cream flex items-center justify-center z-10`}>
                      <div className="w-4 h-4">{step.icon}</div>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-charcoal mb-2">
                      {step.label}
                    </h4>
                    <p className="font-serif text-sm text-charcoal/60 leading-[1.7]">
                      {step.desc}
                    </p>
                    {step.image && (
                      <div className="mt-4 w-full aspect-video rounded-xl overflow-hidden">
                        <img src={step.image} alt={step.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* FAQ Accordion */}
      <section className="py-24 md:py-36">
        <div className="page-container max-w-3xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Common Questions
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal">
              Frequently Asked
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`reveal-up stagger-${(i % 4) + 1} rounded-2xl border border-charcoal/10 overflow-hidden transition-colors duration-300 ${openFaq === i ? "bg-charcoal/[0.03]" : ""}`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-serif text-lg md:text-xl font-bold text-charcoal pr-8">
                    {item.question}
                  </span>
                  <span
                    className="shrink-0 w-8 h-8 rounded-full border border-charcoal/20 flex items-center justify-center text-charcoal/60 transition-transform duration-300"
                    style={{ transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openFaq === i ? "400px" : "0px",
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <p className="font-serif text-base text-charcoal/60 leading-[1.8]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* Volunteer form -- editorial split layout */}
      <section id="volunteer-form" className="py-24 md:py-36 bg-warm-white">
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
              Tell us about yourself and what interests you. Whether you're
              exploring the fellowship, want to volunteer at a build weekend,
              or have another way to contribute — we want to hear from you.
            </p>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            {submitted ? (
              <div className="reveal-right flex flex-col items-center justify-center text-center py-16 md:py-20">
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
                  We've received your message and a member of our team will
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
                    <option value="">What are you interested in?</option>
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
                  className="group flex items-center gap-4 bg-charcoal text-cream px-10 py-4 rounded-full font-serif text-lg transition-all duration-300 hover:bg-moss hover:gap-6 mt-4"
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
      <section id="build" className="py-24 md:py-36">
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

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* Newsletter signup */}
      <section className="py-24 md:py-36 bg-cream">
        <div className="page-container max-w-2xl mx-auto text-center">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
            Stay Connected
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Updates from
            <br />
            <span className="italic text-hearth">the field.</span>
          </h2>
          <p className="reveal-up stagger-2 font-serif text-base text-charcoal/70 mb-10 max-w-md mx-auto">
            Build progress, fellowship announcements, and Live Forum
            invitations — delivered to your inbox, never more than twice
            a month.
          </p>

          {newsletterSubmitted ? (
            <div className="reveal-up stagger-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-forest"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-serif text-lg text-charcoal/70">
                You're in. We'll be in touch.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="reveal-up stagger-3 flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto"
            >
              <div className="relative flex-1 w-full">
                <input
                  id="newsletterEmail"
                  name="newsletterEmail"
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-3 py-3 font-serif text-base text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                  placeholder="Email address"
                />
                <label
                  htmlFor="newsletterEmail"
                  className="absolute left-3 top-3 font-sans text-sm text-charcoal/60 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Email address
                </label>
              </div>
              <button
                type="submit"
                className="group flex items-center gap-3 bg-charcoal text-cream px-8 py-3 rounded-full font-serif text-base transition-all duration-300 hover:bg-forest hover:gap-4 shrink-0"
              >
                <span>Subscribe</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Donate -- dramatic CTA */}
      <section className="relative py-28 md:py-40 bg-charcoal overflow-hidden">
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
            <span className="italic text-sage">where they're needed most.</span>
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
            className="reveal-up stagger-3 inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300"
          >
            Donate
          </a>
        </div>
      </section>
    </div>
  );
}
