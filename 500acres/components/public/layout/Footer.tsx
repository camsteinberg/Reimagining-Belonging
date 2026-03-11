'use client';

import { useState } from "react";
import Link from "next/link";
import Logo from "../shared/Logo";
import { PUBLIC_NAV_ITEMS, PUBLIC_SOCIAL_LINKS } from "@/lib/publicNav";

const FOOTER_LINKS = PUBLIC_NAV_ITEMS;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
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
            Let&apos;s start
            <br />
            <span className="italic text-sage">building.</span>
          </h2>
          <Link
            href="/get-involved"
            className="group inline-flex items-center gap-4 bg-cream text-charcoal px-8 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300"
          >
            <span>Get Involved</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Newsletter signup */}
        <div className="mb-20 md:mb-24 max-w-md">
          <label htmlFor="newsletter-email" className="block font-sans text-xs uppercase tracking-[0.3em] text-cream/50 mb-6">
            Stay Connected
          </label>
          {subscribed ? (
            <p className="success-enter font-serif text-sage text-lg">
              You&apos;re in. We&apos;ll be in touch.
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="flex gap-3">
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent border-b border-cream/20 px-3 py-3 font-serif text-cream placeholder-cream/30 focus:outline-none focus:border-sage transition-colors"
              />
              <button
                type="submit"
                className="font-sans text-xs uppercase tracking-wider text-cream/70 hover:text-sage transition-colors"
              >
                Join <span aria-hidden="true">&rarr;</span>
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
              <div className="flex flex-col gap-4">
                {FOOTER_LINKS.map((link) => (
                  <div key={link.label}>
                    {link.href && !link.children ? (
                      <Link
                        href={link.href}
                        className="creative-link font-serif text-base text-cream/70 hover:text-cream transition-colors w-fit py-1"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <p className="font-serif text-base text-cream/70 py-1">{link.label}</p>
                    )}
                    {link.children && (
                      <div className="flex flex-col gap-3 mt-3 pl-4">
                        {link.children.map((child) => (
                          child.external ? (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="creative-link font-serif text-sm text-cream/50 hover:text-cream/80 transition-colors w-fit"
                            >
                              {child.label}
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="creative-link font-serif text-sm text-cream/50 hover:text-cream/80 transition-colors w-fit"
                            >
                              {child.label}
                            </Link>
                          )
                        ))}
                      </div>
                    )}
                  </div>
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
              {PUBLIC_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.label !== "Email" ? "_blank" : undefined}
                  rel={social.label !== "Email" ? "noopener noreferrer" : undefined}
                  aria-label={social.ariaLabel}
                  className="creative-link font-serif text-base text-cream/70 hover:text-cream transition-colors w-fit py-1"
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
