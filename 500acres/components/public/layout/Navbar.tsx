'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import Logo from "../shared/Logo";

const STICKY_NAV_LINKS = [
  { href: "/", label: "Home" },
  {
    label: "About",
    children: [
      { href: "/about", label: "About" },
      { href: "/about/mission", label: "Our Mission" },
      { href: "/about/team", label: "Our Team" },
      { href: "/about/sponsors", label: "Our Sponsors" },
      { href: "/about/white-paper", label: "White Paper" },
    ],
  },
  {
    label: "Stories & Games",
    children: [
      { href: "/stories", label: "Stories" },
      { href: "https://blueprint-telephone.vercel.app", label: "Blueprint Telephone", external: true },
    ],
  },
  { href: "/resources", label: "Resources" },
  { href: "/get-involved", label: "Get Involved" },
  { href: "/login", label: "Login" },
];

const NAV_LINKS = [
  { href: "/", label: "Home", num: "01" },
  {
    label: "About",
    num: "02",
    children: [
      { href: "/about/mission", label: "Our Mission" },
      { href: "/about/team", label: "Our Team" },
      { href: "/about/sponsors", label: "Our Sponsors" },
      { href: "/about/white-paper", label: "White Paper" },
    ],
  },
  {
    label: "Stories & Games",
    num: "03",
    children: [
      { href: "/stories", label: "Stories" },
      { href: "https://blueprint-telephone.vercel.app", label: "Blueprint Telephone", external: true },
    ],
  },
  { href: "/resources", label: "Resources", num: "04" },
  { href: "/get-involved", label: "Get Involved", num: "05" },
  { href: "/login", label: "Login", num: "06" },
];

interface NavbarProps {
  isHomepage: boolean;
}

export default function Navbar({ isHomepage }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [overDark, setOverDark] = useState(isHomepage);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [stickyDropdown, setStickyDropdown] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const subLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const navigatingRef = useRef(false);

  // Detect auth state via API (cookie is httpOnly, not visible to JS)
  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((data) => setIsLoggedIn(!!data?.authenticated))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Close menu on route change (only for non-nav navigations like logo click, back button)
  useEffect(() => {
    if (!navigatingRef.current) {
      setIsOpen(false);
      setExpandedItem(null);
    }
  }, [pathname]);

  // Detect if menu button is over a dark background
  useEffect(() => {
    if (isHomepage) {
      setOverDark(true);
      return;
    }

    let rafId: number | null = null;
    const detect = () => {
      const btn = menuBtnRef.current;
      if (!btn || isOpen) return;

      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Temporarily hide button so elementsFromPoint can see behind it
      btn.style.pointerEvents = "none";
      btn.style.visibility = "hidden";
      const els = document.elementsFromPoint(cx, cy);
      btn.style.pointerEvents = "";
      btn.style.visibility = "";

      const isDark = els.some((el) => {
        const cl = (el as HTMLElement).classList;
        return (
          cl.contains("bg-charcoal") ||
          cl.contains("bg-moss") ||
          cl.contains("bg-bark") ||
          cl.contains("bg-night") ||
          cl.contains("bg-pine") ||
          cl.contains("diagonal-top") ||
          (el as HTMLElement).style.backgroundColor === "#333333" ||
          (el as HTMLElement).style.backgroundColor === "#2a2520"
        );
      });

      setOverDark(isDark);
    };

    detect();
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        detect();
        rafId = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isHomepage, isOpen, pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap + Escape key when menu is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        menuBtnRef.current?.focus();
        return;
      }

      if (e.key !== "Tab") return;

      const overlay = overlayRef.current;
      const menuBtn = menuBtnRef.current;
      if (!overlay || !menuBtn) return;

      const focusable = [
        menuBtn,
        ...overlay.querySelectorAll(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => (el as HTMLElement).offsetParent !== null || el === menuBtn) as HTMLElement[];

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Sticky desktop header -- show after scrolling past hero on inner pages
  useEffect(() => {
    if (isHomepage) {
      setShowSticky(false);
      return;
    }
    const threshold = window.innerHeight * 0.85;
    const onScroll = () => {
      setShowSticky(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomepage, pathname]);

  // Close sticky dropdown when clicking outside
  useEffect(() => {
    if (!stickyDropdown) return;
    const close = () => setStickyDropdown(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [stickyDropdown]);

  // GSAP animation for menu open/close
  useEffect(() => {
    if (!overlayRef.current) return;

    if (isOpen) {
      // Hide all content while clip-path expands to prevent text clipping
      const links = linksRef.current.filter(Boolean);
      gsap.set(links, { opacity: 0, y: 80, rotateX: -15 });
      gsap.set(".menu-footer", { opacity: 0, y: 30 });

      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.fromTo(
        overlayRef.current,
        { clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)" },
        {
          clipPath: "circle(150% at calc(100% - 3rem) 2.5rem)",
          duration: 0.4,
          ease: "power3.inOut",
        }
      );

      // Links start only AFTER clip-path is fully expanded
      tl.to(
        links,
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          stagger: 0.06,
          duration: 0.5,
          ease: "power3.out",
        }
      );

      tl.to(
        ".menu-footer",
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
        "-=0.25"
      );
    } else {
      if (tlRef.current) {
        tlRef.current.kill();
      }
      gsap.to(overlayRef.current, {
        clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)",
        duration: 0.5,
        ease: "power3.inOut",
      });
    }
  }, [isOpen]);

  // Navigate with smooth menu close
  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (navigatingRef.current) return;
    if (pathname === href) {
      setIsOpen(false);
      return;
    }
    navigatingRef.current = true;

    // Fade out menu links
    gsap.to(linksRef.current.filter(Boolean), {
      opacity: 0,
      y: -30,
      stagger: 0.03,
      duration: 0.25,
      ease: "power2.in",
    });
    gsap.to(".menu-footer", {
      opacity: 0,
      y: -20,
      duration: 0.2,
      ease: "power2.in",
    });

    // Navigate behind the overlay while it's still covering the screen,
    // then close the overlay to reveal the new page
    setTimeout(() => {
      router.push(href);
      // Let React render the new page behind the overlay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(false);
          navigatingRef.current = false;
        });
      });
    }, 280);
  }, [pathname, router]);

  const setLinkRef = useCallback((el: HTMLElement | null, i: number) => {
    linksRef.current[i] = el;
  }, []);

  const barColor = overDark ? "bg-cream" : "bg-charcoal";

  return (
    <>
      {/* Fixed logo -- hidden when menu is open */}
      <div className={`fixed top-4 left-4 md:top-6 md:left-8 lg:left-12 z-[250] transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`} inert={isOpen || undefined}>
        <Link href="/" className="block group" aria-label="500 Acres Home">
          <Logo
            className="w-20 h-20 md:w-28 md:h-28 transition-transform duration-300 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 0 0.3px rgba(255,255,255,0.5))" }}
            showText={false}
          />
        </Link>
      </div>

      {/* Fixed auth button -- visible next to menu, hidden when overlay open */}
      <Link
        href={isLoggedIn ? "/dashboard" : "/login"}
        className={`fixed top-7 right-[4.5rem] md:top-9 md:right-[5.5rem] lg:right-[6rem] z-[260] rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide border transition-all duration-300 ${
          isOpen
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        } ${
          overDark
            ? "border-cream/30 text-cream hover:bg-cream hover:text-charcoal"
            : "border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-cream"
        }`}
      >
        {isLoggedIn ? "Dashboard" : "Sign in"}
      </Link>

      {/* Fixed menu button -- ALWAYS visible */}
      <button
        ref={menuBtnRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 md:top-8 md:right-10 lg:right-14 z-[260] group cursor-pointer"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
          <span
            className={`absolute block h-[2px] transition-all duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] ${
              isOpen
                ? "bg-cream rotate-45 w-8 md:w-10"
                : `${barColor} -translate-y-[7px] w-8 md:w-10 group-hover:w-6 group-hover:-translate-y-[8px]`
            }`}
          />
          <span
            className={`absolute block h-[2px] w-8 md:w-10 transition-all duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] ${
              isOpen
                ? "bg-cream opacity-0 scale-x-0"
                : `${barColor} opacity-100 group-hover:translate-x-1`
            }`}
          />
          <span
            className={`absolute block h-[2px] transition-all duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] ${
              isOpen
                ? "bg-cream -rotate-45 w-8 md:w-10"
                : `${barColor} translate-y-[7px] w-8 md:w-10 group-hover:w-6 group-hover:translate-y-[8px]`
            }`}
          />
        </div>
      </button>

      {/* Sticky desktop header -- inner pages only */}
      {!isHomepage && (
        <header
          className={`fixed top-0 left-0 right-0 z-[230] hidden md:block transition-all duration-300 h-[60px] bg-cream/85 backdrop-blur-md ${
            showSticky && !isOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
          style={{ WebkitBackdropFilter: "blur(12px)" }}
        >
          <div className="page-container h-full flex items-center justify-between">
            <Link href="/" className="font-serif text-lg font-bold text-charcoal hover:text-forest transition-colors">
              500 Acres
            </Link>
            <nav aria-label="Sticky navigation" className="flex items-center gap-8">
              {STICKY_NAV_LINKS.map((link) => {
                // Dropdown items
                if (link.children) {
                  const isActive = link.children.some(
                    (child) => !child.external && (pathname === child.href || pathname.startsWith(child.href + "/"))
                  );
                  const isDropOpen = stickyDropdown === link.label;
                  return (
                    <div key={link.label} className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStickyDropdown(isDropOpen ? null : link.label);
                        }}
                        aria-expanded={isDropOpen}
                        aria-controls={`sticky-submenu-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`font-sans text-sm tracking-wide transition-colors cursor-pointer ${
                          isActive ? "text-forest" : "text-charcoal/70 hover:text-charcoal"
                        }`}
                      >
                        {link.label}
                        <svg className={`inline-block w-3 h-3 ml-1 transition-transform duration-200 ${isDropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                        <div
                          id={`sticky-submenu-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                          role="region"
                          aria-label={`${link.label} submenu`}
                          className={`dropdown-menu${isDropOpen ? " is-open" : ""} absolute top-full left-0 mt-2 bg-warm-white rounded-xl shadow-lg border border-charcoal/5 py-2 min-w-[180px]`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {link.children.map((child) =>
                            child.external ? (
                              <a
                                key={child.href}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-2 font-sans text-sm text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 transition-colors"
                              >
                                {child.label}
                                <svg className="inline-block w-3 h-3 ml-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                                </svg>
                              </a>
                            ) : (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setStickyDropdown(null)}
                                aria-current={pathname === child.href ? "page" : undefined}
                                className={`block px-4 py-2 font-sans text-sm transition-colors ${
                                  pathname === child.href ? "text-forest" : "text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5"
                                }`}
                              >
                                {child.label}
                              </Link>
                            )
                          )}
                        </div>
                    </div>
                  );
                }

                // Login/Dashboard conditional link (last item)
                if (link.href === "/login") {
                  if (isLoggedIn) {
                    const isDropOpen = stickyDropdown === "user";
                    return (
                      <div key="auth-link" className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStickyDropdown(isDropOpen ? null : "user");
                          }}
                          aria-expanded={isDropOpen}
                          aria-controls="sticky-user-menu"
                          className="font-sans text-sm tracking-wide text-charcoal/70 hover:text-charcoal transition-colors cursor-pointer"
                        >
                          Dashboard
                          <svg className={`inline-block w-3 h-3 ml-1 transition-transform duration-200 ${isDropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <div
                          id="sticky-user-menu"
                          role="region"
                          aria-label="User menu"
                          className={`dropdown-menu${isDropOpen ? " is-open" : ""} absolute top-full right-0 mt-2 bg-warm-white rounded-xl shadow-lg border border-charcoal/5 py-2 min-w-[160px]`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href="/dashboard"
                            onClick={() => setStickyDropdown(null)}
                            className="block px-4 py-2 font-sans text-sm text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 transition-colors"
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={() => {
                              setStickyDropdown(null);
                              fetch("/api/logout", { method: "POST" }).then(() => {
                                setIsLoggedIn(false);
                                router.push("/");
                              });
                            }}
                            className="block w-full text-left px-4 py-2 font-sans text-sm text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 transition-colors cursor-pointer"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key="auth-link"
                      href="/login"
                      className="font-sans text-sm tracking-wide bg-ember text-warm-white px-4 py-2 rounded-full hover:bg-bark transition-colors"
                    >
                      Login
                    </Link>
                  );
                }

                // Regular links
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={`font-sans text-sm tracking-wide transition-colors ${
                      pathname === link.href ? "text-forest" : "text-charcoal/70 hover:text-charcoal"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Full-screen menu overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[240] bg-charcoal pointer-events-none"
        style={{ clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)" }}
        aria-hidden={!isOpen}
        inert={!isOpen || undefined}
      >
        <div
          className="pointer-events-auto w-full h-full flex flex-col justify-center"
          style={{ paddingLeft: "max(1.5rem, 5vw)", paddingRight: "max(1.5rem, 5vw)" }}
        >
          <nav aria-label="Main navigation" className="flex flex-col gap-2 md:gap-4">
            {NAV_LINKS.map((link, i) => {
              // Expandable item (has children)
              if (link.children) {
                const isExpanded = expandedItem === i;
                const isGroupActive = link.children.some(
                  (child) => !child.external && (pathname === child.href || pathname.startsWith(child.href + "/"))
                );
                return (
                  <div key={link.label}>
                    <button
                      ref={(el) => setLinkRef(el, i)}
                      onClick={() => setExpandedItem(isExpanded ? null : i)}
                      aria-expanded={isExpanded}
                      aria-controls={`submenu-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 cursor-pointer ${
                        isGroupActive ? "text-forest" : "text-cream hover:text-forest"
                      }`}
                    >
                      <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6">
                        {link.num}
                      </span>
                      <span className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
                        {link.label}
                      </span>
                      <svg
                        className={`w-5 h-5 md:w-7 md:h-7 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                    </button>
                    <div
                      id={`submenu-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      role="region"
                      aria-label={`${link.label} submenu`}
                      className={`overflow-hidden transition-all duration-400 ${isExpanded ? "max-h-96 mt-2" : "max-h-0"}`}
                    >
                      {link.children.map((child, j) => {
                        const childCls = `group flex items-baseline gap-4 md:gap-6 pl-10 md:pl-16 py-1 transition-all duration-300 ${
                          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        } ${
                          !child.external && pathname === child.href ? "text-forest" : "text-cream/80 hover:text-forest"
                        }`;
                        const childStyle = { transitionDelay: isExpanded ? `${j * 60}ms` : "0ms" };
                        const childInner = (
                          <>
                            <span className="font-serif text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
                              {child.label}
                            </span>
                            {child.external && (
                              <svg className="w-4 h-4 md:w-5 md:h-5 opacity-40 group-hover:opacity-100 transition-opacity self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                              </svg>
                            )}
                            <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                          </>
                        );

                        if (child.external) {
                          return (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={childCls}
                              style={childStyle}
                            >
                              {childInner}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={child.href}
                            ref={(el) => { subLinksRef.current[j] = el; }}
                            href={child.href}
                            onClick={(e) => handleNavClick(e, child.href)}
                            aria-current={pathname === child.href ? "page" : undefined}
                            className={childCls}
                            style={childStyle}
                          >
                            {childInner}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Login/Dashboard conditional link (last overlay item)
              if (link.href === "/login") {
                const authHref = isLoggedIn ? "/dashboard" : "/login";
                const authLabel = isLoggedIn ? "Dashboard" : "Login";
                return (
                  <div key="auth-overlay-link">
                    <Link
                      ref={(el) => setLinkRef(el, i)}
                      href={authHref}
                      onClick={(e) => handleNavClick(e, authHref)}
                      aria-current={pathname === authHref ? "page" : undefined}
                      className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 ${
                        pathname === authHref ? "text-forest" : "text-cream hover:text-forest"
                      }`}
                    >
                      <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6">
                        {link.num}
                      </span>
                      <span className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
                        {authLabel}
                      </span>
                      <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                    </Link>
                    {isLoggedIn && (
                      <button
                        onClick={() => {
                          fetch("/api/logout", { method: "POST" }).then(() => {
                            setIsLoggedIn(false);
                            setIsOpen(false);
                            router.push("/");
                          });
                        }}
                        className="pl-10 md:pl-16 mt-1 font-sans text-sm md:text-base tracking-wide text-cream/60 hover:text-forest transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                );
              }

              // Regular link (no children)
              return (
                <Link
                  key={link.href}
                  ref={(el) => setLinkRef(el, i)}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 ${
                    pathname === link.href ? "text-forest" : "text-cream hover:text-forest"
                  }`}
                >
                  <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6">
                    {link.num}
                  </span>
                  <span className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
                    {link.label}
                  </span>
                  <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                </Link>
              );
            })}
          </nav>

          <div className="menu-footer mt-16 md:mt-20 flex flex-col md:flex-row md:items-end justify-between gap-8 opacity-0">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-cream/60 mb-2">
                Build your home &middot; Build your skills &middot; Build your wealth
              </p>
              <p className="font-serif text-cream/60 text-sm">
                Land, training, and pathways to ownership near America&apos;s national parks.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="https://instagram.com/500acres" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="font-sans text-xs uppercase tracking-widest text-cream/60 hover:text-cream transition-colors">
                Instagram
              </a>
              <a href="https://twitter.com/500acres" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter" className="font-sans text-xs uppercase tracking-widest text-cream/60 hover:text-cream transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
