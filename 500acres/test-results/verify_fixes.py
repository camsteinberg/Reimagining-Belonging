"""Verify scroll story fixes - screenshots and console check."""
from playwright.sync_api import sync_playwright
import json, os

BASE = "http://localhost:5174"
OUT = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results"

def main():
    console_issues = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        page.on("console", lambda msg: console_issues.append(
            f"{msg.type}: {msg.text}"
        ) if msg.type in ["error", "warning"] else None)

        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(4000)

        # Dismiss hero/loading
        page.evaluate('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))')
        page.wait_for_timeout(2000)
        page.evaluate('document.body.style.overflow = ""')
        page.wait_for_timeout(500)

        # Screenshot at key scroll positions
        positions = [
            (0, "top"),
            (2000, "slide2_area"),
            (5000, "slide6_area"),
            (7000, "stats_area"),
            (9500, "mapslides"),
            (12000, "migration_map"),
            (15000, "belonging"),
        ]

        for scroll_y, name in positions:
            page.evaluate(f"window.scrollTo(0, {scroll_y})")
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(OUT, f"scroll_{name}.png"))
            print(f"Screenshot: scroll_{name}.png at y={scroll_y}")

        # Check map states at correct positions
        ms_y = page.evaluate("""() => {
            const ms = document.querySelector('.mapSlides');
            return ms ? ms.getBoundingClientRect().top + window.scrollY : null;
        }""")

        if ms_y:
            page.evaluate(f"window.scrollTo(0, {ms_y + 500})")
            page.wait_for_timeout(3000)

            r = page.evaluate("""() => {
                const ms = document.querySelector('.mapSlides');
                const im = document.getElementById('initialMap');
                return {
                    ms_visible: ms ? ms.classList.contains('is-visible') : null,
                    im_opacity: im ? getComputedStyle(im).opacity : null,
                    im_visibility: im ? getComputedStyle(im).visibility : null,
                    im_hasCanvas: im ? !!im.querySelector('canvas') : false,
                };
            }""")
            print(f"\nInitial Map state: {json.dumps(r, indent=2)}")
            page.screenshot(path=os.path.join(OUT, "map_initial.png"))

        s15_y = page.evaluate("""() => {
            const s = document.querySelector('.slide15');
            return s ? s.getBoundingClientRect().top + window.scrollY : null;
        }""")

        if s15_y:
            page.evaluate(f"window.scrollTo(0, {s15_y + 300})")
            page.wait_for_timeout(3000)

            r2 = page.evaluate("""() => {
                const s15 = document.querySelector('.slide15');
                const mw = s15 ? s15.querySelector('.mapWrap') : null;
                const m = document.getElementById('map');
                return {
                    s15_visible: s15 ? s15.classList.contains('is-visible') : null,
                    mw_opacity: mw ? getComputedStyle(mw).opacity : null,
                    map_hasCanvas: m ? !!m.querySelector('canvas') : false,
                };
            }""")
            print(f"Migration Map state: {json.dumps(r2, indent=2)}")
            page.screenshot(path=os.path.join(OUT, "map_migration.png"))

        # Test nav menu (mobile)
        page2 = browser.new_page(viewport={"width": 390, "height": 844})
        page2.goto(BASE + "/about", wait_until="networkidle", timeout=15000)
        page2.wait_for_timeout(1000)

        btn = page2.query_selector("button[aria-label='Open menu']")
        if btn:
            btn.click()
            page2.wait_for_timeout(300)
            page2.screenshot(path=os.path.join(OUT, "nav_opening.png"))
            page2.wait_for_timeout(900)
            page2.screenshot(path=os.path.join(OUT, "nav_open.png"))
            print("\nNav menu screenshots taken")

        page2.close()
        browser.close()

    # Print console issues
    print(f"\n--- Console issues ({len(console_issues)}) ---")
    for m in console_issues[:30]:
        print(f"  {m}")

    if not console_issues:
        print("  No console errors or warnings!")

if __name__ == "__main__":
    main()
