'use client';

import useReveal from '@/hooks/useReveal';
import Breadcrumbs from '@/components/public/shared/Breadcrumbs';
import SectionDivider from '@/components/public/shared/SectionDivider';
import SectionHeader from '@/components/public/shared/SectionHeader';
import CTABand from '@/components/public/shared/CTABand';
import teamHero from '@/assets/photos/team-hero-firepit.webp';

/* Headshots (where available) */
import hsMichelle from '@/assets/headshots/michelle-crosby.webp';
import hsJohn from '@/assets/headshots/john-seidl.webp';
import hsMikey from '@/assets/headshots/mikey-thomas.webp';
import hsRocio from '@/assets/headshots/rocio-loberza.webp';
import hsRoy from '@/assets/headshots/roy-nelson.webp';
import hsCam from '@/assets/headshots/cam-steinberg.webp';
import hsYuchun from '@/assets/headshots/yuchun-zhang.webp';
import hsCole from '@/assets/headshots/cole-kreilig.webp';
import hsMo from '@/assets/headshots/fengming-mo.webp';
import hsSpozami from '@/assets/headshots/spozami-kakar.webp';
import hsAraman from '@/assets/headshots/araman-kakar.webp';
import hsKyleAntonio from '@/assets/headshots/kyle-antonio.webp';
import hsAidan from '@/assets/headshots/aidan-miller.webp';
import { StaticImageData } from 'next/image';

interface TeamMember {
  name: string;
  role: string;
  photo?: StaticImageData;
  bio: string;
  accent?: string;
}

const LEADERSHIP: TeamMember[] = [
  {
    name: "Michelle Crosby",
    role: "CEO",
    photo: hsMichelle,
    bio: "Leading 500 Acres' mission to transform land into housing, training, and pathways to ownership for Gen Z.",
    accent: "forest",
  },
  {
    name: "John Seidl",
    role: "Chairman",
    photo: hsJohn,
    bio: "Guiding strategic vision and governance as 500 Acres grows from research into a working model for community-driven housing.",
    accent: "sage",
  },
];

const DESIGN_BUILD: TeamMember[] = [
  {
    name: "Mikey Thomas",
    role: "Superintendent",
    photo: hsMikey,
    bio: "Overseeing on-site construction, coordinating builds, and mentoring fellows in hands-on fabrication.",
  },
  {
    name: "Rocio Loberza",
    role: "Architectural Designer",
    photo: hsRocio,
    bio: "Shaping the architectural language of 500 Acres through sustainable, community-centered design.",
  },
  {
    name: "Yuchun Zhang",
    role: "Urban Design Intern",
    photo: hsYuchun,
    bio: "Contributing urban planning research and site analysis to the 500 Acres development strategy.",
  },
];

const TECH_STRATEGY: TeamMember[] = [
  {
    name: "Cam Steinberg",
    role: "Project Manager",
    photo: hsCam,
    bio: "Coordinating cross-functional teams and technology strategy to keep the 500 Acres mission on track.",
  },
  {
    name: "Aidan Miller",
    role: "AI & Data Strategy Fellow",
    photo: hsAidan,
    bio: "Applying artificial intelligence and data analysis to optimize housing development and community outcomes.",
  },
  {
    name: "Cole Kreilig",
    role: "Machine Learning & Systems Fellow",
    photo: hsCole,
    bio: "Building machine learning systems and technical infrastructure to support scalable housing solutions.",
  },
  {
    name: "Fengming Mo",
    role: "Financial Analyst",
    photo: hsMo,
    bio: "Modeling financial strategies and funding pathways to make 500 Acres economically sustainable.",
  },
];

const FELLOWS_ARTISTS: TeamMember[] = [
  {
    name: "Lex Quintos",
    role: "Artist in Residence",
    bio: "Exploring the intersection of art, identity, and belonging through creative work embedded in the 500 Acres community.",
  },
  {
    name: "Kyle & Antonio",
    role: "Artists in Residence",
    photo: hsKyleAntonio,
    bio: "Collaborative artists bringing visual storytelling and cultural expression to the 500 Acres experience.",
  },
];

const TRUSTED_ADVISORS: TeamMember[] = [
  {
    name: "Roy Nelson",
    role: "Tax Consultant",
    photo: hsRoy,
    bio: "Advising on tax strategy and opportunity zone compliance for 500 Acres' financial structure.",
  },
  {
    name: "Melanie Birch",
    role: "Book Keeper",
    bio: "Maintaining financial records and ensuring fiscal accountability across all 500 Acres operations.",
  },
  {
    name: "Araman Kakar",
    role: "Financial Controller",
    photo: hsAraman,
    bio: "Overseeing financial controls and reporting to support transparent, mission-aligned spending.",
  },
  {
    name: "Spozami Kakar",
    role: "Board Secretary / Accounts Manager",
    photo: hsSpozami,
    bio: "Managing board operations and accounts to keep governance running smoothly.",
  },
];

const ACCENT_DOT: Record<string, string> = {
  forest: "bg-forest",
  sage: "bg-sage",
};

const SECTION_ACCENTS: Record<string, { bg: string; border: string; dot: string }> = {
  "Design & Build": { bg: "bg-clay/10", border: "border-clay/30", dot: "bg-clay" },
  "Technology & Strategy": { bg: "bg-amber/10", border: "border-amber/30", dot: "bg-amber" },
  "Fellows & Artists": { bg: "bg-sage/10", border: "border-sage/30", dot: "bg-sage" },
  "Trusted Advisors": { bg: "bg-forest/10", border: "border-forest/30", dot: "bg-forest" },
};

const CULTURE_STATS = [
  { number: "15+", label: "Team Members" },
  { number: "5", label: "Departments" },
  { number: "4", label: "States" },
  { number: "100%", label: "Mission-Driven" },
];

function LeadershipCard({ member, index }: { member: TeamMember; index: number }) {
  const accentClasses = member.accent === "forest"
    ? "border-forest/30 bg-forest/5"
    : "border-sage/30 bg-sage/5";

  return (
    <div className={`reveal-up stagger-${index + 1} group rounded-3xl border-2 ${accentClasses} p-8 md:p-12 transition-all duration-500 hover:-translate-y-3 hover:shadow-lg`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div className="relative flex-shrink-0">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-charcoal/5 overflow-hidden hover-image-scale">
            {member.photo ? (
              <img
                src={member.photo.src}
                alt={member.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full font-serif text-5xl font-bold text-charcoal/20">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </span>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-10 h-10 ${ACCENT_DOT[member.accent || ""] || "bg-charcoal"} rounded-full`} />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-charcoal mb-1">
            {member.name}
          </h3>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/60 mb-4">
            {member.role}
          </p>
          <p className="font-serif text-base text-charcoal/70 leading-[1.8] max-w-md">
            {member.bio}
          </p>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <div className={`reveal-up stagger-${(index % 3) + 1} group text-center`}>
      <div className="relative w-40 h-40 mx-auto mb-6">
        <div className="w-full h-full rounded-full bg-charcoal/5 flex items-center justify-center overflow-hidden hover-image-scale">
          {member.photo ? (
            <img
              src={member.photo.src}
              alt={member.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-serif text-4xl font-bold text-charcoal/20">
              {member.name.split(" ").map((n) => n[0]).join("")}
            </span>
          )}
        </div>
      </div>
      <h3 className="font-serif text-xl font-bold text-charcoal mb-1">
        {member.name}
      </h3>
      <p className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/60 mb-3">
        {member.role}
      </p>
      {member.bio && (
        <p className="font-serif text-sm text-charcoal/60 leading-[1.7] max-w-xs mx-auto">
          {member.bio}
        </p>
      )}
    </div>
  );
}

function TeamSection({ title, members }: { title: string; members: TeamMember[] }) {
  const colors = SECTION_ACCENTS[title] || { bg: "", border: "", dot: "bg-charcoal" };

  return (
    <>
      <div className="reveal-up flex items-center gap-3 mb-12 md:mb-16">
        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
        <h2 className="font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60">
          {title}
        </h2>
        <div className="flex-1 h-px bg-charcoal/10 ml-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
        {members.map((member, i) => (
          <MemberCard key={member.name} member={member} index={i} />
        ))}
      </div>
    </>
  );
}

export default function OurTeamPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero -- image-reveal wipe */}
      <section className="relative min-h-[60vh] flex flex-col justify-end pb-14 md:pb-20 lg:pb-28">
        <img
          src={teamHero.src}
          alt="Team members gathered around evening fire pit"
          className="absolute inset-0 w-full h-full object-cover image-reveal"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 to-cream/40" />

        <div className="page-container relative z-10">
          <div className="mb-10">
            <Breadcrumbs items={[{ label: "About", href: "/about" }, { label: "Our Team" }]} />
          </div>
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            Our Team
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            The people behind 500 Acres.
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/70 max-w-lg">
            From land acquisition and fund management to on-site construction
            and digital fabrication.
          </p>
        </div>
      </section>

      {/* Team Culture Stats Strip */}
      <section className="bg-warm-white border-y border-charcoal/10 py-12 md:py-16">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {CULTURE_STATS.map((stat, i) => (
              <div key={stat.label} className={`reveal-up stagger-${i + 1} text-center`}>
                <span className="block font-serif text-4xl md:text-5xl font-bold text-charcoal mb-2">
                  {stat.number}
                </span>
                <span className="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership -- cream (default) */}
      <section className="py-16 md:py-24 lg:py-36">
        <div className="page-container">
          <SectionHeader
            label="Leadership"
            title="Our Team"
            description="The people building 500 Acres — from land acquisition and fund management to on-site construction and digital fabrication."
            align="center"
            className="mb-16 md:mb-20"
          />

          {/* Featured leadership cards -- span full width */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {LEADERSHIP.map((member, i) => (
              <LeadershipCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Design & Build -- tinted */}
      <div className="bg-clay/[0.03]">
        <section className="py-14 md:py-20 lg:py-28">
          <div className="page-container">
            <TeamSection title="Design & Build" members={DESIGN_BUILD} />
          </div>
        </section>
      </div>

      {/* Technology & Strategy -- cream (default) */}
      <section className="py-14 md:py-20 lg:py-28">
        <div className="page-container">
          <TeamSection title="Technology & Strategy" members={TECH_STRATEGY} />
        </div>
      </section>

      {/* Fellows & Artists -- tinted */}
      <div className="bg-sage/[0.03]">
        <section className="py-14 md:py-20 lg:py-28">
          <div className="page-container">
            <TeamSection title="Fellows & Artists" members={FELLOWS_ARTISTS} />
          </div>
        </section>
      </div>

      <SectionDivider variant="dot" />

      {/* Trusted Advisors -- cream (default) */}
      <section className="py-16 md:py-24 lg:py-36">
        <div className="page-container">
          <SectionHeader
            label="Advisors"
            title="Trusted Advisors"
            description="Experienced professionals who guide 500 Acres through financial planning, governance, and operational excellence."
            align="center"
            className="mb-16 md:mb-20"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
            {TRUSTED_ADVISORS.map((member, i) => (
              <MemberCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      <CTABand
        bg="bg-charcoal"
        heading="Join the team."
        description="We're always looking for mission-driven people who want to build homes, train the next generation, and create communities that last."
        ctas={[{ label: "Get Involved", to: "/get-involved" }]}
      />
    </div>
  );
}
