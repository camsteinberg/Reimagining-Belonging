import { useState } from "react";
import useReveal from "../hooks/useReveal";

const ENGAGEMENT_STEPS = [
  {
    num: "01",
    title: "Learn",
    desc: "Explore our research, stories, and resources to understand the Gen Z housing crisis.",
    color: "text-amber",
    bg: "bg-amber/8",
  },
  {
    num: "02",
    title: "Volunteer",
    desc: "Join our community of builders, designers, and advocates working toward equitable housing.",
    color: "text-clay",
    bg: "bg-clay/8",
  },
  {
    num: "03",
    title: "Build",
    desc: "Apply for fellowships, attend build events, or become a campus ambassador.",
    color: "text-sage",
    bg: "bg-sage/8",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your interest! We'll be in touch soon.");
    setFormState({ firstName: "", lastName: "", email: "", interest: "", message: "" });
  };

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero — immersive full-bleed */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28 bg-charcoal overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-bark/20 blob pointer-events-none blur-3xl" />
        <div className="absolute bottom-[10%] right-[15%] w-[25vw] h-[25vw] bg-amber/15 blob pointer-events-none blur-3xl" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[60%] left-[50%] w-[20vw] h-[20vw] bg-sage/10 blob pointer-events-none blur-3xl" style={{ animationDelay: "-6s" }} />

        <div className="page-container relative z-10 w-full">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/30 mb-10">
            Get Involved
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-cream mb-8">
            Join the
            <br />
            <span className="italic text-sage">movement.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-cream/50 max-w-md leading-relaxed">
            There are many ways to get involved with 500 Acres. Whether you want
            to learn, volunteer, or build — there's a place for you.
          </p>
        </div>
      </section>

      {/* Engagement funnel — stacked editorial cards */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-4">
            Your Journey
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-16 md:mb-20">
            Three ways in.
          </h2>

          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
            {ENGAGEMENT_STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`reveal-up stagger-${i + 1} group relative ${step.bg} rounded-2xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl`}
              >
                <span className={`block font-sans text-6xl font-bold ${step.color} opacity-15 mb-3`}>
                  {step.num}
                </span>
                <h3 className="font-serif text-3xl md:text-4xl font-bold text-charcoal mb-4">
                  {step.title}
                </h3>
                <p className="font-serif text-base text-charcoal/60 leading-relaxed mb-5">
                  {step.desc}
                </p>
                {/* Arrow on hover */}
                <div className="flex items-center gap-2 text-charcoal/30 group-hover:text-charcoal transition-colors">
                  <span className="font-sans text-sm">Explore</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
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

      {/* Volunteer form — editorial split layout */}
      <section className="py-24 md:py-36 bg-warm-white">
        <div className="page-container grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-20">
          <div className="md:col-span-4">
            <p className="reveal-left font-sans text-xs uppercase tracking-[0.4em] text-charcoal/40 mb-4">
              Volunteer
            </p>
            <h2 className="reveal-left stagger-1 font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15] mb-6">
              Raise your
              <br />hand.
            </h2>
            <p className="reveal-left stagger-2 font-serif text-base text-charcoal/50 leading-relaxed">
              Tell us a bit about yourself and how you'd like to contribute.
              Every skill matters — from design to advocacy to showing up.
            </p>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <form onSubmit={handleSubmit} className="reveal-right space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formState.firstName}
                    onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                    className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-0 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                    placeholder="First Name"
                  />
                  <label className="absolute left-0 top-4 font-sans text-sm text-charcoal/40 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs">
                    First Name
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formState.lastName}
                    onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                    className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-0 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                    placeholder="Last Name"
                  />
                  <label className="absolute left-0 top-4 font-sans text-sm text-charcoal/40 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs">
                    Last Name
                  </label>
                </div>
              </div>

              <div className="relative">
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-0 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors placeholder-transparent"
                  placeholder="Email"
                />
                <label className="absolute left-0 top-4 font-sans text-sm text-charcoal/40 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs">
                  Email
                </label>
              </div>

              <div className="relative">
                <select
                  value={formState.interest}
                  onChange={(e) => setFormState({ ...formState, interest: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-charcoal/15 px-0 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors appearance-none cursor-pointer"
                >
                  <option value="">How would you like to help?</option>
                  <option value="volunteer">General Volunteer</option>
                  <option value="fellowship">Fellowship Application</option>
                  <option value="ambassador">Campus Ambassador</option>
                  <option value="events">Event Support</option>
                  <option value="other">Other</option>
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal/30 pointer-events-none">↓</span>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="peer w-full bg-transparent border-b-2 border-charcoal/15 px-0 py-4 font-serif text-lg text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none placeholder-transparent"
                  placeholder="Message"
                />
                <label className="absolute left-0 top-4 font-sans text-sm text-charcoal/40 transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs">
                  Tell us about yourself...
                </label>
              </div>

              <button
                type="submit"
                className="group flex items-center gap-4 bg-charcoal text-cream px-10 py-4 rounded-full font-serif text-lg transition-all duration-300 hover:bg-moss hover:gap-6 mt-4"
              >
                <span>Submit</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Donate — dramatic CTA */}
      <section className="relative py-28 md:py-40 bg-charcoal overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-sage/5 rounded-full blur-3xl" />
        </div>
        <div className="page-container relative z-10 text-center">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-cream/30 mb-10">
            Support
          </p>
          <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-cream leading-[1.05] mb-6">
            Help us build
            <br />
            <span className="italic text-sage">the future.</span>
          </h2>
          <p className="reveal-up stagger-2 font-serif text-lg text-cream/40 max-w-xl mx-auto mb-10">
            Your contribution helps us develop robotic construction tools and
            empower Gen Z to build their own housing futures.
          </p>
          <button className="reveal-up stagger-3 bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300">
            Donate
          </button>
        </div>
      </section>
    </div>
  );
}
