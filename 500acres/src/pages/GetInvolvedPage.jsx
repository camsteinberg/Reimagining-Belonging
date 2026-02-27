import { useState } from "react";
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import heroConstruction from "../assets/photos/getinvolved-hero-crane.webp";
import cardApply from "../assets/photos/card-apply.webp";
import cardAttend from "../assets/photos/card-attend.webp";
import cardBuild from "../assets/photos/card-build.webp";

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

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero -- immersive full-bleed */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28 bg-charcoal overflow-hidden">
        <img src={heroConstruction} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        {/* Animated gradient blobs */}
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-bark/20 blob pointer-events-none blur-3xl" />
        <div className="absolute bottom-[10%] right-[15%] w-[25vw] h-[25vw] bg-amber/15 blob pointer-events-none blur-3xl" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[60%] left-[50%] w-[20vw] h-[20vw] bg-sage/10 blob pointer-events-none blur-3xl" style={{ animationDelay: "-6s" }} />

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
                    <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
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
                    <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-sage/5 rounded-full blur-3xl" />
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
