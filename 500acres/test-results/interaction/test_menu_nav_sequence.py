"""
Reproduce the sequential menu navigation failure.
The original test started on homepage, then tried to navigate through all routes via menu.
"""

import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5174"
OUTPUT_DIR = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results/interaction"


def wait_for_app_ready(page, timeout=15000):
    try:
        page.wait_for_selector("#main-content", timeout=timeout)
        page.wait_for_timeout(1500)
    except Exception:
        pass


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        # Start on homepage
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
        wait_for_app_ready(page)
        page.wait_for_timeout(2000)

        print("Starting sequential menu navigation from homepage...")

        routes_to_visit = ["/about", "/stories", "/resources", "/get-involved"]
        link_text_map = {
            "/about": "About",
            "/stories": "Stories",
            "/resources": "Resources",
            "/get-involved": "Get Involved",
        }

        for route in routes_to_visit:
            link_text = link_text_map[route]
            print(f"\n--- Navigating to {route} ---")

            # Check what's intercepting at the center of the screen
            intercept_check = page.evaluate("""() => {
                const els = document.elementsFromPoint(640, 450);
                return els.slice(0, 5).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    cls: (el.className || '').toString().substring(0, 80),
                    pointerEvents: window.getComputedStyle(el).pointerEvents,
                    zIndex: window.getComputedStyle(el).zIndex,
                }));
            }""")
            print(f"  Elements at center before menu open: {intercept_check}")

            # Open menu using force:true to bypass interception
            menu_btn = page.locator("button[aria-label='Open menu'], button[aria-label='Close menu']")
            try:
                menu_btn.click(force=True)
            except Exception as e:
                print(f"  Menu button click failed: {e}")
                # Try via JS
                page.evaluate("""() => {
                    const btn = document.querySelector('button[aria-label="Open menu"]') ||
                                document.querySelector('button[aria-label="Close menu"]');
                    if (btn) btn.click();
                }""")

            page.wait_for_timeout(1500)

            # Check menu overlay state
            overlay_state = page.evaluate("""() => {
                const overlay = document.querySelector('.fixed.inset-0.bg-charcoal');
                if (!overlay) return 'no overlay';
                const cp = window.getComputedStyle(overlay).clipPath || overlay.style.clipPath;
                return cp;
            }""")
            print(f"  Menu overlay clipPath: {overlay_state}")

            # Click nav link using force:true
            nav_link = page.locator(f"nav[aria-label='Main navigation'] a:has-text('{link_text}')")
            try:
                nav_link.click(force=True)
            except Exception as e:
                print(f"  Nav link click failed: {e}")
                page.evaluate(f"""() => {{
                    const links = document.querySelectorAll('nav[aria-label="Main navigation"] a');
                    for (const link of links) {{
                        if (link.textContent.includes('{link_text}')) {{
                            link.click();
                            break;
                        }}
                    }}
                }}""")

            page.wait_for_timeout(2500)
            print(f"  Current URL: {page.url}")

            if route in page.url:
                print(f"  SUCCESS: navigated to {route}")
            else:
                print(f"  FAILED: expected {route} in URL")

        # Also test the actual z-index layering
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
        wait_for_app_ready(page)

        print("\n\n--- Checking z-index layering on homepage ---")
        z_info = page.evaluate("""() => {
            const hero = document.querySelector('.fixed.inset-0');  // HeroLanding
            const overlay = document.querySelector('.fixed.inset-0.bg-charcoal');  // Nav overlay
            const menuBtn = document.querySelector('button[aria-label="Open menu"]');
            return {
                hero: hero ? {
                    zIndex: hero.style.zIndex || window.getComputedStyle(hero).zIndex,
                    pointerEvents: hero.style.pointerEvents || window.getComputedStyle(hero).pointerEvents,
                } : null,
                navOverlay: overlay ? {
                    zIndex: window.getComputedStyle(overlay).zIndex,
                    clipPath: overlay.style.clipPath,
                    ariaHidden: overlay.getAttribute('aria-hidden'),
                    inert: overlay.hasAttribute('inert'),
                } : null,
                menuBtn: menuBtn ? {
                    zIndex: window.getComputedStyle(menuBtn).zIndex,
                } : null,
            };
        }""")

        import json
        print(json.dumps(z_info, indent=2))

        context.close()
        browser.close()


if __name__ == "__main__":
    main()
