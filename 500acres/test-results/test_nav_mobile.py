"""Test maps after navigation back and on mobile viewport."""
from playwright.sync_api import sync_playwright
import json

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Test 1: Navigate away and back
        print("=== Test 1: Navigate away and back ===")
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(4000)
        page.evaluate("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))")
        page.wait_for_timeout(1500)

        # Navigate to about page
        page.goto("http://localhost:5173/about", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1000)

        # Navigate back
        page.goto("http://localhost:5173/", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(4000)
        page.evaluate("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))")
        page.wait_for_timeout(1500)
        page.evaluate("document.body.style.overflow = ''")
        page.wait_for_timeout(500)

        # Check PageTransition wrapper
        pt = page.evaluate("""() => {
            const main = document.querySelector('main#main-content');
            if (!main) return {error: 'no main'};
            const ptWrapper = main.firstElementChild;
            if (!ptWrapper) return {error: 'no pt wrapper'};
            const cs = getComputedStyle(ptWrapper);
            return {
                transform: cs.transform,
                opacity: cs.opacity,
                style_attr: ptWrapper.getAttribute('style') || '',
            };
        }""")
        print(f"PageTransition after nav back: {json.dumps(pt, indent=2)}")

        # Scroll to mapSlides
        ms_top = page.evaluate("""() => {
            const ms = document.querySelector('.mapSlides');
            return ms ? ms.getBoundingClientRect().top + window.scrollY : null;
        }""")
        if ms_top:
            page.evaluate(f"window.scrollTo(0, {ms_top + 900})")
            page.wait_for_timeout(3000)

        r = page.evaluate("""() => {
            const ms = document.querySelector('.mapSlides');
            const im = document.getElementById('initialMap');
            const main = document.querySelector('main#main-content');
            const pt = main ? main.firstElementChild : null;
            return {
                ms_isVisible: ms ? ms.classList.contains('is-visible') : null,
                im_opacity: im ? getComputedStyle(im).opacity : null,
                im_visibility: im ? getComputedStyle(im).visibility : null,
                im_hasCanvas: im ? im.querySelector('canvas') !== null : false,
                ptTransform: pt ? getComputedStyle(pt).transform : null,
            };
        }""")
        print(f"After nav back + scroll: {json.dumps(r, indent=2)}")
        page.screenshot(path="test-results/after_nav_back.png")
        page.close()

        # Test 2: Mobile viewport
        print("\n=== Test 2: Mobile viewport ===")
        page2 = browser.new_page(viewport={"width": 375, "height": 812})
        page2.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
        page2.wait_for_timeout(4000)
        page2.evaluate("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))")
        page2.wait_for_timeout(1500)
        page2.evaluate("document.body.style.overflow = ''")
        page2.wait_for_timeout(500)

        ms_top2 = page2.evaluate("""() => {
            const ms = document.querySelector('.mapSlides');
            return ms ? ms.getBoundingClientRect().top + window.scrollY : null;
        }""")
        if ms_top2:
            page2.evaluate(f"window.scrollTo(0, {ms_top2 + 600})")
            page2.wait_for_timeout(3000)

        r2 = page2.evaluate("""() => {
            const ms = document.querySelector('.mapSlides');
            const im = document.getElementById('initialMap');
            return {
                ms_isVisible: ms ? ms.classList.contains('is-visible') : null,
                im_exists: !!im,
                im_opacity: im ? getComputedStyle(im).opacity : null,
                im_visibility: im ? getComputedStyle(im).visibility : null,
                im_hasCanvas: im ? im.querySelector('canvas') !== null : false,
                im_w: im ? im.getBoundingClientRect().width : null,
                im_h: im ? im.getBoundingClientRect().height : null,
            };
        }""")
        print(f"Mobile mapSlides: {json.dumps(r2, indent=2)}")
        page2.screenshot(path="test-results/mobile_mapslides.png")

        s15_top2 = page2.evaluate("""() => {
            const s = document.querySelector('.slide15');
            return s ? s.getBoundingClientRect().top + window.scrollY : null;
        }""")
        if s15_top2:
            page2.evaluate(f"window.scrollTo(0, {s15_top2 + 200})")
            page2.wait_for_timeout(3000)

        r3 = page2.evaluate("""() => {
            const s15 = document.querySelector('.slide15');
            const mw = s15 ? s15.querySelector('.mapWrap') : null;
            const m = document.getElementById('map');
            return {
                s15_isVisible: s15 ? s15.classList.contains('is-visible') : null,
                mw_opacity: mw ? getComputedStyle(mw).opacity : null,
                mw_visibility: mw ? getComputedStyle(mw).visibility : null,
                map_hasCanvas: m ? m.querySelector('canvas') !== null : false,
            };
        }""")
        print(f"Mobile slide15: {json.dumps(r3, indent=2)}")
        page2.screenshot(path="test-results/mobile_slide15.png")
        page2.close()

        browser.close()

if __name__ == "__main__":
    main()
