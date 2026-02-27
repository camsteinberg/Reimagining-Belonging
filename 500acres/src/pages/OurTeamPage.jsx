import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import teamHero from "../assets/photos/team-hero-firepit.webp";

/* Headshots (where available) */
import hsMichelle from "../assets/headshots/michelle-crosby.webp";
import hsJohn from "../assets/headshots/john-seidl.webp";
import hsMikey from "../assets/headshots/mikey-thomas.webp";
import hsRocio from "../assets/headshots/rocio-loberza.webp";
import hsRoy from "../assets/headshots/roy-nelson.webp";
import hsCam from "../assets/headshots/cam-steinberg.webp";
import hsYuchun from "../assets/headshots/yuchun-zhang.webp";
import hsCole from "../assets/headshots/cole-kreilig.webp";
import hsMo from "../assets/headshots/fengming-mo.webp";
import hsSpozami from "../assets/headshots/spozami-kakar.webp";

const ACCENT_COLORS = ["bg-forest", "bg-sage", "bg-amber", "bg-bark", "bg-clay", "bg-moss", "bg-ember"];

const TEAM_MEMBERS = [
  { name: "Michelle Crosby", role: "CEO", photo: hsMichelle },
  { name: "John Seidl", role: "Chairman", photo: hsJohn },
  { name: "Mikey Thomas", role: "Superintendent", photo: hsMikey },
  { name: "Fengming Mo", role: "Financial Analyst", photo: hsMo },
  { name: "Aiden Miller", role: "AI & Data Strategy Fellow" },
  { name: "Cole Kreilig", role: "Machine Learning & Systems Fellow", photo: hsCole },
  { name: "Cam Steinberg", role: "Project Manager", photo: hsCam },
  { name: "Rocio Loberza", role: "Architectural Designer", photo: hsRocio },
  { name: "Yuchun Zhang", role: "Urban Design Intern", photo: hsYuchun },
  { name: "Lex", role: "Artist in Residence" },
  { name: "Kyle & Antonio", role: "Artists in Residence" },
];

const CONSULTANTS = [
  { name: "Roy Nelson", role: "Tax Consultant", photo: hsRoy },
  { name: "Melanie Birch", role: "Book Keeper" },
  { name: "Araman Kakar", role: "Financial Controller" },
  { name: "Spozami Kakar", role: "Board Secretary / Accounts Manager", photo: hsSpozami },
];

export default function OurTeamPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex flex-col justify-end pb-20 md:pb-28">
        <img src={teamHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
        {/* Decorative blobs */}
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-sage/8 blob pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30vw] h-[30vw] bg-clay/6 blob pointer-events-none" style={{ animationDelay: "-4s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            Our Team
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            The people behind 500 Acres.
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/60 max-w-lg">
            From land acquisition and fund management to on-site construction
            and digital fabrication.
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

      {/* Team Section */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <div className="text-center mb-20 md:mb-24">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Leadership
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              Our Team
            </h2>
            <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/60 max-w-2xl mx-auto">
              The people building 500 Acres — from land acquisition and fund
              management to on-site construction and digital fabrication.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
            {TEAM_MEMBERS.map((member, i) => (
              <div
                key={member.name}
                className={`reveal-up stagger-${(i % 3) + 1} group text-center`}
              >
                <div className="relative w-40 h-40 mx-auto mb-10">
                  <div className="w-full h-full rounded-full bg-charcoal/5 flex items-center justify-center overflow-hidden">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-4xl font-bold text-charcoal/20">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 ${ACCENT_COLORS[i % ACCENT_COLORS.length]} rounded-full`} />
                </div>
                <h3 className="font-serif text-xl font-bold text-charcoal mb-1">
                  {member.name}
                </h3>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/60">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container">
        <div className="h-px bg-charcoal/10" />
      </div>

      {/* Consultants Section */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <div className="text-center mb-20 md:mb-24">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Consultants
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal">
              Consultants & Advisors
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
            {CONSULTANTS.map((member, i) => (
              <div
                key={member.name}
                className={`reveal-up stagger-${(i % 3) + 1} group text-center`}
              >
                <div className="relative w-40 h-40 mx-auto mb-10">
                  <div className="w-full h-full rounded-full bg-charcoal/5 flex items-center justify-center overflow-hidden">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-4xl font-bold text-charcoal/20">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 ${ACCENT_COLORS[i % ACCENT_COLORS.length]} rounded-full`} />
                </div>
                <h3 className="font-serif text-xl font-bold text-charcoal mb-1">
                  {member.name}
                </h3>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/60">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
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
