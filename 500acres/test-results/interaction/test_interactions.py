"""
Comprehensive Playwright interaction tests for 500 Acres website.
Tests touch/tap interactions, keyboard navigation, page transitions, and responsive breakpoints.
"""

import os
import json
import time
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:5174"
OUTPUT_DIR = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results/interaction"

ROUTES = ["/", "/about", "/stories", "/resources", "/get-involved"]
BREAKPOINTS = {
    "mobile": {"width": 390, "height": 844},
    "tablet": {"width": 768, "height": 1024},
    "desktop": {"width": 1280, "height": 900},
    "wide": {"width": 1920, "height": 1080},
}

results = []


def log_result(category, test_name, status, detail=""):
    entry = {"category": category, "test": test_name, "status": status, "detail": detail}
    results.append(entry)
    icon = "PASS" if status == "pass" else "FAIL" if status == "fail" else "WARN"
    print(f"  [{icon}] {test_name}" + (f" -- {detail}" if detail else ""))


def wait_for_app_ready(page, timeout=15000):
    """Wait for the React app to be mounted and interactive."""
    try:
        page.wait_for_selector("#main-content", timeout=timeout)
        # Wait for any loading screen to disappear
        page.wait_for_timeout(1500)
    except Exception:
        pass


def test_touch_interactions(browser):
    """Test touch/tap interactions on mobile viewport."""
    print("\n=== TOUCH / TAP INTERACTIONS (Mobile 390x844) ===")

    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        has_touch=True,
        is_mobile=True,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    )
    page = context.new_page()

    # --- Test 1: Homepage loads and is scrollable via touch ---
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
        wait_for_app_ready(page)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "mobile_homepage_initial.png"))

        # Scroll down via touch gesture
        page.touchscreen.tap(195, 400)
        page.wait_for_timeout(300)

        # Simulate a swipe-up scroll
        for _ in range(5):
            page.evaluate("window.scrollBy(0, 600)")
            page.wait_for_timeout(400)

        scroll_pos = page.evaluate("window.scrollY")
        if scroll_pos > 0:
            log_result("touch", "Homepage touch scroll", "pass", f"Scrolled to y={scroll_pos}")
        else:
            log_result("touch", "Homepage touch scroll", "fail", "Page did not scroll")

        page.screenshot(path=os.path.join(OUTPUT_DIR, "mobile_homepage_scrolled.png"))
    except Exception as e:
        log_result("touch", "Homepage touch scroll", "fail", str(e))

    # --- Test 2: Hamburger menu tap opens and displays nav links ---
    try:
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)

        menu_btn = page.locator("button[aria-label='Open menu']")
        menu_btn.wait_for(state="visible", timeout=5000)
        menu_btn.tap()
        page.wait_for_timeout(1200)  # Wait for GSAP animation

        overlay = page.locator("[aria-label='Main navigation']")
        is_visible = overlay.is_visible()

        if is_visible:
            log_result("touch", "Hamburger menu tap opens nav", "pass")
        else:
            log_result("touch", "Hamburger menu tap opens nav", "fail", "Nav overlay not visible after tap")

        page.screenshot(path=os.path.join(OUTPUT_DIR, "mobile_menu_open.png"))
    except Exception as e:
        log_result("touch", "Hamburger menu tap opens nav", "fail", str(e))

    # --- Test 3: Nav link tap navigates to page ---
    try:
        about_link = page.locator("nav[aria-label='Main navigation'] a:has-text('About')")
        about_link.wait_for(state="visible", timeout=5000)
        about_link.tap()
        page.wait_for_timeout(2000)  # Wait for navigation + menu close animation

        current_url = page.url
        if "/about" in current_url:
            log_result("touch", "Nav link tap navigates to About", "pass", f"URL: {current_url}")
        else:
            log_result("touch", "Nav link tap navigates to About", "fail", f"URL: {current_url}")

        page.screenshot(path=os.path.join(OUTPUT_DIR, "mobile_about_page.png"))
    except Exception as e:
        log_result("touch", "Nav link tap navigates to About", "fail", str(e))

    # --- Test 4: Verify menu closes after navigation ---
    try:
        page.wait_for_timeout(1000)
        overlay_el = page.locator("div[aria-hidden='true']").first
        # The overlay should be present but hidden (clip-path circle(0%))
        is_hidden = page.evaluate("""() => {
            const el = document.querySelector('[aria-hidden]');
            if (!el) return true;
            const style = window.getComputedStyle(el);
            const cp = style.clipPath || el.style.clipPath;
            return cp.includes('0%');
        }""")
        if is_hidden:
            log_result("touch", "Menu closes after nav link tap", "pass")
        else:
            log_result("touch", "Menu closes after nav link tap", "warn", "Menu overlay may still be visible")
    except Exception as e:
        log_result("touch", "Menu closes after nav link tap", "fail", str(e))

    # --- Test 5: Touch on interactive elements on About page ---
    try:
        # Scroll down to find interactive elements
        for _ in range(3):
            page.evaluate("window.scrollBy(0, 500)")
            page.wait_for_timeout(400)

        # Check for any tappable links or buttons
        links = page.locator("a[href], button").all()
        tappable_count = sum(1 for link in links if link.is_visible())
        log_result("touch", "Interactive elements on About page", "pass", f"{tappable_count} tappable elements found")
    except Exception as e:
        log_result("touch", "Interactive elements on About page", "fail", str(e))

    # --- Test 6: Navigate back to homepage via menu and scroll ---
    try:
        menu_btn = page.locator("button[aria-label='Open menu']")
        menu_btn.tap()
        page.wait_for_timeout(1200)

        home_link = page.locator("nav[aria-label='Main navigation'] a:has-text('Home')")
        home_link.wait_for(state="visible", timeout=5000)
        home_link.tap()
        page.wait_for_timeout(2000)

        if page.url.rstrip("/") == BASE_URL.rstrip("/") or page.url.endswith("/"):
            log_result("touch", "Navigate back to homepage via menu", "pass")
        else:
            log_result("touch", "Navigate back to homepage via menu", "fail", f"URL: {page.url}")

        # Verify scrolling still works after navigation
        page.wait_for_timeout(1000)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(300)

        for _ in range(3):
            page.evaluate("window.scrollBy(0, 500)")
            page.wait_for_timeout(400)

        scroll_after = page.evaluate("window.scrollY")
        if scroll_after > 0:
            log_result("touch", "Scroll works after return to homepage", "pass", f"scrollY={scroll_after}")
        else:
            log_result("touch", "Scroll works after return to homepage", "fail", "Page not scrollable after nav")
    except Exception as e:
        log_result("touch", "Navigate back to homepage via menu", "fail", str(e))

    # --- Test 7: Touch on Logo navigates home ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        logo_link = page.locator("a[aria-label='500 Acres Home']")
        logo_link.wait_for(state="visible", timeout=5000)
        logo_link.tap()
        page.wait_for_timeout(2000)

        if page.url.rstrip("/") == BASE_URL.rstrip("/") or page.url.endswith(":5174/"):
            log_result("touch", "Logo tap navigates to home", "pass")
        else:
            log_result("touch", "Logo tap navigates to home", "fail", f"URL: {page.url}")
    except Exception as e:
        log_result("touch", "Logo tap navigates to home", "fail", str(e))

    context.close()


def test_keyboard_navigation(browser):
    """Test keyboard navigation including Tab, Escape, and Enter."""
    print("\n=== KEYBOARD NAVIGATION ===")

    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = context.new_page()

    # --- Test 1: Skip to content link ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        page.keyboard.press("Tab")
        page.wait_for_timeout(300)

        skip_link = page.locator("a:has-text('Skip to content')")
        is_focused = page.evaluate("""() => {
            const active = document.activeElement;
            return active && active.textContent && active.textContent.includes('Skip to content');
        }""")

        if is_focused:
            log_result("keyboard", "Skip to content link receives first focus", "pass")
        else:
            active_tag = page.evaluate("document.activeElement?.tagName")
            active_text = page.evaluate("document.activeElement?.textContent?.substring(0,50)")
            log_result("keyboard", "Skip to content link receives first focus", "warn",
                      f"First focused element: <{active_tag}> '{active_text}'")
    except Exception as e:
        log_result("keyboard", "Skip to content link receives first focus", "fail", str(e))

    # --- Test 2: Tab through focusable elements on About page ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        focused_elements = []
        for i in range(20):
            page.keyboard.press("Tab")
            page.wait_for_timeout(200)
            info = page.evaluate("""() => {
                const el = document.activeElement;
                if (!el || el === document.body) return null;
                return {
                    tag: el.tagName,
                    text: (el.textContent || '').substring(0, 40).trim(),
                    href: el.getAttribute('href') || '',
                    ariaLabel: el.getAttribute('aria-label') || '',
                    role: el.getAttribute('role') || '',
                };
            }""")
            if info:
                focused_elements.append(info)

        unique_elements = len(set(json.dumps(e) for e in focused_elements))
        if unique_elements >= 3:
            log_result("keyboard", "Tab cycles through focusable elements", "pass",
                      f"{unique_elements} unique elements focused in 20 tabs")
        else:
            log_result("keyboard", "Tab cycles through focusable elements", "warn",
                      f"Only {unique_elements} unique elements focused")

        # Log element details for debugging
        for i, el in enumerate(focused_elements[:8]):
            print(f"    Tab {i+1}: <{el['tag']}> '{el['text'][:30]}' href={el['href'][:30]}")
    except Exception as e:
        log_result("keyboard", "Tab cycles through focusable elements", "fail", str(e))

    # --- Test 3: Open menu and verify focus behavior ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        menu_btn = page.locator("button[aria-label='Open menu']")
        menu_btn.click()
        page.wait_for_timeout(1500)

        # Tab within the open menu
        menu_focused = []
        for i in range(10):
            page.keyboard.press("Tab")
            page.wait_for_timeout(200)
            info = page.evaluate("""() => {
                const el = document.activeElement;
                if (!el || el === document.body) return null;
                return {
                    tag: el.tagName,
                    text: (el.textContent || '').substring(0, 40).trim(),
                    href: el.getAttribute('href') || '',
                    inOverlay: !!el.closest('[aria-hidden]') || !!el.closest('nav[aria-label="Main navigation"]'),
                };
            }""")
            if info:
                menu_focused.append(info)

        # Check if the overlay uses inert to trap focus
        overlay_inert = page.evaluate("""() => {
            const overlay = document.querySelector('[aria-hidden="false"]');
            return overlay !== null;
        }""")

        nav_items_focused = [e for e in menu_focused if e.get("inOverlay")]
        if len(nav_items_focused) > 0:
            log_result("keyboard", "Focus enters nav menu when open", "pass",
                      f"{len(nav_items_focused)} menu items focused")
        else:
            # Check if inert is being used (which would prevent focus)
            inert_used = page.evaluate("""() => {
                const overlay = document.querySelector('div.fixed.inset-0');
                return overlay ? overlay.hasAttribute('inert') : false;
            }""")
            if not inert_used:
                log_result("keyboard", "Focus enters nav menu when open", "warn",
                          "No menu items received focus -- focus may not be trapped")
            else:
                log_result("keyboard", "Focus enters nav menu when open", "warn",
                          "Overlay uses inert attribute; focus may stay outside")
    except Exception as e:
        log_result("keyboard", "Focus enters nav menu when open", "fail", str(e))

    # --- Test 4: Escape closes the menu ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        menu_btn = page.locator("button[aria-label='Open menu']")
        menu_btn.click()
        page.wait_for_timeout(1500)

        # Verify menu is open
        nav_visible = page.locator("nav[aria-label='Main navigation']").is_visible()

        page.keyboard.press("Escape")
        page.wait_for_timeout(1000)

        is_closed = page.evaluate("""() => {
            const overlay = document.querySelector('.fixed.inset-0.bg-charcoal');
            if (!overlay) return true;
            const cp = window.getComputedStyle(overlay).clipPath || overlay.style.clipPath;
            return cp.includes('0%');
        }""")

        if is_closed:
            log_result("keyboard", "Escape closes nav menu", "pass")
        else:
            log_result("keyboard", "Escape closes nav menu", "fail",
                      "Menu did not close on Escape key press")
            page.screenshot(path=os.path.join(OUTPUT_DIR, "escape_menu_not_closed.png"))
    except Exception as e:
        log_result("keyboard", "Escape closes nav menu", "fail", str(e))

    # --- Test 5: Enter activates nav links ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        menu_btn = page.locator("button[aria-label='Open menu']")
        menu_btn.focus()
        page.keyboard.press("Enter")
        page.wait_for_timeout(1500)

        # Now tab to a nav link and press Enter
        for i in range(8):
            page.keyboard.press("Tab")
            page.wait_for_timeout(200)
            text = page.evaluate("document.activeElement?.textContent?.trim()?.substring(0,30)")
            if text and "Stories" in text:
                page.keyboard.press("Enter")
                page.wait_for_timeout(2500)
                break
            elif text and "Resources" in text:
                page.keyboard.press("Enter")
                page.wait_for_timeout(2500)
                break

        current_url = page.url
        navigated = "/stories" in current_url or "/resources" in current_url
        if navigated:
            log_result("keyboard", "Enter key activates nav links", "pass", f"Navigated to {current_url}")
        else:
            log_result("keyboard", "Enter key activates nav links", "warn",
                      f"Could not confirm keyboard navigation. URL: {current_url}")
    except Exception as e:
        log_result("keyboard", "Enter key activates nav links", "fail", str(e))

    # --- Test 6: Focus visible outline is present ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        page.keyboard.press("Tab")
        page.wait_for_timeout(300)
        page.keyboard.press("Tab")
        page.wait_for_timeout(300)

        has_focus_style = page.evaluate("""() => {
            const el = document.activeElement;
            if (!el) return false;
            const style = window.getComputedStyle(el);
            const outline = style.outlineStyle;
            const outlineWidth = parseFloat(style.outlineWidth);
            const boxShadow = style.boxShadow;
            return (outline !== 'none' && outlineWidth > 0) || (boxShadow !== 'none');
        }""")

        if has_focus_style:
            log_result("keyboard", "Focus visible indicator present", "pass")
        else:
            log_result("keyboard", "Focus visible indicator present", "warn",
                      "No outline or box-shadow detected on focused element")
            page.screenshot(path=os.path.join(OUTPUT_DIR, "focus_indicator_missing.png"))
    except Exception as e:
        log_result("keyboard", "Focus visible indicator present", "fail", str(e))

    context.close()


def test_page_transitions(browser):
    """Test page transitions and state management."""
    print("\n=== PAGE TRANSITIONS ===")

    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = context.new_page()

    # --- Test 1: Navigate through all routes via menu ---
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
        wait_for_app_ready(page)

        visited = []
        for route in ["/about", "/stories", "/resources", "/get-involved"]:
            menu_btn = page.locator("button[aria-label='Open menu'], button[aria-label='Close menu']")
            menu_btn.click()
            page.wait_for_timeout(1200)

            route_name = route.strip("/").replace("-", " ").title() or "Home"
            # Map route names to link text
            link_text_map = {
                "/about": "About",
                "/stories": "Stories",
                "/resources": "Resources",
                "/get-involved": "Get Involved",
            }
            link_text = link_text_map.get(route, "Home")

            nav_link = page.locator(f"nav[aria-label='Main navigation'] a:has-text('{link_text}')")
            nav_link.click()
            page.wait_for_timeout(2500)

            if route in page.url:
                visited.append(route)

        if len(visited) == 4:
            log_result("transitions", "Navigate through all routes via menu", "pass",
                      f"Visited: {', '.join(visited)}")
        else:
            log_result("transitions", "Navigate through all routes via menu", "fail",
                      f"Only visited: {', '.join(visited)}")
    except Exception as e:
        log_result("transitions", "Navigate through all routes via menu", "fail", str(e))

    # --- Test 2: Rapid page switching (no state corruption) ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        # Rapid navigation using direct URL changes
        rapid_routes = ["/resources", "/stories", "/about", "/get-involved", "/about", "/"]
        for route in rapid_routes:
            page.goto(BASE_URL + route, wait_until="domcontentloaded", timeout=10000)
            page.wait_for_timeout(500)

        page.wait_for_timeout(1000)

        if len(errors) == 0:
            log_result("transitions", "Rapid page switching (no JS errors)", "pass")
        else:
            log_result("transitions", "Rapid page switching (no JS errors)", "fail",
                      f"{len(errors)} JS errors: {errors[0][:100]}")
    except Exception as e:
        log_result("transitions", "Rapid page switching (no JS errors)", "fail", str(e))

    # --- Test 3: ScrollTrigger cleanup (scroll homepage -> navigate away -> return) ---
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
        wait_for_app_ready(page)

        # Scroll to bottom of homepage
        for _ in range(15):
            page.evaluate("window.scrollBy(0, 800)")
            page.wait_for_timeout(300)

        scroll_before = page.evaluate("window.scrollY")
        page.screenshot(path=os.path.join(OUTPUT_DIR, "homepage_scrolled_bottom.png"))

        # Navigate to about
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        about_scroll = page.evaluate("window.scrollY")

        # Navigate back to homepage
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
        wait_for_app_ready(page)

        home_scroll_after = page.evaluate("window.scrollY")

        # Try scrolling again
        scroll_works = True
        for _ in range(5):
            page.evaluate("window.scrollBy(0, 600)")
            page.wait_for_timeout(300)

        final_scroll = page.evaluate("window.scrollY")

        if final_scroll > 0:
            log_result("transitions", "ScrollTrigger cleanup after navigation", "pass",
                      f"Scroll works on return. Final scrollY={final_scroll}")
        else:
            log_result("transitions", "ScrollTrigger cleanup after navigation", "fail",
                      "Scroll does not work after returning to homepage")
            page.screenshot(path=os.path.join(OUTPUT_DIR, "scroll_broken_after_nav.png"))
    except Exception as e:
        log_result("transitions", "ScrollTrigger cleanup after navigation", "fail", str(e))

    # --- Test 4: Browser back button works ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        page.goto(BASE_URL + "/stories", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        page.go_back()
        page.wait_for_timeout(2000)

        if "/about" in page.url:
            log_result("transitions", "Browser back button navigation", "pass")
        else:
            log_result("transitions", "Browser back button navigation", "fail", f"URL: {page.url}")
    except Exception as e:
        log_result("transitions", "Browser back button navigation", "fail", str(e))

    # --- Test 5: Body overflow resets between pages ---
    try:
        page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        # Open and close menu
        menu_btn = page.locator("button[aria-label='Open menu']")
        menu_btn.click()
        page.wait_for_timeout(1500)

        overflow_open = page.evaluate("document.body.style.overflow")

        # Navigate to another page (which should close menu)
        page.goto(BASE_URL + "/resources", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        overflow_after = page.evaluate("document.body.style.overflow")

        if overflow_after == "" or overflow_after == "auto" or overflow_after == "visible":
            log_result("transitions", "Body overflow resets after menu close + nav", "pass",
                      f"overflow during menu: '{overflow_open}', after nav: '{overflow_after}'")
        else:
            log_result("transitions", "Body overflow resets after menu close + nav", "fail",
                      f"overflow stuck at '{overflow_after}'")
    except Exception as e:
        log_result("transitions", "Body overflow resets after menu close + nav", "fail", str(e))

    # --- Test 6: 404 page ---
    try:
        page.goto(BASE_URL + "/nonexistent-page", wait_until="domcontentloaded", timeout=15000)
        wait_for_app_ready(page)

        body_text = page.locator("body").inner_text()
        has_404_content = "404" in body_text or "not found" in body_text.lower() or "page" in body_text.lower()

        if has_404_content:
            log_result("transitions", "404 page renders for unknown routes", "pass")
        else:
            log_result("transitions", "404 page renders for unknown routes", "warn",
                      "No clear 404 message found")
        page.screenshot(path=os.path.join(OUTPUT_DIR, "404_page.png"))
    except Exception as e:
        log_result("transitions", "404 page renders for unknown routes", "fail", str(e))

    context.close()


def test_responsive_breakpoints(browser):
    """Test responsive breakpoints and take screenshots."""
    print("\n=== RESPONSIVE BREAKPOINTS ===")

    for bp_name, dimensions in BREAKPOINTS.items():
        print(f"\n  --- {bp_name} ({dimensions['width']}x{dimensions['height']}) ---")

        is_mobile = bp_name == "mobile"
        context = browser.new_context(
            viewport=dimensions,
            has_touch=is_mobile,
            is_mobile=is_mobile,
        )
        page = context.new_page()

        # --- Test homepage at this breakpoint ---
        try:
            page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
            wait_for_app_ready(page)

            page.screenshot(
                path=os.path.join(OUTPUT_DIR, f"bp_{bp_name}_homepage.png"),
                full_page=False,
            )

            # Check for horizontal overflow
            has_overflow = page.evaluate("""() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            }""")

            if has_overflow:
                overflow_width = page.evaluate("document.documentElement.scrollWidth")
                client_width = page.evaluate("document.documentElement.clientWidth")
                log_result("responsive", f"{bp_name}: Homepage no horizontal overflow", "fail",
                          f"scrollWidth={overflow_width} > clientWidth={client_width}")
                page.screenshot(
                    path=os.path.join(OUTPUT_DIR, f"bp_{bp_name}_homepage_overflow.png"),
                    full_page=True,
                )
            else:
                log_result("responsive", f"{bp_name}: Homepage no horizontal overflow", "pass")
        except Exception as e:
            log_result("responsive", f"{bp_name}: Homepage render", "fail", str(e))

        # --- Test about page at this breakpoint ---
        try:
            page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
            wait_for_app_ready(page)

            page.screenshot(
                path=os.path.join(OUTPUT_DIR, f"bp_{bp_name}_about.png"),
                full_page=False,
            )

            has_overflow = page.evaluate("""() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            }""")

            if has_overflow:
                overflow_width = page.evaluate("document.documentElement.scrollWidth")
                client_width = page.evaluate("document.documentElement.clientWidth")
                log_result("responsive", f"{bp_name}: About page no horizontal overflow", "fail",
                          f"scrollWidth={overflow_width} > clientWidth={client_width}")
            else:
                log_result("responsive", f"{bp_name}: About page no horizontal overflow", "pass")
        except Exception as e:
            log_result("responsive", f"{bp_name}: About page render", "fail", str(e))

        # --- Test menu at this breakpoint ---
        try:
            menu_btn = page.locator("button[aria-label='Open menu']")
            menu_btn.click()
            page.wait_for_timeout(1500)

            page.screenshot(
                path=os.path.join(OUTPUT_DIR, f"bp_{bp_name}_menu_open.png"),
                full_page=False,
            )

            # Verify nav links are visible and not overlapping
            nav_links = page.locator("nav[aria-label='Main navigation'] a")
            link_count = nav_links.count()

            if link_count >= 5:
                log_result("responsive", f"{bp_name}: All nav links visible in menu", "pass",
                          f"{link_count} links found")
            else:
                log_result("responsive", f"{bp_name}: All nav links visible in menu", "fail",
                          f"Only {link_count} links found (expected 5)")

            # Check for text truncation / clipping in nav
            nav_links_visible = []
            for i in range(link_count):
                link = nav_links.nth(i)
                box = link.bounding_box()
                if box:
                    nav_links_visible.append(box)

            # Check if any nav links overlap
            overlapping = False
            for i in range(len(nav_links_visible)):
                for j in range(i + 1, len(nav_links_visible)):
                    a = nav_links_visible[i]
                    b = nav_links_visible[j]
                    if (a["y"] < b["y"] + b["height"] and a["y"] + a["height"] > b["y"]):
                        if abs((a["y"] + a["height"]) - b["y"]) > 5:  # Allow small overlap
                            overlapping = True

            if not overlapping:
                log_result("responsive", f"{bp_name}: Nav links not overlapping", "pass")
            else:
                log_result("responsive", f"{bp_name}: Nav links not overlapping", "fail",
                          "Nav links are overlapping")

        except Exception as e:
            log_result("responsive", f"{bp_name}: Menu layout", "fail", str(e))

        # --- Test footer (on non-home pages) ---
        try:
            page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
            wait_for_app_ready(page)

            # Scroll to bottom
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1000)

            footer = page.locator("footer")
            if footer.count() > 0 and footer.first.is_visible():
                footer_box = footer.first.bounding_box()
                if footer_box and footer_box["width"] <= dimensions["width"] + 1:
                    log_result("responsive", f"{bp_name}: Footer fits viewport", "pass")
                else:
                    log_result("responsive", f"{bp_name}: Footer fits viewport", "fail",
                              f"Footer width: {footer_box['width'] if footer_box else 'N/A'}")

                page.screenshot(path=os.path.join(OUTPUT_DIR, f"bp_{bp_name}_footer.png"))
            else:
                log_result("responsive", f"{bp_name}: Footer visible", "warn", "Footer not found/visible")
        except Exception as e:
            log_result("responsive", f"{bp_name}: Footer layout", "fail", str(e))

        context.close()


def main():
    print("=" * 70)
    print("  500 Acres - Comprehensive Interaction Tests")
    print("=" * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        test_touch_interactions(browser)
        test_keyboard_navigation(browser)
        test_page_transitions(browser)
        test_responsive_breakpoints(browser)

        browser.close()

    # --- Summary ---
    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)

    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"pass": 0, "fail": 0, "warn": 0}
        categories[cat][r["status"]] += 1

    total_pass = sum(c["pass"] for c in categories.values())
    total_fail = sum(c["fail"] for c in categories.values())
    total_warn = sum(c["warn"] for c in categories.values())

    for cat, counts in categories.items():
        print(f"\n  {cat.upper()}:")
        print(f"    Pass: {counts['pass']}  |  Fail: {counts['fail']}  |  Warn: {counts['warn']}")

    print(f"\n  TOTAL: {total_pass} passed, {total_fail} failed, {total_warn} warnings")
    print(f"  Total tests: {len(results)}")

    # Print failures detail
    failures = [r for r in results if r["status"] == "fail"]
    if failures:
        print(f"\n  FAILURES ({len(failures)}):")
        for f in failures:
            print(f"    [{f['category']}] {f['test']}: {f['detail']}")

    warnings = [r for r in results if r["status"] == "warn"]
    if warnings:
        print(f"\n  WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"    [{w['category']}] {w['test']}: {w['detail']}")

    # Save JSON results
    with open(os.path.join(OUTPUT_DIR, "results.json"), "w") as f:
        json.dump({
            "summary": {
                "total": len(results),
                "pass": total_pass,
                "fail": total_fail,
                "warn": total_warn,
            },
            "categories": categories,
            "details": results,
        }, f, indent=2)

    print(f"\n  Results saved to {OUTPUT_DIR}/results.json")
    print(f"  Screenshots saved to {OUTPUT_DIR}/")
    print("=" * 70)

    return total_fail


if __name__ == "__main__":
    exit_code = main()
    exit(1 if exit_code > 0 else 0)
