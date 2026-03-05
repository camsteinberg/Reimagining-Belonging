"""
Focused diagnostic tests for the two failures:
1. Mobile scroll not working after navigation back to homepage
2. Nav menu click intercepted by absolute inset-0 div (PageTransition)
"""

import os
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5174"
OUTPUT_DIR = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results/interaction"


def wait_for_app_ready(page, timeout=15000):
    try:
        page.wait_for_selector("#main-content", timeout=timeout)
        page.wait_for_timeout(1500)
    except Exception:
        pass


def diagnose_scroll_after_nav(browser):
    """Diagnose why scrolling breaks on mobile after navigating back to homepage."""
    print("\n=== DIAGNOSTIC: Scroll after nav on mobile ===")

    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        has_touch=True,
        is_mobile=True,
    )
    page = context.new_page()

    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
    wait_for_app_ready(page)

    # Dismiss hero by scrolling
    page.evaluate("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))")
    page.wait_for_timeout(2000)

    # Check hero state
    hero_pointer = page.evaluate("""() => {
        const hero = document.querySelector('.fixed.inset-0');
        if (!hero) return 'no hero found';
        return window.getComputedStyle(hero).pointerEvents;
    }""")
    print(f"  Hero pointer-events after dismiss: {hero_pointer}")

    # Scroll down
    for _ in range(5):
        page.evaluate("window.scrollBy(0, 600)")
        page.wait_for_timeout(300)

    scroll_before_nav = page.evaluate("window.scrollY")
    print(f"  Scroll position before nav: {scroll_before_nav}")

    body_overflow_before = page.evaluate("document.body.style.overflow")
    print(f"  Body overflow before nav: '{body_overflow_before}'")

    # Navigate via menu
    menu_btn = page.locator("button[aria-label='Open menu']")
    menu_btn.tap()
    page.wait_for_timeout(1200)

    about_link = page.locator("nav[aria-label='Main navigation'] a:has-text('About')")
    about_link.tap()
    page.wait_for_timeout(2500)

    print(f"  URL after nav: {page.url}")

    # Now navigate back to homepage via menu
    menu_btn2 = page.locator("button[aria-label='Open menu']")
    menu_btn2.tap()
    page.wait_for_timeout(1200)

    home_link = page.locator("nav[aria-label='Main navigation'] a:has-text('Home')")
    home_link.tap()
    page.wait_for_timeout(3000)

    print(f"  URL after back: {page.url}")

    # Check state after returning
    body_overflow_after = page.evaluate("document.body.style.overflow")
    hero_show = page.evaluate("""() => {
        const hero = document.querySelector('.fixed.inset-0');
        if (!hero) return { exists: false };
        return {
            exists: true,
            pointerEvents: hero.style.pointerEvents || window.getComputedStyle(hero).pointerEvents,
            zIndex: hero.style.zIndex || window.getComputedStyle(hero).zIndex,
            visibility: window.getComputedStyle(hero).visibility,
            display: window.getComputedStyle(hero).display,
        };
    }""")
    print(f"  Body overflow after return: '{body_overflow_after}'")
    print(f"  Hero state after return: {json.dumps(hero_show, indent=2)}")

    # The hero likely re-shows (show=true) which locks body scroll
    # Try to scroll
    initial_scroll = page.evaluate("window.scrollY")
    page.evaluate("window.scrollBy(0, 600)")
    page.wait_for_timeout(500)
    after_scroll = page.evaluate("window.scrollY")
    print(f"  Initial scrollY: {initial_scroll}")
    print(f"  After scrollBy(0,600): {after_scroll}")

    if body_overflow_after == "hidden":
        print("\n  ROOT CAUSE: body.style.overflow is 'hidden' after returning to homepage")
        print("  This is because HeroLanding.show=true locks body scroll (line 119 of HeroLanding.jsx)")
        print("  The hero re-appears when navigating back to homepage, blocking scroll")
        print("  SEVERITY: Medium - User must interact to dismiss hero again to scroll")

    # Dismiss hero again
    page.evaluate("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))")
    page.wait_for_timeout(1500)

    body_after_dismiss = page.evaluate("document.body.style.overflow")
    page.evaluate("window.scrollBy(0, 600)")
    page.wait_for_timeout(500)
    final_scroll = page.evaluate("window.scrollY")
    print(f"\n  After dismissing hero again:")
    print(f"  Body overflow: '{body_after_dismiss}'")
    print(f"  ScrollY after scrollBy: {final_scroll}")

    if final_scroll > 0:
        print("  CONFIRMED: Scroll works after re-dismissing hero")
        print("  CONCLUSION: This is expected behavior - hero re-shows on homepage return")
    else:
        print("  WARNING: Scroll still broken even after hero dismiss")

    page.screenshot(path=os.path.join(OUTPUT_DIR, "diag_scroll_after_nav.png"))
    context.close()


def diagnose_menu_click_interception(browser):
    """Diagnose the 'absolute inset-0 div intercepts pointer events' issue."""
    print("\n=== DIAGNOSTIC: Menu click intercepted by absolute inset-0 div ===")

    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = context.new_page()

    # Navigate to /about first (non-homepage to avoid hero)
    page.goto(BASE_URL + "/about", wait_until="domcontentloaded", timeout=15000)
    wait_for_app_ready(page)

    # Open menu
    menu_btn = page.locator("button[aria-label='Open menu']")
    menu_btn.click()
    page.wait_for_timeout(1500)

    # Click on a nav link (Stories)
    stories_link = page.locator("nav[aria-label='Main navigation'] a:has-text('Stories')")
    stories_link.click()
    page.wait_for_timeout(2500)

    print(f"  URL after clicking Stories: {page.url}")

    # Now try to open menu again - this is where the issue happens
    menu_btn2 = page.locator("button[aria-label='Open menu'], button[aria-label='Close menu']")
    menu_btn2.click()
    page.wait_for_timeout(1500)

    # Check what divs are overlapping
    overlay_info = page.evaluate("""() => {
        const nav = document.querySelector('nav[aria-label="Main navigation"]');
        if (!nav) return { nav_found: false };

        const aboutLink = document.querySelector('nav[aria-label="Main navigation"] a[href="/about"]');
        if (!aboutLink) return { nav_found: true, link_found: false };

        const rect = aboutLink.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const elements = document.elementsFromPoint(cx, cy);
        return {
            nav_found: true,
            link_found: true,
            link_rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
            elements_at_point: elements.map(el => ({
                tag: el.tagName,
                id: el.id,
                className: (el.className || '').toString().substring(0, 80),
                pointerEvents: window.getComputedStyle(el).pointerEvents,
                zIndex: window.getComputedStyle(el).zIndex,
                position: window.getComputedStyle(el).position,
            })).slice(0, 10),
        };
    }""")

    print(f"  Overlay diagnostic: {json.dumps(overlay_info, indent=2)}")

    # Try using dispatchEvent instead of Playwright click
    try:
        page.evaluate("""() => {
            const link = document.querySelector('nav[aria-label="Main navigation"] a[href="/about"]');
            if (link) link.click();
        }""")
        page.wait_for_timeout(2500)
        print(f"  URL after JS click on About: {page.url}")
    except Exception as e:
        print(f"  JS click failed: {e}")

    # Check the PageTransition div
    pt_info = page.evaluate("""() => {
        const main = document.querySelector('#main-content');
        if (!main) return { main: false };

        const children = Array.from(main.children);
        return {
            main: true,
            children: children.map(c => ({
                tag: c.tagName,
                className: (c.className || '').toString().substring(0, 100),
                position: window.getComputedStyle(c).position,
                inset: window.getComputedStyle(c).inset,
                pointerEvents: window.getComputedStyle(c).pointerEvents,
                zIndex: window.getComputedStyle(c).zIndex,
            }))
        };
    }""")
    print(f"\n  PageTransition/main children: {json.dumps(pt_info, indent=2)}")

    page.screenshot(path=os.path.join(OUTPUT_DIR, "diag_click_interception.png"))
    context.close()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        diagnose_scroll_after_nav(browser)
        diagnose_menu_click_interception(browser)
        browser.close()


if __name__ == "__main__":
    main()
