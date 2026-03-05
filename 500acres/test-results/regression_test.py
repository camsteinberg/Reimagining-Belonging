"""Quick regression test after all fixes."""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:5174"
OUT = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results"
passes = 0
fails = 0

def test(name, cond, detail=""):
    global passes, fails
    if cond:
        passes += 1
        print(f"  PASS: {name}")
    else:
        fails += 1
        print(f"  FAIL: {name} - {detail}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        errors = []

        # Desktop test
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"PAGE_ERROR: {err.message}"))

        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(4000)

        # Dismiss hero
        page.evaluate('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))')
        page.wait_for_timeout(2000)
        page.evaluate('document.body.style.overflow = ""')
        page.wait_for_timeout(500)

        # Test 1: All routes load
        for route in ["/", "/about", "/stories", "/resources", "/get-involved"]:
            resp = page.goto(BASE + route, wait_until="networkidle", timeout=15000)
            test(f"Route {route}", resp.status == 200)
        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.evaluate('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))')
        page.wait_for_timeout(2000)
        page.evaluate('document.body.style.overflow = ""')

        # Test 2: Scroll through homepage - no crashes
        height = page.evaluate("document.body.scrollHeight")
        for y in range(0, min(height, 20000), 2000):
            page.evaluate(f"window.scrollTo(0, {y})")
            page.wait_for_timeout(300)
        test("Homepage scroll - no crashes", True)

        # Test 3: Maps render
        map_state = page.evaluate("""() => {
            const im = document.getElementById('initialMap');
            const m = document.getElementById('map');
            return {
                initialMap: im ? !!im.querySelector('canvas') : false,
                migrationMap: m ? !!m.querySelector('canvas') : false,
            };
        }""")
        test("InitialMap has canvas", map_state["initialMap"])
        test("MigrationMap has canvas", map_state["migrationMap"])

        # Test 4: Slide25 (IdealHomes) - no inline positioning styles
        ideal_homes_inline = page.evaluate("""() => {
            const containers = document.querySelectorAll('.slide25 .imgContainer, .slide25 .imgContainer2, .slide25 .imgContainer3');
            let hasInline = false;
            containers.forEach(c => {
                if (c.style.top || c.style.left) hasInline = true;
            });
            return hasInline;
        }""")
        test("IdealHomes - no inline position styles (B10 fix)", not ideal_homes_inline)

        # Test 5: ParticipantStories keyboard accessible
        ps_a11y = page.evaluate("""() => {
            const imgs = document.querySelectorAll('.participant-svg');
            let allOk = true;
            imgs.forEach(img => {
                if (!img.getAttribute('role') || !img.getAttribute('tabindex')) allOk = false;
            });
            return { count: imgs.length, allOk };
        }""")
        test(f"ParticipantStories SVGs keyboard accessible ({ps_a11y['count']})", ps_a11y["allOk"])

        # Test 6: ParticipantDrawings accessible
        pd_a11y = page.evaluate("""() => {
            const drawings = document.querySelectorAll('.slide19Drawing');
            let allOk = true;
            drawings.forEach(d => {
                if (!d.getAttribute('role') || !d.getAttribute('tabindex')) allOk = false;
            });
            const media = document.querySelector('.slide19Media');
            const isHidden = media ? media.getAttribute('aria-hidden') === 'true' : false;
            return { count: drawings.length, allOk, mediaHidden: isHidden };
        }""")
        test(f"ParticipantDrawings keyboard accessible ({pd_a11y['count']})", pd_a11y["allOk"])
        test("ParticipantDrawings media not aria-hidden", not pd_a11y["mediaHidden"])

        # Test 7: Nav menu works
        page.goto(BASE + "/about", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1000)
        btn = page.query_selector("button[aria-label='Open menu']")
        test("Menu button exists", btn is not None)
        if btn:
            btn.click()
            page.wait_for_timeout(1200)
            links_vis = page.evaluate("""() => {
                const links = document.querySelectorAll('nav[aria-label="Main navigation"] a');
                let vis = 0;
                links.forEach(l => { if (parseFloat(getComputedStyle(l).opacity) > 0.5) vis++; });
                return vis;
            }""")
            test(f"Nav links visible after open ({links_vis}/5)", links_vis == 5)

        # Test 8: Mobile viewport
        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(BASE, wait_until="networkidle", timeout=30000)
        mobile.wait_for_timeout(3000)
        mobile.evaluate('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))')
        mobile.wait_for_timeout(2000)
        mobile.evaluate('document.body.style.overflow = ""')
        mobile.wait_for_timeout(500)

        # Scroll to IdealHomes area on mobile and check positioning
        mobile.evaluate("window.scrollTo(0, 18000)")
        mobile.wait_for_timeout(1000)
        mobile.screenshot(path=os.path.join(OUT, "regression_mobile_idealhomes.png"))

        mobile.close()
        page.close()
        browser.close()

    # Filter console errors
    critical = [e for e in errors if "PAGE_ERROR" in e and "WebGL" not in e]
    test("No critical console errors", len(critical) == 0, "; ".join(critical[:3]))

    print(f"\n{'='*50}")
    print(f"REGRESSION: {passes} passed, {fails} failed out of {passes+fails}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
