import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../shared/Logo";

const FOOTER_LINKS = [
  { to: "/about", label: "About" },
  { to: "/stories", label: "Stories" },
  { to: "/resources", label: "Resources" },
  { to: "/get-involved", label: "Get Involved" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/500acres", ariaLabel: "Follow us on Instagram" },
  { label: "Twitter", href: "https://twitter.com/500acres", ariaLabel: "Follow us on Twitter" },
  { label: "Email", href: "mailto:hello@500acres.org", ariaLabel: "Send us an email" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-charcoal text-cream overflow-hidden">
      {/* Main footer content */}
      <div className="page-container pt-28 md:pt-40 pb-16">
        {/* Large typographic CTA */}
        <div className="mb-24 md:mb-32">
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-cream/50 mb-8">
            Ready?
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-cream mb-10">
            Let's start
            <br />
            <span className="italic text-sage">building.</span>
          </h2>
          <Link
            to="/get-involved"
            className="group inline-flex items-center gap-4 bg-cream text-charcoal px-8 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300"
          >
            <span>Get Involved</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Newsletter signup */}
        <div className="mb-20 md:mb-24 max-w-md">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-cream/50 mb-6">
            Stay Connected
          </p>
          {subscribed ? (
            <p className="font-serif text-sage text-lg">
              You're in. We'll be in touch.
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="flex gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                aria-label="Email address for newsletter"
                className="flex-1 bg-transparent border-b border-cream/20 px-3 py-3 font-serif text-cream placeholder-cream/30 focus:outline-none focus:border-sage transition-colors"
              />
              <button
                type="submit"
                className="font-sans text-xs uppercase tracking-wider text-cream/70 hover:text-sage transition-colors"
              >
                Join <span aria-hidden="true">→</span>
              </button>
            </form>
          )}
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 pb-16 border-b border-cream/10">
          {/* Logo + tagline */}
          <div className="md:col-span-5">
            <Logo className="w-16 h-16 mb-8" showText={false} />
            <p className="font-serif text-cream/60 text-sm leading-[1.8] max-w-xs">
              Transforming land near national parks into housing, training,
              and pathways to ownership for the next generation.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3 md:col-start-7">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-cream/50 mb-8">
              Navigate
            </p>
            <nav aria-label="Footer navigation">
              <div className="flex flex-col gap-5">
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="creative-link font-serif text-base text-cream/70 hover:text-cream transition-colors w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Social */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-cream/50 mb-8">
              Connect
            </p>
            <div className="flex flex-col gap-5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.label !== "Email" ? "_blank" : undefined}
                  rel={social.label !== "Email" ? "noopener noreferrer" : undefined}
                  aria-label={social.ariaLabel}
                  className="creative-link font-serif text-base text-cream/70 hover:text-cream transition-colors w-fit"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-cream/40 tracking-wide">
            &copy; {new Date().getFullYear()} 500 Acres. All rights reserved.
          </p>
          <p className="font-sans text-xs text-cream/40 tracking-wide">
            Built by Gen Z, for Gen Z.
          </p>
        </div>
      </div>
    </footer>
  );
}
