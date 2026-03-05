"""Deep diagnostic: Why maps don't show when scrolled to."""
from playwright.sync_api import sync_playwright
import json, os

BASE = "http://localhost:5174"
OUT = "/Users/camsteinberg/Reimagining-Belonging/500acres/test-results"

def main():
    with sync_playwright() as p:
        # Use headed mode to match real browser behavior
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        console_msgs = []
        page.on("console", lambda msg: console_msgs.append(f"{msg.type}: {msg.text}"))

        page.goto(BASE, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(5000)

        # Dismiss hero
        page.evaluate('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))')
        page.wait_for_timeout(3000)
        page.evaluate('document.body.style.overflow = ""')
        page.wait_for_timeout(1000)

        # Find mapSlides position
        map_info = page.evaluate("""() => {
            const mapSlides = document.querySelector('.mapSlides');
            const initialMap = document.getElementById('initialMap');
            const slide15 = document.querySelector('.slide15');
            const slide16 = document.querySelector('.slide16');
            return {
                mapSlides: mapSlides ? {
                    offsetTop: mapSlides.offsetTop,
                    scrollTop: mapSlides.getBoundingClientRect().top + window.scrollY,
                    classList: Array.from(mapSlides.classList),
                    hasInitialMap: !!mapSlides.querySelector('#initialMap'),
                } : null,
                initialMap: initialMap ? {
                    exists: true,
                    hasCanvas: !!initialMap.querySelector('canvas'),
                    style: initialMap.getAttribute('style') || '',
                    computedDisplay: getComputedStyle(initialMap).display,
                    computedVisibility: getComputedStyle(initialMap).visibility,
                    computedOpacity: getComputedStyle(initialMap).opacity,
                    computedPosition: getComputedStyle(initialMap).position,
                    computedTop: getComputedStyle(initialMap).top,
                    computedWidth: getComputedStyle(initialMap).width,
                    computedHeight: getComputedStyle(initialMap).height,
                    computedZIndex: getComputedStyle(initialMap).zIndex,
                    rect: initialMap.getBoundingClientRect(),
                } : { exists: false },
                slide15: slide15 ? {
                    offsetTop: slide15.offsetTop,
                    classList: Array.from(slide15.classList),
                } : null,
                slide16: slide16 ? {
                    offsetTop: slide16.offsetTop,
                    classList: Array.from(slide16.classList),
                } : null,
            };
        }""")
        print("=== BEFORE SCROLLING TO MAPS ===")
        print(json.dumps(map_info, indent=2, default=str))

        # Now scroll to mapSlides
        if map_info["mapSlides"]:
            scroll_to = int(map_info["mapSlides"]["scrollTop"]) - 100
            print(f"\nScrolling to y={scroll_to} (mapSlides top)")
            page.evaluate(f"window.scrollTo(0, {scroll_to})")
            page.wait_for_timeout(3000)

            # Check state AFTER scrolling
            after_scroll = page.evaluate("""() => {
                const mapSlides = document.querySelector('.mapSlides');
                const initialMap = document.getElementById('initialMap');

                // Check for CSS transform on ALL ancestors (breaks position:fixed)
                let transformAncestor = null;
                let el = initialMap;
                while (el && el !== document.documentElement) {
                    const t = getComputedStyle(el).transform;
                    if (t && t !== 'none') {
                        transformAncestor = {
                            tag: el.tagName,
                            id: el.id,
                            class: el.className.substring(0, 80),
                            transform: t,
                        };
                        break;
                    }
                    el = el.parentElement;
                }

                // Check for will-change on ancestors
                let willChangeAncestor = null;
                el = initialMap;
                while (el && el !== document.documentElement) {
                    const wc = getComputedStyle(el).willChange;
                    if (wc && wc !== 'auto') {
                        willChangeAncestor = {
                            tag: el.tagName,
                            id: el.id,
                            class: el.className.substring(0, 80),
                            willChange: wc,
                        };
                        break;
                    }
                    el = el.parentElement;
                }

                // Check for contain on ancestors
                let containAncestor = null;
                el = initialMap;
                while (el && el !== document.documentElement) {
                    const c = getComputedStyle(el).contain;
                    if (c && c !== 'none') {
                        containAncestor = {
                            tag: el.tagName,
                            id: el.id,
                            class: el.className.substring(0, 80),
                            contain: c,
                        };
                        break;
                    }
                    el = el.parentElement;
                }

                return {
                    mapSlides_isVisible: mapSlides ? mapSlides.classList.contains('is-visible') : null,
                    mapSlides_classList: mapSlides ? Array.from(mapSlides.classList) : null,
                    initialMap: initialMap ? {
                        hasCanvas: !!initialMap.querySelector('canvas'),
                        canvasCount: initialMap.querySelectorAll('canvas').length,
                        computedVisibility: getComputedStyle(initialMap).visibility,
                        computedOpacity: getComputedStyle(initialMap).opacity,
                        computedPosition: getComputedStyle(initialMap).position,
                        computedTop: getComputedStyle(initialMap).top,
                        computedLeft: getComputedStyle(initialMap).left,
                        computedWidth: getComputedStyle(initialMap).width,
                        computedHeight: getComputedStyle(initialMap).height,
                        computedZIndex: getComputedStyle(initialMap).zIndex,
                        computedDisplay: getComputedStyle(initialMap).display,
                        computedClipPath: getComputedStyle(initialMap).clipPath,
                        computedOverflow: getComputedStyle(initialMap).overflow,
                        rect: initialMap.getBoundingClientRect(),
                        style: initialMap.getAttribute('style') || '',
                        childCount: initialMap.children.length,
                        innerHTML_length: initialMap.innerHTML.length,
                    } : null,
                    transformAncestor,
                    willChangeAncestor,
                    containAncestor,
                    scrollY: window.scrollY,
                    bodyClasses: Array.from(document.body.classList),
                };
            }""")

            print("\n=== AFTER SCROLLING TO MAPS ===")
            print(json.dumps(after_scroll, indent=2, default=str))
            page.screenshot(path=os.path.join(OUT, "map_diag_at_mapslides.png"))

            # Scroll a bit more into mapSlides
            page.evaluate(f"window.scrollTo(0, {scroll_to + 500})")
            page.wait_for_timeout(3000)

            deeper = page.evaluate("""() => {
                const mapSlides = document.querySelector('.mapSlides');
                const initialMap = document.getElementById('initialMap');
                return {
                    mapSlides_isVisible: mapSlides ? mapSlides.classList.contains('is-visible') : null,
                    initialMap_opacity: initialMap ? getComputedStyle(initialMap).opacity : null,
                    initialMap_visibility: initialMap ? getComputedStyle(initialMap).visibility : null,
                    initialMap_rect: initialMap ? initialMap.getBoundingClientRect() : null,
                    initialMap_hasCanvas: initialMap ? !!initialMap.querySelector('canvas') : null,
                    scrollY: window.scrollY,
                };
            }""")
            print("\n=== 500px DEEPER INTO MAPSLIDES ===")
            print(json.dumps(deeper, indent=2, default=str))
            page.screenshot(path=os.path.join(OUT, "map_diag_deeper.png"))

        # Now check slide15 migration map
        if map_info["slide15"]:
            s15_top = int(map_info["slide15"]["offsetTop"])
            print(f"\nScrolling to y={s15_top} (slide15 top)")
            page.evaluate(f"window.scrollTo(0, {s15_top})")
            page.wait_for_timeout(3000)

            s15_state = page.evaluate("""() => {
                const s15 = document.querySelector('.slide15');
                const mapWrap = s15 ? s15.querySelector('.mapWrap') : null;
                const mapEl = document.getElementById('map');

                // Check transform ancestors for slide15 mapWrap
                let transformAnc = null;
                let el = mapWrap;
                while (el && el !== document.documentElement) {
                    const t = getComputedStyle(el).transform;
                    if (t && t !== 'none') {
                        transformAnc = { tag: el.tagName, id: el.id, class: el.className.substring(0, 80), transform: t };
                        break;
                    }
                    el = el.parentElement;
                }

                return {
                    slide15_isVisible: s15 ? s15.classList.contains('is-visible') : null,
                    mapWrap: mapWrap ? {
                        computedOpacity: getComputedStyle(mapWrap).opacity,
                        computedVisibility: getComputedStyle(mapWrap).visibility,
                        computedPosition: getComputedStyle(mapWrap).position,
                        rect: mapWrap.getBoundingClientRect(),
                    } : null,
                    map: mapEl ? {
                        hasCanvas: !!mapEl.querySelector('canvas'),
                        rect: mapEl.getBoundingClientRect(),
                    } : null,
                    transformAncestor: transformAnc,
                    scrollY: window.scrollY,
                };
            }""")
            print("\n=== AT SLIDE15 (MIGRATION MAP) ===")
            print(json.dumps(s15_state, indent=2, default=str))
            page.screenshot(path=os.path.join(OUT, "map_diag_slide15.png"))

        # Check PageTransition for transforms
        pt_state = page.evaluate("""() => {
            const main = document.getElementById('main-content');
            const pt = main ? main.firstElementChild : null;
            return {
                main: main ? {
                    computedTransform: getComputedStyle(main).transform,
                    computedWillChange: getComputedStyle(main).willChange,
                    computedContain: getComputedStyle(main).contain,
                    style: main.getAttribute('style') || '',
                } : null,
                pageTransition: pt ? {
                    tag: pt.tagName,
                    class: pt.className.substring(0, 100),
                    computedTransform: getComputedStyle(pt).transform,
                    computedWillChange: getComputedStyle(pt).willChange,
                    style: pt.getAttribute('style') || '',
                } : null,
            };
        }""")
        print("\n=== PAGE TRANSITION / MAIN STATE ===")
        print(json.dumps(pt_state, indent=2, default=str))

        # Print console messages
        print(f"\n=== CONSOLE ({len(console_msgs)} messages) ===")
        for m in console_msgs[:30]:
            print(f"  {m}")

        browser.close()

if __name__ == "__main__":
    main()
