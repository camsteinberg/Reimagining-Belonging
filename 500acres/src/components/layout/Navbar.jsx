import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import Logo from "../shared/Logo";

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
          duration: 0.6,
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
                    <div className={`overflow-hidden transition-all duration-400 ${isExpanded ? "max-h-96 mt-2" : "max-h-0"}`}>
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
