import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";

/* Logo imports (where available) */
import logoAD from "../assets/logos/architectural-digest.png";
import logoBliss from "../assets/logos/bliss-events.png";
import logoDiamondPier from "../assets/logos/diamond-pier.png";
import logoBSU from "../assets/logos/bsu-foundation.png";
import logoVirtus from "../assets/logos/virtus-group.png";
import logoWikiHouse from "../assets/logos/wikihouse.svg";
import logoRDV from "../assets/logos/rdv-tequila.png";

/* ───────────────────────────── Constants ───────────────────────────── */

const FEATURED_PARTNERS = [
  {
    name: "VUILD",
    role: "Design & Fabrication",
    badge: "Design Partner",
    description:
      "Digital fabrication technology and nesting/design partnership for CNC-driven housing kit production.",
    detail:
      "VUILD's robotic fabrication platform enables 500 Acres to convert architectural designs into machine-ready cutting files, producing precision-nested panels that arrive ready for assembly by fellowship crews.",
    link: "https://vuild.co.jp/en/",
    logo: null,
    accent: "bg-forest/10 border-forest/30",
    accentDot: "bg-forest",
    badgeColor: "bg-forest text-cream",
  },
  {
    name: "WikiHouse",
    role: "Building Systems",
    badge: "Strategic Advisor",
    description:
      "Open-source Skylark block system advisor providing modular construction frameworks for rapid assembly.",
    detail:
      "WikiHouse's open-source structural system forms the backbone of the nesting pod design philosophy — enabling repeatable, code-compliant framing that can be assembled by trained fellows in days, not months.",
    link: "https://www.wikihouse.cc",
    logo: logoWikiHouse,
    accent: "bg-navy/10 border-navy/30",
    accentDot: "bg-navy",
    badgeColor: "bg-navy text-cream",
  },
  {
    name: "BSU Foundation",
    role: "Academic",
    badge: "Training Partner",
    description:
      "Boise State University partnership supporting workforce training, research, and fellowship development.",
    detail:
      "Through BSU's College of Western Idaho partnership, 500 Acres fellows access accredited CNC and construction coursework. The Foundation provides research support, student engagement, and academic credibility to the workforce training model.",
    link: "https://www.boisestate.edu/giving/",
    logo: logoBSU,
    accent: "bg-sage/10 border-sage/30",
    accentDot: "bg-sage",
    badgeColor: "bg-sage text-cream",
  },
];

const SPONSOR_GROUPS = [
  {
    label: "Design & Fabrication",
    sponsors: [
      {
        name: "Diamond Pier Foundations",
        role: "Foundation Systems",
        badge: "Build Partner",
        description:
          "Engineered pier technology enabling rapid, low-impact site preparation for builds.",
        link: "https://www.diamondpiers.com/",
        logo: logoDiamondPier,
        accent: "bg-clay/10 border-clay/30",
        accentDot: "bg-clay",
      },
      {
        name: "Elegant Woodworking Gifts",
        role: "Curriculum & CNC",
        badge: "Training Partner",
        description:
          "CNC instruction and woodworking curriculum development for fellowship training programs.",
        link: null,
        logo: null,
        accent: "bg-forest/10 border-forest/30",
        accentDot: "bg-forest",
      },
    ],
  },
  {
    label: "Media & Storytelling",
    sponsors: [
      {
        name: "Architectural Digest",
        role: "Media",
        badge: "Media Partner",
        description:
          "Editorial coverage and design storytelling supporting 500 Acres' mission to reimagine housing.",
        link: "https://www.architecturaldigest.com/",
        logo: logoAD,
        accent: "bg-amber/10 border-amber/30",
        accentDot: "bg-amber",
      },
      {
        name: "Story & Pixels",
        role: "Videography & Media",
        badge: "Media Partner",
        description:
          "Visual storytelling partner capturing the 500 Acres journey through documentary videography and media production.",
        link: "https://jakeschumacher.com/",
        logo: null,
        accent: "bg-moss/10 border-moss/30",
        accentDot: "bg-moss",
      },
    ],
  },
  {
    label: "Events & Community",
    sponsors: [
      {
        name: "Bliss Events",
        role: "Events",
        badge: "Events Partner",
        description:
          "Event design and production partner bringing 500 Acres gatherings, forums, and community celebrations to life.",
        link: "https://blissevents.net",
        logo: logoBliss,
        accent: "bg-ember/10 border-ember/30",
        accentDot: "bg-ember",
      },
      {
        name: "RDV Tequila",
        role: "Sponsor",
        badge: "Community Sponsor",
        description:
          "Real Del Valle Tequila — proud sponsor supporting 500 Acres community events and programming.",
        link: "https://rdvtequila.com/",
        logo: logoRDV,
        invertLogo: true,
        accent: "bg-amber/10 border-amber/30",
        accentDot: "bg-amber",
      },
      {
        name: "Sawtooth Shipwreck",
        role: "Artists in Residence",
        badge: "Artist Partner",
        description:
          "Musical artists in residence bringing creative energy and community through live performance.",
        link: null,
        logo: null,
        accent: "bg-ember/10 border-ember/30",
        accentDot: "bg-ember",
      },
    ],
  },
  {
    label: "Operations & Advisory",
    sponsors: [
      {
        name: "Virtus Group Investigations",
        role: "Due Diligence",
        badge: "Operations Partner",
        description:
          "Investigation and due diligence services ensuring transparency and integrity across 500 Acres operations.",
        link: "https://virtusgroupinvestigations.com",
        logo: logoVirtus,
        accent: "bg-bark/10 border-bark/30",
        accentDot: "bg-bark",
      },
      {
        name: "Ask&Co.",
        role: "Accounting & Advisory",
        badge: "Financial Advisor",
        description:
          "Accounting and financial advisory services keeping 500 Acres fiscally sound and audit-ready.",
        link: null,
        logo: null,
        accent: "bg-sage/10 border-sage/30",
        accentDot: "bg-sage",
      },
      {
        name: "Homes in Motion",
        role: "Realty & Parks",
        badge: "Land Partner",
        description:
          "Real estate guidance and Idaho State Parks expertise supporting land acquisition and community siting.",
        link: null,
        logo: null,
        accent: "bg-clay/10 border-clay/30",
        accentDot: "bg-clay",
      },
    ],
  },
];

/* ───────────────────────────── Sub-components ───────────────────────────── */

function FeaturedPartnerCard({ sponsor, index }) {
  const inner = (
    <>
      {/* Badge */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className={`font-sans text-xs uppercase tracking-wider px-3 py-1.5 rounded-full ${sponsor.badgeColor}`}>
          {sponsor.badge}
        </span>
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/50">
          {sponsor.role}
        </span>
      </div>

      {/* Logo or initials */}
      <div className="h-16 flex items-center mb-6">
        {sponsor.logo ? (
          <img
            src={sponsor.logo}
            alt=""
            className="max-h-16 max-w-[180px] w-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="font-serif text-4xl font-bold text-charcoal/15 select-none">
            {sponsor.name
              .replace(/&/g, "")
              .split(/\s+/)
              .map((w) => w[0])
              .join("")}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-4 group-hover:text-forest transition-colors">
        {sponsor.name}
      </h3>

      {/* Description */}
      <p className="font-serif text-base text-charcoal/60 leading-[1.8] mb-4">
        {sponsor.description}
      </p>

      {/* Extended detail */}
      <p className="font-serif text-sm text-charcoal/50 leading-[1.8] mb-8">
        {sponsor.detail}
      </p>

      {/* Link indicator */}
      {sponsor.link && (
        <span className="font-sans text-sm text-charcoal/50 group-hover:text-forest group-hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
          Visit website <span aria-hidden="true">&rarr;</span>
        </span>
      )}
    </>
  );

  const cls = `reveal-up stagger-${(index % 3) + 1} group relative p-10 md:p-14 rounded-2xl border-2 ${sponsor.accent} transition-all duration-500 hover:-translate-y-3 hover:shadow-xl`;

  if (sponsor.link) {
    return (
      <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function SponsorCard({ sponsor, index }) {
  const inner = (
    <>
      {/* Logo or initials */}
      <div className="h-12 flex items-center mb-5">
        {sponsor.logo ? (
          <img
            src={sponsor.logo}
            alt=""
            className={`max-h-12 max-w-[140px] w-auto object-contain${
              sponsor.invertLogo ? " invert" : ""
            }`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="font-serif text-2xl font-bold text-charcoal/15 select-none">
            {sponsor.name
              .replace(/&/g, "")
              .split(/\s+/)
              .map((w) => w[0])
              .join("")}
          </span>
        )}
      </div>

      {/* Badge + role */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {sponsor.badge && (
          <span className="font-sans text-xs uppercase tracking-wider px-2.5 py-1 rounded-full bg-charcoal/5 text-charcoal/60">
            {sponsor.badge}
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${sponsor.accentDot}`} />
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/50">
            {sponsor.role}
          </span>
        </div>
      </div>

      {/* Name */}
      <h3 className="font-serif text-lg md:text-xl font-bold text-charcoal mb-3 group-hover:text-forest transition-colors">
        {sponsor.name}
      </h3>

      {/* Description */}
      <p className="font-serif text-sm text-charcoal/60 leading-[1.8] mb-5">
        {sponsor.description}
      </p>

      {/* Link indicator */}
      {sponsor.link && (
        <span className="font-sans text-sm text-charcoal/50 group-hover:text-forest group-hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
          Visit website <span aria-hidden="true">&rarr;</span>
        </span>
      )}
    </>
  );

  const cls = `reveal-up stagger-${(index % 4) + 1} group relative p-8 md:p-10 rounded-2xl border ${sponsor.accent} transition-all duration-500 hover:-translate-y-2 hover:shadow-xl`;

  if (sponsor.link) {
    return (
      <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function OurSponsorsPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex flex-col justify-end pb-20 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/95 to-cream/80" />
        <div className="absolute top-[12%] left-[-8%] w-[40vw] h-[40vw] bg-amber/5 blob pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[15%] right-[-6%] w-[30vw] h-[30vw] bg-forest/5 blob pointer-events-none" aria-hidden="true" style={{ animationDelay: "-3s" }} />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            Our Sponsors
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Partners in
            <br />
            <span className="text-forest">building belonging.</span>
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/60 max-w-lg">
            We work with organizations that share our commitment to innovative
            housing, digital fabrication, and expanding opportunity for the next
            generation.
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

      {/* Featured Partners -- bento grid with multi-column spans */}
      <section className="py-24 md:py-36">
        <div className="page-container">
          <div className="mb-16 md:mb-20">
            <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4">
              Key Partners
            </p>
            <h2 className="reveal-up stagger-1 font-serif text-3xl md:text-5xl font-bold text-charcoal mb-4">
              Featured Partnerships
            </h2>
            <p className="reveal-up stagger-2 font-serif text-lg text-charcoal/60 max-w-2xl">
              These organizations form the core of our design, training, and
              research infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
            {FEATURED_PARTNERS.map((sponsor, i) => (
              <FeaturedPartnerCard key={sponsor.name} sponsor={sponsor} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Grouped sponsors by category */}
      {SPONSOR_GROUPS.map((group) => (
        <section key={group.label} className="pb-20 md:pb-28">
          <div className="page-container">
            <div className="flex items-center gap-4 mb-12 md:mb-16">
              <div className="h-px flex-1 bg-charcoal/10" />
              <h3 className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/50 shrink-0">
                {group.label}
              </h3>
              <div className="h-px flex-1 bg-charcoal/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {group.sponsors.map((sponsor, i) => (
                <SponsorCard key={sponsor.name} sponsor={sponsor} index={i} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA band */}
      <section className="relative py-24 md:py-36 bg-moss overflow-hidden">
        <div className="page-container relative z-10 text-center">
          <h2 className="reveal-up font-serif text-3xl md:text-5xl font-bold text-cream mb-6">
            Partner with us.
          </h2>
          <p className="reveal-up stagger-1 font-serif text-lg text-cream/70 mb-10 max-w-xl mx-auto">
            Whether you're a company, university, or organization — there are
            many ways to support the mission of building belonging.
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
