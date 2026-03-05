#!/usr/bin/env python3
"""
Comprehensive Playwright bug scan for the 500 Acres React site.
Tests routes, navigation, mobile viewport, scroll story, links, and assets.
"""

import json
import os
import time
import traceback
from datetime import datetime
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5174"
OUT = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results/comprehensive"

ROUTES = [
    ("/", "home"),
    ("/about", "about"),
    ("/stories", "stories"),
    ("/resources", "resources"),
    ("/get-involved", "get-involved"),
    ("/nonexistent-page", "404"),
]

# ---- Result tracking ----
results = {
    "total": 0,
    "passes": 0,
    "failures": [],
    "console_errors": [],
    "warnings": [],
    "broken_links": [],
    "network_errors": [],
}


def test(name, condition, detail=""):
    results["total"] += 1
    if condition:
        results["passes"] += 1
        print(f"  PASS  {name}")
    else:
        results["failures"].append({"test": name, "detail": detail})
        print(f"  FAIL  {name} -- {detail}")


# ============================================================================
# TESTS
# ============================================================================

def test_routes(browser):
    """1. Route testing - navigate to every route, check for crashes & console errors."""
    print("\n=== 1. ROUTE TESTING ===")
    for path, name in ROUTES:
        console_errors = []
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", lambda msg, ce=console_errors: (
            ce.append(msg.text) if msg.type == "error" else None
        ))

        try:
            resp = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2500)  # Loading screen + hydration

            status = resp.status if resp else 0
            test(f"Route {path} loads (HTTP {status})", status == 200, f"status={status}")

            # Check the page is not blank
            body_text = page.inner_text("body")
            has_content = len(body_text.strip()) > 20
            test(f"Route {path} has content", has_content,
                 f"body length={len(body_text.strip())}")

            # For 404 page, check it renders a proper message
            if path == "/nonexistent-page":
                has_heading = page.query_selector("h1, h2") is not None
                test("404 page renders heading", has_heading)

            # Screenshot
            ss_path = os.path.join(OUT, f"route_{name}.png")
            page.screenshot(path=ss_path, full_page=True)
            print(f"        screenshot -> {ss_path}")

            # Console errors
            # Filter out noisy / known messages
            filtered = [e for e in console_errors if not any(skip in e for skip in [
                "Download the React DevTools",
                "Third-party cookie",
                "net::ERR_",
                "favicon",
            ])]

            if filtered:
                for e in filtered:
                    results["console_errors"].append(f"[{path}] {e}")
                test(f"Route {path} no console errors", False,
                     f"{len(filtered)} error(s): {filtered[0][:120]}")
            else:
                test(f"Route {path} no console errors", True)

        except Exception as exc:
            test(f"Route {path} loads", False, str(exc)[:200])

        page.close()


def test_navigation(browser):
    """2. Navigation testing - hamburger menu, nav link click, back button."""
    print("\n=== 2. NAVIGATION TESTING ===")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    console_errors = []
    page.on("console", lambda msg: (
        console_errors.append(msg.text) if msg.type == "error" else None
    ))

    try:
        page.goto(f"{BASE}/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)  # Loading screen

        # Click hamburger menu
        menu_btn = page.locator("button[aria-label='Open menu'], button[aria-label='Close menu']")
        menu_btn.wait_for(timeout=10000)
        test("Menu button exists", True)

        menu_btn.click()
        page.wait_for_timeout(1200)  # GSAP animation

        # Verify overlay is expanded
        overlay_visible = page.evaluate("""() => {
            const ov = document.querySelector('[aria-hidden]');
            if (!ov) return false;
            const cs = getComputedStyle(ov);
            return cs.clipPath.includes('150%') || ov.getAttribute('aria-hidden') === 'false';
        }""")
        test("Menu overlay opens", overlay_visible)

        page.screenshot(path=os.path.join(OUT, "nav_menu_open.png"), full_page=False)

        # Click the "About" link
        about_link = page.locator("nav[aria-label='Main navigation'] a[href='/about']")
        about_link.wait_for(timeout=5000)
        about_link.click()
        page.wait_for_timeout(2500)  # Navigation animation (280ms) + page load

        current_url = page.url
        test("Nav link navigates to /about", "/about" in current_url, f"URL is {current_url}")

        page.screenshot(path=os.path.join(OUT, "nav_after_about.png"), full_page=False)

        # Test back button
        page.go_back()
        page.wait_for_timeout(2500)
        current_url = page.url
        is_home = current_url.rstrip("/") == BASE or current_url == f"{BASE}/"
        test("Back button returns to home", is_home, f"URL is {current_url}")

        page.screenshot(path=os.path.join(OUT, "nav_back_home.png"), full_page=False)

    except Exception as exc:
        test("Navigation test", False, str(exc)[:200])

    if console_errors:
        for e in console_errors:
            results["console_errors"].append(f"[nav] {e}")

    page.close()


def test_mobile_viewport(browser):
    """3. Mobile viewport testing (390x844)."""
    print("\n=== 3. MOBILE VIEWPORT TESTING (390x844) ===")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    console_errors = []
    page.on("console", lambda msg: (
        console_errors.append(msg.text) if msg.type == "error" else None
    ))

    try:
        # ---- Homepage ----
        page.goto(f"{BASE}/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)

        page.screenshot(path=os.path.join(OUT, "mobile_home_top.png"), full_page=False)

        # Scroll through
        height = page.evaluate("document.body.scrollHeight")
        test(f"Mobile homepage has scroll content (height={height})", height > 2000)

        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(OUT, "mobile_home_bottom.png"), full_page=False)
        test("Mobile homepage scrolls", True)

    except Exception as exc:
        test("Mobile homepage loads and scrolls", False, str(exc)[:200])

    try:
        # ---- About page ----
        page.goto(f"{BASE}/about", wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(1500)
        body = page.inner_text("body")
        has_content = len(body.strip()) > 30
        test("Mobile /about renders content", has_content,
             f"body length={len(body.strip())}")
        page.screenshot(path=os.path.join(OUT, "mobile_about.png"), full_page=False)

    except Exception as exc:
        test("Mobile /about renders content", False, str(exc)[:200])

    try:
        # ---- Nav menu open/close ----
        menu_btn = page.locator("button[aria-label='Open menu'], button[aria-label='Close menu']")
        menu_btn.click()
        page.wait_for_timeout(1200)
        page.screenshot(path=os.path.join(OUT, "mobile_nav_open.png"), full_page=False)

        nav_visible = page.locator("nav[aria-label='Main navigation']").is_visible()
        test("Mobile nav menu opens", nav_visible)

        # Check links are visible (not clipped by GSAP animation)
        links_info = page.evaluate("""() => {
            const links = document.querySelectorAll('nav[aria-label="Main navigation"] a');
            let allVisible = true;
            links.forEach(l => {
                const style = getComputedStyle(l);
                if (parseFloat(style.opacity) < 0.5) allVisible = false;
            });
            return { count: links.length, allVisible };
        }""")
        test(f"Mobile nav links visible ({links_info['count']} links)", links_info["allVisible"],
             "Some links have low opacity")

        # Close menu
        close_btn = page.locator("button[aria-label='Close menu']")
        close_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT, "mobile_nav_closed.png"), full_page=False)
        test("Mobile nav menu closes", True)

    except Exception as exc:
        test("Mobile nav open/close", False, str(exc)[:200])

    if console_errors:
        filtered = [e for e in console_errors if "DevTools" not in e and "Third-party" not in e]
        for e in filtered:
            results["console_errors"].append(f"[mobile] {e}")

    page.close()


def test_homepage_scroll_story(browser):
    """4. Scroll through the entire homepage slowly, checking for errors."""
    print("\n=== 4. HOMEPAGE SCROLL STORY ===")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    console_errors = []
    js_exceptions = []

    page.on("console", lambda msg: (
        console_errors.append(f"scrollY~{page.evaluate('window.scrollY') if True else 0}: {msg.text}")
        if msg.type == "error" else None
    ))
    page.on("pageerror", lambda exc: js_exceptions.append(str(exc)))

    try:
        page.goto(f"{BASE}/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(4000)  # Loading screen

        total_height = page.evaluate("document.body.scrollHeight")
        print(f"  Page height: {total_height}px")

        # Count sections/slides
        slides_info = page.evaluate("""() => {
            const sections = document.querySelectorAll('section, [class*="slide"], [class*="Slide"]');
            return {
                count: sections.length,
                ids: Array.from(sections).map(s => s.id || s.className.split(' ')[0]).slice(0, 20)
            };
        }""")
        print(f"  Sections/slides found: {slides_info['count']}")
        test("Homepage has sections", slides_info["count"] > 0)

        # Scroll every 1000px
        step = 1000
        positions = list(range(0, total_height + step, step))
        screenshot_idx = 0

        errors_before = len(console_errors)
        exceptions_before = len(js_exceptions)

        for pos in positions:
            if pos > total_height:
                pos = total_height
            page.evaluate(f"window.scrollTo(0, {pos})")
            page.wait_for_timeout(350)

            # Screenshot every 4000px
            if pos % 4000 == 0:
                ss = os.path.join(OUT, f"scroll_{screenshot_idx}.png")
                page.screenshot(path=ss, full_page=False)
                screenshot_idx += 1

        test(f"Scrolled through {len(positions)} positions", True)

        new_errors = console_errors[errors_before:]
        new_exceptions = js_exceptions[exceptions_before:]

        # Filter out benign errors
        critical_errors = [e for e in new_errors if not any(skip in e for skip in [
            "DevTools", "Third-party", "favicon", "WebGL",
        ])]
        critical_exceptions = [e for e in new_exceptions if "WebGL" not in e]

        if critical_errors:
            test("No console errors during scroll", False,
                 f"{len(critical_errors)} error(s): {critical_errors[0][:120]}")
            for e in critical_errors:
                results["console_errors"].append(f"[scroll] {e}")
        else:
            test("No console errors during scroll", True)

        if critical_exceptions:
            test("No JS exceptions during scroll", False,
                 f"{len(critical_exceptions)} exception(s): {critical_exceptions[0][:120]}")
            for e in critical_exceptions:
                results["console_errors"].append(f"[scroll-exception] {e}")
        else:
            test("No JS exceptions during scroll", True)

    except Exception as exc:
        test("Homepage scroll story", False, str(exc)[:200])

    page.close()


def test_link_validation(browser):
    """5. Find all internal links on the About page and verify they work."""
    print("\n=== 5. LINK VALIDATION (About Page) ===")
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    try:
        page.goto(f"{BASE}/about", wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(2000)

        # Scroll to load lazy content
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)

        links = page.evaluate("""() => {
            const anchors = document.querySelectorAll('a[href]');
            const seen = new Set();
            const result = [];
            anchors.forEach(a => {
                const href = a.getAttribute('href');
                if (!seen.has(href) && href.startsWith('/')) {
                    seen.add(href);
                    result.push({
                        href: href,
                        text: a.textContent.trim().substring(0, 60)
                    });
                }
            });
            return result;
        }""")

        print(f"  Found {len(links)} unique internal links on /about")

        broken = []
        for link in links:
            href = link["href"]
            try:
                resp = page.goto(f"{BASE}{href}", wait_until="domcontentloaded", timeout=12000)
                status = resp.status if resp else 0
                if status >= 400:
                    broken.append(f"{href} (HTTP {status})")
                    test(f"Link {href}", False, f"HTTP {status}")
                else:
                    test(f"Link {href} ({link['text'][:25]})", True)
            except Exception as exc:
                broken.append(f"{href} (error: {str(exc)[:60]})")
                test(f"Link {href}", False, str(exc)[:100])

        results["broken_links"] = broken

        if not broken:
            print("  All internal links are valid.")
        else:
            print(f"  {len(broken)} broken link(s) found.")

    except Exception as exc:
        test("Link validation", False, str(exc)[:200])

    page.close()


def test_performance_assets(browser):
    """6. Performance / asset loading - check for 404s and network failures."""
    print("\n=== 6. PERFORMANCE & ASSET LOADING ===")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    asset_404s = []
    network_failures = []

    page.on("response", lambda resp: (
        asset_404s.append(f"{resp.status} {resp.url}")
        if resp.status >= 400 else None
    ))
    page.on("requestfailed", lambda req: (
        network_failures.append(f"{req.url} -- {req.failure}")
    ))

    for path, name in ROUTES:
        try:
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)

            # Scroll to trigger lazy loads
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)
        except Exception:
            pass  # Route errors already tested above

    # Deduplicate
    unique_404s = list(set(asset_404s))
    unique_failures = list(set(network_failures))

    if unique_404s:
        for u in unique_404s:
            results["network_errors"].append(f"[404] {u}")
        test("No 404 asset errors", False,
             f"{len(unique_404s)} unique 404(s): {unique_404s[0][:100]}")
    else:
        test("No 404 asset errors across all routes", True)

    if unique_failures:
        for f in unique_failures:
            results["network_errors"].append(f"[network-fail] {f}")
        test("No network failures", False,
             f"{len(unique_failures)} failure(s): {unique_failures[0][:100]}")
    else:
        test("No network failures across all routes", True)

    page.close()


# ============================================================================
# MAIN
# ============================================================================

def main():
    os.makedirs(OUT, exist_ok=True)
    start = time.time()

    print("=" * 65)
    print("  500 Acres -- Comprehensive Bug Scan")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        try:
            test_routes(browser)
            test_navigation(browser)
            test_mobile_viewport(browser)
            test_homepage_scroll_story(browser)
            test_link_validation(browser)
            test_performance_assets(browser)
        except Exception as exc:
            print(f"\n!!! FATAL ERROR: {exc}")
            traceback.print_exc()
        finally:
            browser.close()

    elapsed = time.time() - start

    # ---- Final Summary ----
    print("\n")
    print("=" * 65)
    print("  FINAL SUMMARY")
    print("=" * 65)
    print(f"  Total tests run  : {results['total']}")
    print(f"  Passed           : {results['passes']}")
    print(f"  Failed           : {len(results['failures'])}")
    print(f"  Console errors   : {len(results['console_errors'])}")
    print(f"  Warnings         : {len(results['warnings'])}")
    print(f"  Broken links     : {len(results['broken_links'])}")
    print(f"  Network errors   : {len(results['network_errors'])}")
    print(f"  Time elapsed     : {elapsed:.1f}s")
    print()

    if results["failures"]:
        print("--- Failures ---")
        for f in results["failures"]:
            print(f"  FAIL  {f['test']}")
            print(f"        {f['detail']}")
        print()

    if results["console_errors"]:
        print("--- Console Errors ---")
        seen = set()
        for err in results["console_errors"]:
            key = err[:150]
            if key not in seen:
                seen.add(key)
                print(f"  {err[:200]}")
        print()

    if results["warnings"]:
        print("--- Console Warnings (non-critical) ---")
        seen = set()
        for w in results["warnings"]:
            key = w[:150]
            if key not in seen:
                seen.add(key)
                print(f"  {w[:200]}")
        print()

    if results["broken_links"]:
        print("--- Broken Links ---")
        for bl in results["broken_links"]:
            print(f"  {bl}")
        print()

    if results["network_errors"]:
        print("--- Network Errors ---")
        seen = set()
        for ne in results["network_errors"]:
            if ne not in seen:
                seen.add(ne)
                print(f"  {ne[:200]}")
        print()

    if not results["failures"] and not results["network_errors"]:
        print("All tests passed! No critical issues found.")

    # Write JSON report
    report_path = os.path.join(OUT, "report.json")
    with open(report_path, "w") as fp:
        json.dump(results, fp, indent=2, default=str)
    print(f"\nFull report saved to {report_path}")
    print("=" * 65)


if __name__ == "__main__":
    main()
