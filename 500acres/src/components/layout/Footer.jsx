import { Link } from "react-router-dom";
import Logo from "../shared/Logo";

const FOOTER_LINKS = [
  { to: "/about", label: "About" },
  { to: "/stories", label: "Stories" },
  { to: "/resources", label: "Resources" },
  { to: "/get-involved", label: "Get Involved" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream overflow-hidden">
      {/* Main footer content */}
      <div className="page-container pt-28 md:pt-40 pb-16">
        {/* Large typographic CTA */}
        <div className="mb-24 md:mb-32">
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-cream/20 mb-8">
            Ready?
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-cream mb-10">
            Let's build
            <br />
            <span className="italic text-sage">belonging.</span>
          </h2>
          <Link
            to="/get-involved"
            className="group inline-flex items-center gap-4 bg-cream text-charcoal px-8 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300"
          >
            <span>Get Involved</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 pb-16 border-b border-cream/10">
          {/* Logo + tagline */}
          <div className="md:col-span-5">
            <Logo className="w-16 h-16 mb-8" showText={false} />
            <p className="font-serif text-cream/40 text-sm leading-relaxed max-w-xs">
              Equitable housing through technology.
              Helping Gen Z build houses with robots by 2026.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3 md:col-start-7">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-cream/20 mb-8">
              Navigate
            </p>
            <div className="flex flex-col gap-4">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="creative-link font-serif text-base text-cream/50 hover:text-cream transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-cream/20 mb-8">
              Connect
            </p>
            <div className="flex flex-col gap-4">
              {["Instagram", "Twitter", "Email"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="creative-link font-serif text-base text-cream/50 hover:text-cream transition-colors w-fit"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[11px] text-cream/20 tracking-wide">
            &copy; {new Date().getFullYear()} 500 Acres. All rights reserved.
          </p>
          <p className="font-sans text-[11px] text-cream/20 tracking-wide">
            Built by Gen Z, for Gen Z.
          </p>
        </div>
      </div>
    </footer>
  );
}
