# About Us Dropdown & Team Page Implementation Plan

> **Status:** IMPLEMENTED | Completed 2026-02-27

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the "About" nav item into an expandable dropdown with "Our Mission" and "Our Team" sub-links, creating a new team page with employee data from the spreadsheet.

**Architecture:** Split the current monolithic About page into two routes (`/about/mission` and `/about/team`). Modify the fullscreen Navbar to support expandable menu items with GSAP-animated sub-links. Redirect the old `/about` route for backward compatibility.

**Tech Stack:** React 19, React Router 7, GSAP 3.14, Tailwind CSS 4

---

### Task 1: Create OurMissionPage.jsx (copy current About content, remove team section)

**Files:**
- Create: `src/pages/OurMissionPage.jsx`
- Reference: `src/pages/AboutPage.jsx` (current content to copy)

**Step 1: Create OurMissionPage.jsx**

Copy `src/pages/AboutPage.jsx` to `src/pages/OurMissionPage.jsx`. Then:
1. Rename the export from `AboutPage` to `OurMissionPage`
2. Remove the entire Team Section (lines 259-357 of AboutPage.jsx — from `{/* Team Section */}` through the Contributors closing `</div></section>`)
3. Remove the divider just before the team section (lines 254-258)
4. Keep everything else: hero, mission, values, pull quote, timeline, origin, newsletter, CTA

The resulting file should have these sections in order:
- Hero ("Turning empty land into real homes")
- Divider
- Mission (asymmetric two-column editorial)
- Values (4-column card grid)
- Pull quote (charcoal diagonal)
- Vision Timeline (2024 → 2026 → Beyond)
- Divider
- Origin story ("From Research to Reality")
- Newsletter signup
- CTA band ("Ready to build?")

**Step 2: Verify file created**

Run: `ls -la src/pages/OurMissionPage.jsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/pages/OurMissionPage.jsx
git commit -m "feat: create OurMissionPage from existing About content (minus team section)"
```

---

### Task 2: Create OurTeamPage.jsx with employee data

**Files:**
- Create: `src/pages/OurTeamPage.jsx`

**Step 1: Create the team page**

Create `src/pages/OurTeamPage.jsx` with this structure:

```jsx
import useReveal from "../hooks/useReveal";

const TEAM_MEMBERS = [
  { name: "Michelle Crosby", role: "CEO" },
  { name: "John Seidl", role: "Chairman" },
  { name: "Mikey Thomas", role: "Superintendent" },
  { name: "Fengming Mo", role: "Financial Analyst" },
  { name: "Aiden Miller", role: "AI & Data Strategy Fellow" },
  { name: "Cole Kreilig", role: "Machine Learning & Systems Fellow" },
  { name: "Cam Steinberg", role: "Project Manager" },
  { name: "Rocio Loberza", role: "Architectural Designer" },
];

const FELLOWS = [
  { name: "Yuchun Zhang", role: "Urban Design Intern" },
  { name: "Lex", role: "Artist in Residence" },
  { name: "Kyle & Antonio", role: "Artists in Residence" },
];

const CONSULTANTS = [
  { name: "Roy Nelson", role: "Tax Consultant" },
  { name: "Melanie Birch", role: "Book Keeper" },
  { name: "Araman Kakar", role: "Financial Controller" },
  { name: "Spozami Kakar", role: "Board Secretary / Accounts Manager" },
];
```

**Page layout pattern** (match existing site editorial style from AboutPage.jsx):

1. **Hero section** — `min-h-[60vh]` with decorative blobs, title "The people behind 500 Acres", subtitle. Uses `reveal-up` animations. Same pattern as AboutPage hero (lines 22-53) but shorter.

2. **Team Section** — header "Our Team" with `reveal-up` animation, then a 3-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16`). Each card uses the exact same pattern as the current AboutPage team cards (lines 313-336):
   - Circular placeholder div (w-40 h-40, `bg-charcoal/5`, initials centered)
   - Colored accent dot (absolute positioned, bottom-right)
   - Name in `font-serif text-xl font-bold text-charcoal`
   - Role in `font-sans text-xs uppercase tracking-[0.3em] text-charcoal/60`
   - **NO bios** — just name and role
   - Cycle accent colors through: `bg-forest`, `bg-sage`, `bg-amber`, `bg-bark`, `bg-clay`, `bg-moss`, `bg-ember`, `bg-forest` (repeat)

3. **Fellows Section** — Same card grid, preceded by label "Fellows" in small caps.

4. **Consultants Section** — Same card grid, preceded by label "Consultants & Advisors" in small caps.

5. **CTA band** — Same moss-green CTA from AboutPage (lines 452-470): "Ready to build?" with "Get Involved" link.

**Step 2: Verify file created**

Run: `ls -la src/pages/OurTeamPage.jsx`
Expected: File exists

**Step 3: Commit**

```bash
git add src/pages/OurTeamPage.jsx
git commit -m "feat: create OurTeamPage with employee data and placeholder images"
```

---

### Task 3: Update App.jsx routes

**Files:**
- Modify: `src/App.jsx:14,52`

**Step 1: Update lazy imports (line 14)**

Replace:
```jsx
const AboutPage = lazy(() => import("./pages/AboutPage"));
```

With:
```jsx
const OurMissionPage = lazy(() => import("./pages/OurMissionPage"));
const OurTeamPage = lazy(() => import("./pages/OurTeamPage"));
```

**Step 2: Update routes (line 52)**

Replace:
```jsx
<Route path="/about" element={<AboutPage />} />
```

With:
```jsx
<Route path="/about" element={<Navigate to="/about/mission" replace />} />
<Route path="/about/mission" element={<OurMissionPage />} />
<Route path="/about/team" element={<OurTeamPage />} />
```

Also add `Navigate` to the import from react-router-dom (line 2):
```jsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
```

**Step 3: Verify the app builds**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: update routes for /about/mission and /about/team"
```

---

### Task 4: Update Navbar with expandable "About" sub-links

**Files:**
- Modify: `src/components/layout/Navbar.jsx:6-12,243-263`

**Step 1: Restructure NAV_LINKS (lines 6-12)**

Replace the current `NAV_LINKS` array with:

```jsx
const NAV_LINKS = [
  { to: "/", label: "Home", num: "01" },
  {
    label: "About",
    num: "02",
    children: [
      { to: "/about/mission", label: "Our Mission" },
      { to: "/about/team", label: "Our Team" },
    ],
  },
  { to: "/stories", label: "Stories", num: "03" },
  { to: "/resources", label: "Resources", num: "04" },
  { to: "/get-involved", label: "Get Involved", num: "05" },
];
```

**Step 2: Add expandedItem state**

Inside the `Navbar` component, after the existing `useState` calls (around line 15-16), add:

```jsx
const [expandedItem, setExpandedItem] = useState(null);
```

Also add `useRef` for sub-link elements:

```jsx
const subLinksRef = useRef([]);
```

**Step 3: Reset expandedItem when menu closes**

In the `useEffect` that handles `isOpen` (lines 26-30), when menu closes also reset expandedItem:

```jsx
useEffect(() => {
  if (!navigatingRef.current) {
    setIsOpen(false);
    setExpandedItem(null);
  }
}, [location]);
```

Also reset in the `isOpen` effect body scroll (or add a separate effect):
When `isOpen` becomes false, reset `setExpandedItem(null)`.

**Step 4: Rewrite the nav link rendering (lines 243-263)**

Replace the current `NAV_LINKS.map` block with logic that handles both regular links and expandable items:

For each link in `NAV_LINKS`:
- If `link.children` exists: render a `<button>` (not a `<Link>`) that toggles `expandedItem`. When expanded, render the children below it as indented `<Link>` elements with GSAP animation.
- If `link.to` exists: render the existing `<Link>` as before.

**Sub-link styling:**
- Indented: `pl-12 md:pl-16` (left padding to nest under parent)
- Smaller font: `text-3xl md:text-5xl lg:text-6xl` (vs parent's `text-5xl md:text-7xl lg:text-8xl`)
- Same color scheme: `text-cream hover:text-forest`
- Active state: check if `location.pathname` matches the sub-link's `to`

**Sub-link GSAP animation:**
When `expandedItem` changes, animate sub-links in/out:
- Expand: `gsap.fromTo(subLinks, { opacity: 0, y: 30, height: 0 }, { opacity: 1, y: 0, height: "auto", stagger: 0.06, duration: 0.4, ease: "power3.out" })`
- Collapse: `gsap.to(subLinks, { opacity: 0, y: -20, height: 0, duration: 0.3, ease: "power2.in" })`

**Important:** The parent "About" button needs a small chevron/arrow indicator showing it's expandable. Use a simple SVG chevron that rotates 180deg when expanded:

```jsx
<svg className={`w-4 h-4 ml-3 transition-transform duration-300 ${expandedItem === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
```

**Step 5: Update linksRef handling**

The `linksRef` array needs to account for both parent items AND sub-links. The simplest approach: keep `linksRef` for the top-level items (including the About button), and use `subLinksRef` for the sub-links. Both need to be included in the initial GSAP animation that shows links when the menu opens (lines 94-122).

Update the GSAP menu open animation to also set sub-links to hidden initially:
```jsx
gsap.set(subLinksRef.current.filter(Boolean), { opacity: 0, y: 30 });
```

**Step 6: Update the active-page detection for "About" parent**

The parent "About" button should show active styling (text-forest) if the current path starts with `/about`:

```jsx
const isAboutActive = location.pathname.startsWith("/about");
```

**Step 7: Verify the app builds and the menu works**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/components/layout/Navbar.jsx
git commit -m "feat: expandable About sub-links in fullscreen nav menu"
```

---

### Task 5: Update Footer link

**Files:**
- Modify: `src/components/layout/Footer.jsx:6`

**Step 1: Update FOOTER_LINKS**

Change line 6 from:
```jsx
{ to: "/about", label: "About" },
```
To:
```jsx
{ to: "/about/mission", label: "About" },
```

**Step 2: Commit**

```bash
git add src/components/layout/Footer.jsx
git commit -m "feat: update footer About link to /about/mission"
```

---

### Task 6: Delete old AboutPage.jsx and verify everything works

**Files:**
- Delete: `src/pages/AboutPage.jsx`

**Step 1: Delete old file**

```bash
rm src/pages/AboutPage.jsx
```

**Step 2: Verify build succeeds**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build`
Expected: Build succeeds with no errors. No remaining imports of `AboutPage`.

**Step 3: Verify no dangling references**

Search for any remaining references to `AboutPage`:
```bash
grep -r "AboutPage" src/
```
Expected: No results

**Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove old AboutPage.jsx (replaced by OurMissionPage + OurTeamPage)"
```

---

### Task 7: Manual QA verification

**Step 1: Start dev server**

Run: `cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run dev`

**Step 2: Verify these behaviors**

1. Open the fullscreen menu → "About" shows with a chevron indicator
2. Click "About" → sub-links "Our Mission" and "Our Team" expand below with animation
3. Click "Our Mission" → navigates to `/about/mission`, shows all original About content (minus team section)
4. Click "Our Team" → navigates to `/about/team`, shows team grid with placeholder photos, names, titles in 3 sections
5. Visit `/about` directly → redirects to `/about/mission`
6. Footer "About" link → goes to `/about/mission`
7. "About" parent text shows active color (forest) when on either `/about/mission` or `/about/team`
8. Sub-links show active color for their specific page
9. Mobile responsive: menu works on small screens, team grid collapses to 1 column
