'use client';

import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import Logo from "../shared/Logo";
import {
  AUTH_NAV_ITEM,
  PUBLIC_NAV_ITEMS,
  PUBLIC_SOCIAL_LINKS,
  isNavHrefActive,
  isNavItemActive,
} from "@/lib/publicNav";

interface NavbarProps {
  isHomepage: boolean;
}

function navId(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
}

export default function Navbar({ isHomepage }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [overDark, setOverDark] = useState(isHomepage);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [stickyDropdown, setStickyDropdown] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuCanScrollUp, setMenuCanScrollUp] = useState(false);
  const [menuCanScrollDown, setMenuCanScrollDown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuScrollRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setIsLoggedIn(!!data?.authenticated))
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    if (!navigatingRef.current) {
      setIsOpen(false);
      setExpandedItem(null);
    }
  }, [pathname]);

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

      btn.style.pointerEvents = "none";
      btn.style.visibility = "hidden";
      const els = document.elementsFromPoint(cx, cy);
      btn.style.pointerEvents = "";
      btn.style.visibility = "";

      const isDark = els.some((el) => {
        const cl = (el as HTMLElement).classList;
        return (
          cl.contains("bg-charcoal") ||
          cl.contains("bg-forest") ||
          cl.contains("bg-moss") ||
          cl.contains("bg-bark") ||
          cl.contains("bg-night") ||
          cl.contains("bg-pine") ||
          cl.contains("diagonal-top") ||
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStickyDropdown(null);
    } else {
      document.body.style.overflow = "";
      setExpandedItem(null);
      setMenuCanScrollUp(false);
      setMenuCanScrollDown(false);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
        ...overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])'),
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

  useEffect(() => {
    if (!stickyDropdown) return;
    const close = () => setStickyDropdown(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [stickyDropdown]);

  const updateMenuScrollState = useCallback(() => {
    const scrollEl = menuScrollRef.current;
    if (!scrollEl) {
      setMenuCanScrollUp(false);
      setMenuCanScrollDown(false);
      return;
    }

    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
    setMenuCanScrollUp(scrollEl.scrollTop > 8);
    setMenuCanScrollDown(maxScroll - scrollEl.scrollTop > 8);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const scrollEl = menuScrollRef.current;
    if (!scrollEl) return;

    scrollEl.scrollTop = 0;
    const rafId = requestAnimationFrame(() => {
      scrollEl.scrollTop = 0;
      updateMenuScrollState();
    });

    const handleScroll = () => updateMenuScrollState();
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      scrollEl.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, updateMenuScrollState]);

  useEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(() => updateMenuScrollState());
    return () => cancelAnimationFrame(rafId);
  }, [expandedItem, isOpen, updateMenuScrollState]);

  useEffect(() => {
    if (!overlayRef.current) return;

    if (isOpen) {
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
      tlRef.current?.kill();
      gsap.to(overlayRef.current, {
        clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)",
        duration: 0.5,
        ease: "power3.inOut",
      });
    }
  }, [isOpen]);

  const handleNavClick = useCallback((e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (navigatingRef.current) return;
    if (pathname === href) {
      setIsOpen(false);
      return;
    }

    navigatingRef.current = true;

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

    setTimeout(() => {
      router.push(href);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(false);
          navigatingRef.current = false;
        });
      });
    }, 280);
  }, [pathname, router]);

  const handleLogout = useCallback((closeOverlay = false) => {
    fetch("/api/logout", { method: "POST" }).then(() => {
      setIsLoggedIn(false);
      setStickyDropdown(null);
      if (closeOverlay) {
        setIsOpen(false);
      }
      router.push("/");
    });
  }, [router]);

  const setLinkRef = useCallback((el: HTMLElement | null, i: number) => {
    linksRef.current[i] = el;
  }, []);

  const barColor = overDark ? "bg-cream" : "bg-charcoal";
  const authHref = isLoggedIn ? "/dashboard" : AUTH_NAV_ITEM.href;
  const authLabel = isLoggedIn ? "Dashboard" : AUTH_NAV_ITEM.label;

  return (
    <>
      <div
        className={`fixed top-4 left-4 md:top-6 md:left-8 lg:left-12 z-[250] transition-opacity duration-300 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        inert={isOpen || undefined}
      >
        <Link href="/" className="block group" aria-label="500 Acres Home">
          <Logo
            className="w-20 h-20 md:w-28 md:h-28 transition-transform duration-300 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 0 0.3px rgba(245,241,234,0.5))" }}
            showText={false}
          />
        </Link>
      </div>

      <button
        ref={menuBtnRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-6 right-6 md:top-8 md:right-10 lg:right-14 z-[260] group cursor-pointer"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="site-menu-overlay"
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
              {PUBLIC_NAV_ITEMS.map((item) => {
                if (item.children) {
                  const isActive = isNavItemActive(pathname, item);
                  const isDropOpen = stickyDropdown === item.label;
                  const submenuId = `sticky-submenu-${navId(item.label)}`;

                  return (
                    <div key={item.label} className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStickyDropdown(isDropOpen ? null : item.label);
                        }}
                        aria-expanded={isDropOpen}
                        aria-controls={submenuId}
                        className={`font-sans text-sm tracking-wide transition-colors cursor-pointer ${
                          isActive ? "text-forest" : "text-charcoal/70 hover:text-charcoal"
                        }`}
                      >
                        {item.label}
                        <svg
                          className={`inline-block w-3 h-3 ml-1 transition-transform duration-200 ${isDropOpen ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div
                        id={submenuId}
                        role="region"
                        aria-label={`${item.label} submenu`}
                        className={`dropdown-menu${isDropOpen ? " is-open" : ""} absolute top-full left-0 mt-2 bg-warm-white rounded-xl shadow-lg border border-charcoal/5 py-2 min-w-[min(200px,80vw)]`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.children.map((child) => (
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
                              aria-current={isNavHrefActive(pathname, child.href) ? "page" : undefined}
                              className={`block px-4 py-2 font-sans text-sm transition-colors ${
                                isNavHrefActive(pathname, child.href)
                                  ? "text-forest"
                                  : "text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5"
                              }`}
                            >
                              {child.label}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    aria-current={isNavHrefActive(pathname, item.href) ? "page" : undefined}
                    className={`font-sans text-sm tracking-wide transition-colors ${
                      isNavHrefActive(pathname, item.href)
                        ? "text-forest"
                        : "text-charcoal/70 hover:text-charcoal"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStickyDropdown(stickyDropdown === "user" ? null : "user");
                    }}
                    aria-expanded={stickyDropdown === "user"}
                    aria-controls="sticky-user-menu"
                    className="font-sans text-sm tracking-wide text-charcoal/70 hover:text-charcoal transition-colors cursor-pointer"
                  >
                    Dashboard
                    <svg
                      className={`inline-block w-3 h-3 ml-1 transition-transform duration-200 ${stickyDropdown === "user" ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    id="sticky-user-menu"
                    role="region"
                    aria-label="User menu"
                    className={`dropdown-menu${stickyDropdown === "user" ? " is-open" : ""} absolute top-full right-0 mt-2 bg-warm-white rounded-xl shadow-lg border border-charcoal/5 py-2 min-w-[min(160px,80vw)]`}
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
                      onClick={() => handleLogout()}
                      className="block w-full text-left px-4 py-2 font-sans text-sm text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href={AUTH_NAV_ITEM.href!}
                  className="font-sans text-sm tracking-wide text-charcoal/70 hover:text-charcoal transition-colors"
                >
                  {AUTH_NAV_ITEM.label}
                </Link>
              )}
            </nav>
          </div>
        </header>
      )}

      <div
        ref={overlayRef}
        id="site-menu-overlay"
        className="fixed inset-0 z-[240] bg-charcoal pointer-events-none"
        style={{ clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)", height: "100dvh" }}
        aria-hidden={!isOpen}
        inert={!isOpen || undefined}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-charcoal via-charcoal/85 to-transparent transition-opacity duration-200 ${
            menuCanScrollUp ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-charcoal via-charcoal/90 to-transparent transition-opacity duration-200 ${
            menuCanScrollDown ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={menuScrollRef}
          className="pointer-events-auto relative h-full overflow-y-auto overscroll-contain scrollbar-hide"
          style={{
            paddingLeft: "max(1.5rem, 5vw)",
            paddingRight: "max(1.5rem, 5vw)",
            paddingTop: "calc(max(4.5rem, 10vh) + env(safe-area-inset-top))",
            paddingBottom: "calc(max(1.5rem, 4vh) + env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col">
            <nav
              aria-label="Main navigation"
              className="flex flex-col"
              style={{ gap: "clamp(0.35rem, 1vh, 1rem)" }}
            >
              {PUBLIC_NAV_ITEMS.map((item, i) => {
                if (item.children) {
                  const isExpanded = expandedItem === i;
                  const isActive = isNavItemActive(pathname, item);
                  const submenuId = `submenu-${navId(item.label)}`;

                  return (
                    <div key={item.label}>
                      <button
                        ref={(el) => setLinkRef(el, i)}
                        onClick={() => setExpandedItem(isExpanded ? null : i)}
                        aria-expanded={isExpanded}
                        aria-controls={submenuId}
                        className={`group flex w-full items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 cursor-pointer text-left ${
                          isActive ? "text-forest" : "text-cream hover:text-forest"
                        }`}
                      >
                        <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6 shrink-0">
                          {item.num}
                        </span>
                        <span
                          className="font-serif font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4"
                          style={{ fontSize: "clamp(1.75rem, 5vw + 0.5vh, 6rem)" }}
                        >
                          {item.label}
                        </span>
                        <svg
                          className={`w-5 h-5 md:w-7 md:h-7 transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
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
                        id={submenuId}
                        role="region"
                        aria-label={`${item.label} submenu`}
                        className={`overflow-hidden transition-all duration-400 ${isExpanded ? "max-h-[32rem] mt-2" : "max-h-0"}`}
                      >
                        {item.children.map((child, j) => {
                          const childClassName = `group flex items-baseline gap-4 md:gap-6 pl-6 sm:pl-10 md:pl-16 py-1 transition-all duration-300 ${
                            isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                          } ${
                            !child.external && isNavHrefActive(pathname, child.href)
                              ? "text-forest"
                              : "text-cream/80 hover:text-forest"
                          }`;
                          const childStyle = { transitionDelay: isExpanded ? `${j * 60}ms` : "0ms" };
                          const childInner = (
                            <>
                              <span
                                className="font-serif font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4"
                                style={{ fontSize: "clamp(1.25rem, 3.5vw + 0.3vh, 3.75rem)" }}
                              >
                                {child.label}
                              </span>
                              {child.external && (
                                <svg className="w-4 h-4 md:w-5 md:h-5 opacity-40 group-hover:opacity-100 transition-opacity self-center shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                                className={childClassName}
                                style={childStyle}
                              >
                                {childInner}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={(e) => handleNavClick(e, child.href)}
                              aria-current={isNavHrefActive(pathname, child.href) ? "page" : undefined}
                              className={childClassName}
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

                return (
                  <Link
                    key={item.href}
                    ref={(el) => setLinkRef(el, i)}
                    href={item.href!}
                    onClick={(e) => handleNavClick(e, item.href!)}
                    aria-current={isNavHrefActive(pathname, item.href) ? "page" : undefined}
                    className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 ${
                      isNavHrefActive(pathname, item.href)
                        ? "text-forest"
                        : "text-cream hover:text-forest"
                    }`}
                  >
                    <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6 shrink-0">
                      {item.num}
                    </span>
                    <span
                      className="font-serif font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4"
                      style={{ fontSize: "clamp(1.75rem, 5vw + 0.5vh, 6rem)" }}
                    >
                      {item.label}
                    </span>
                    <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                  </Link>
                );
              })}

              {isLoggedIn ? (
                <div key="auth-overlay-link" className="mt-4 md:mt-6">
                  <div className="h-[1px] bg-cream/10 mb-3 md:mb-4" style={{ maxWidth: "8rem" }} />
                  <Link
                    ref={(el) => setLinkRef(el, PUBLIC_NAV_ITEMS.length)}
                    href={authHref!}
                    onClick={(e) => handleNavClick(e, authHref!)}
                    aria-current={isNavHrefActive(pathname, authHref) ? "page" : undefined}
                    className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 ${
                      isNavHrefActive(pathname, authHref)
                        ? "text-forest"
                        : "text-cream/80 hover:text-forest"
                    }`}
                  >
                    <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6 shrink-0">
                      {AUTH_NAV_ITEM.num}
                    </span>
                    <span
                      className="font-serif font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4"
                      style={{ fontSize: "clamp(1.25rem, 3vw + 0.3vh, 3.75rem)" }}
                    >
                      {authLabel}
                    </span>
                    <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                  </Link>

                  <button
                    onClick={() => handleLogout(true)}
                    className="pl-6 sm:pl-10 md:pl-16 mt-2 font-sans text-sm md:text-base tracking-wide text-cream/60 hover:text-forest transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  key="auth-overlay-link"
                  ref={(el) => setLinkRef(el, PUBLIC_NAV_ITEMS.length)}
                  href={authHref!}
                  onClick={(e) => handleNavClick(e, authHref!)}
                  aria-current={isNavHrefActive(pathname, authHref) ? "page" : undefined}
                  className={`group flex items-baseline gap-4 md:gap-6 opacity-0 transition-colors duration-300 ${
                    isNavHrefActive(pathname, authHref)
                      ? "text-forest"
                      : "text-cream hover:text-forest"
                  }`}
                >
                  <span className="font-sans text-xs md:text-sm tracking-widest opacity-40 group-hover:opacity-100 transition-opacity w-6 shrink-0">
                    {AUTH_NAV_ITEM.num}
                  </span>
                  <span
                    className="font-serif font-bold tracking-tight menu-link-text transition-transform duration-300 group-hover:translate-x-4"
                    style={{ fontSize: "clamp(1.75rem, 5vw + 0.5vh, 6rem)" }}
                  >
                    {authLabel}
                  </span>
                  <span className="hidden md:block h-[1px] flex-1 bg-cream/10 group-hover:bg-forest/30 transition-colors self-center ml-4" />
                </Link>
              )}
            </nav>

            <div className="menu-footer mt-auto pt-10 md:pt-12 flex flex-col md:flex-row md:items-end justify-between gap-8 opacity-0">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-cream/60 mb-2">
                  Build your home &middot; Build your skills &middot; Build your wealth
                </p>
                <p className="font-serif text-cream/60 text-sm">
                  Land, training, and pathways to ownership near America&apos;s national parks.
                </p>
              </div>

              <div className="flex flex-wrap gap-6">
                {PUBLIC_SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.label !== "Email" ? "_blank" : undefined}
                    rel={social.label !== "Email" ? "noopener noreferrer" : undefined}
                    aria-label={social.ariaLabel}
                    className="font-sans text-xs uppercase tracking-widest text-cream/60 hover:text-cream transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
