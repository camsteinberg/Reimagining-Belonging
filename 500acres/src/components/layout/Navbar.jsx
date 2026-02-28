import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import Logo from "../shared/Logo";

const STICKY_NAV_LINKS = [
  { to: "/", label: "Home" },
  {
    label: "About",
    children: [
      { to: "/about", label: "About" },
      { to: "/about/mission", label: "Our Mission" },
      { to: "/about/team", label: "Our Team" },
      { to: "/about/sponsors", label: "Our Sponsors" },
      { to: "/about/white-paper", label: "White Paper" },
    ],
  },
  {
    label: "Stories & Games",
    children: [
      { to: "/stories", label: "Stories" },
      { to: "https://blueprint-telephone.vercel.app", label: "Blueprint Telephone", external: true },
    ],
  },
  { to: "/resources", label: "Resources" },
  { to: "/get-involved", label: "Get Involved" },
];

const NAV_LINKS = [
  { to: "/", label: "Home", num: "01" },
  {
    label: "About",
    num: "02",
    children: [
      { to: "/about/mission", label: "Our Mission" },
      { to: "/about/team", label: "Our Team" },
      { to: "/about/sponsors", label: "Our Sponsors" },
      { to: "/about/white-paper", label: "White Paper" },
    ],
  },
  {
    label: "Stories & Games",
    num: "03",
    children: [
      { to: "/stories", label: "Stories" },
      { to: "https://blueprint-telephone.vercel.app", label: "Blueprint Telephone", external: true },
    ],
  },
  { to: "/resources", label: "Resources", num: "04" },
  { to: "/get-involved", label: "Get Involved", num: "05" },
];

export default function Navbar({ isHomepage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [overDark, setOverDark] = useState(isHomepage);
  const [expandedItem, setExpandedItem] = useState(null);
  const [showSticky, setShowSticky] = useState(false);
  const [stickyDropdown, setStickyDropdown] = useState(null);
  const subLinksRef = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const linksRef = useRef([]);
  const tlRef = useRef(null);
  const menuBtnRef = useRef(null);
  const navigatingRef = useRef(false);

  // Close menu on route change (only for non-nav navigations like logo click, back button)
  useEffect(() => {
    if (!navigatingRef.current) {
      setIsOpen(false);
      setExpandedItem(null);
    }
  }, [location]);

  // Detect if menu button is over a dark background
  useEffect(() => {
    if (isHomepage) {
      setOverDark(true);
      return;
    }

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
        const cl = el.classList;
        return (
          cl.contains("bg-charcoal") ||
          cl.contains("bg-moss") ||
          cl.contains("bg-bark") ||
          cl.contains("bg-night") ||
          cl.contains("bg-pine") ||
          cl.contains("diagonal-top") ||
          el.style.backgroundColor === "#333333" ||
          el.style.backgroundColor === "#2a2520"
        );
      });

      setOverDark(isDark);
    };

    detect();
    window.addEventListener("scroll", detect, { passive: true });
    return () => window.removeEventListener("scroll", detect);
  }, [isHomepage, isOpen, location]);

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

  // Sticky desktop header — show after scrolling past hero on inner pages
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
  }, [isHomepage, location]);

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
  const handleNavClick = useCallback((e, to) => {
    e.preventDefault();
    if (navigatingRef.current) return;
    if (location.pathname === to) {
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
      navigate(to);
      // Let React render the new page behind the overlay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(false);
          navigatingRef.current = false;
        });
      });
    }, 280);
  }, [location.pathname, navigate]);

  const setLinkRef = useCallback((el, i) => {
    linksRef.current[i] = el;
  }, []);

  const barColor = overDark ? "bg-cream" : "bg-charcoal";

  return (
    <>
      {/* Fixed logo — hidden when menu is open */}
      <div className={`fixed top-4 left-4 md:top-6 md:left-8 lg:left-12 z-[250] transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Link to="/" className="block group" aria-label="500 Acres Home">
          <Logo
            className="w-20 h-20 md:w-28 md:h-28 transition-transform duration-300 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 0 0.3px rgba(255,255,255,0.5))" }}
            showText={false}
          />
        </Link>
      </div>

      {/* Fixed menu button — ALWAYS visible */}
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

      {/* Sticky desktop header — inner pages only */}
      {!isHomepage && (
        <header
          className={`fixed top-0 left-0 right-0 z-[230] hidden md:block transition-all duration-300 ${
            showSticky && !isOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
          style={{ height: "60px", backgroundColor: "rgba(232, 224, 208, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <div className="page-container h-full flex items-center justify-between">
            <Link to="/" className="font-serif text-lg font-bold text-charcoal hover:text-forest transition-colors">
              500 Acres
            </Link>
            <nav aria-label="Sticky navigation" className="flex items-center gap-8">
              {STICKY_NAV_LINKS.map((link) => {
                if (link.children) {
                  const isActive = link.children.some(
                    (child) => !child.external && (location.pathname === child.to || location.pathname.startsWith(child.to + "/"))
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
                      {isDropOpen && (
                        <div
                          id={`sticky-submenu-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                          role="region"
                          aria-label={`${link.label} submenu`}
                          className="absolute top-full left-0 mt-2 bg-warm-white rounded-xl shadow-lg border border-charcoal/5 py-2 min-w-[180px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {link.children.map((child) =>
                            child.external ? (
                              <a
                                key={child.to}
                                href={child.to}
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
                                key={child.to}
                                to={child.to}
                                onClick={() => setStickyDropdown(null)}
                                aria-current={location.pathname === child.to ? "page" : undefined}
                                className={`block px-4 py-2 font-sans text-sm transition-colors ${
                                  location.pathname === child.to ? "text-forest" : "text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5"
                                }`}
                              >
                                {child.label}
                              </Link>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={location.pathname === link.to ? "page" : undefined}
                    className={`font-sans text-sm tracking-wide transition-colors ${
                      location.pathname === link.to ? "text-forest" : "text-charcoal/70 hover:text-charcoal"
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
          style={{ paddingLeft: "max(3rem, 8vw)", paddingRight: "max(3rem, 8vw)" }}
        >
          <nav aria-label="Main navigation" className="flex flex-col gap-2 md:gap-4">
            {NAV_LINKS.map((link, i) => {
              // Expandable item (has children)
              if (link.children) {
                const isExpanded = expandedItem === i;
                const isGroupActive = link.children.some(
                  (child) => !child.external && (location.pathname === child.to || location.pathname.startsWith(child.to + "/"))
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
                      <span className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
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
                          !child.external && location.pathname === child.to ? "text-forest" : "text-cream/80 hover:text-forest"
                        }`;
                        const childStyle = { transitionDelay: isExpanded ? `${j * 60}ms` : "0ms" };
                        const childInner = (
                          <>
                            <span className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
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
                              key={child.to}
                              href={child.to}
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
                            key={child.to}
                            ref={(el) => { subLinksRef.current[j] = el; }}
                            to={child.to}
                            onClick={(e) => handleNavClick(e, child.to)}
                            aria-current={location.pathname === child.to ? "page" : undefined}
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

              // Regular link (no children)
              return (
                <Link
                  key={link.to}
                  ref={(el) => setLinkRef(el, i)}
                  to={link.to}
                  onClick={(e) => handleNavClick(e, link.to)}
                  aria-current={location.pathname === link.to ? "page" : undefined}
                  className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 ${
                    location.pathname === link.to ? "text-forest" : "text-cream hover:text-forest"
                  }`}
                >
                  <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6">
                    {link.num}
                  </span>
                  <span className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4">
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
                Build your home · Build your skills · Build your wealth
              </p>
              <p className="font-serif text-cream/60 text-sm">
                Land, training, and pathways to ownership near America's national parks.
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
