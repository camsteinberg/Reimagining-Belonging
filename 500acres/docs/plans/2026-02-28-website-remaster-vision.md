# 500 Acres Website Remaster — Comprehensive Vision Document

> Synthesized from 5 parallel expert audits: Visual Design System, UX Flows & Navigation, Homepage Experience, Inner Pages Quality, and Performance & Polish.

**Date:** February 28, 2026
**Scope:** Full-site UI/UX remaster building on existing foundation

---

## Executive Summary

The 500 Acres website has a **strong foundation** — cohesive campfire color palette, quality editorial photography, sophisticated animations (custom cursor, reveal system, GSAP scroll-driven homepage), and clear brand identity. However, five expert audits identified recurring themes that prevent the site from reaching its full potential:

1. **Formulaic layouts** — Every inner page follows the same hero → grid → CTA template, creating visual monotony
2. **Navigation friction** — Key content is buried behind dropdowns; no persistent nav on desktop; dead-end pages
3. **Inconsistent design system** — Spacing, typography scale, hover states, and button hierarchy lack formal codification
4. **Homepage pacing issues** — Too slow in early sections, broken mobile interactions, unclear CTAs
5. **Missing conversion strategy** — No clear user journeys by persona; competing CTAs; forms with no backend

This document captures **every finding and recommendation** organized into actionable categories.

---

## TABLE OF CONTENTS

1. [Design System Refinements](#1-design-system-refinements)
2. [Typography Overhaul](#2-typography-overhaul)
3. [Navigation & Information Architecture](#3-navigation--information-architecture)
4. [Homepage Remaster](#4-homepage-remaster)
5. [Inner Page Redesigns](#5-inner-page-redesigns)
6. [Component Library](#6-component-library)
7. [Micro-interactions & Animation](#7-micro-interactions--animation)
8. [Mobile Experience](#8-mobile-experience)
9. [Accessibility](#9-accessibility)
10. [Performance](#10-performance)
11. [Conversion & Analytics](#11-conversion--analytics)
12. [Implementation Priority Matrix](#12-implementation-priority-matrix)

---

## 1. Design System Refinements

### 1.1 Color System Formalization

**Current state:** 18 named colors exist but roles aren't codified. Accent colors (rust, clay, ember) are underutilized. Text opacity varies between `charcoal/60` and `charcoal/70` without system.

**Recommendations:**

#### Semantic Color Roles
```css
/* Typography colors */
--color-text-primary: #2a2520;              /* charcoal */
--color-text-secondary: rgba(42,37,32,0.7); /* charcoal/70 */
--color-text-tertiary: rgba(42,37,32,0.5);  /* charcoal/50 */
--color-text-muted: rgba(42,37,32,0.3);     /* charcoal/30 */

/* Light text (on dark backgrounds) */
--color-light-primary: #f5f1ea;              /* warm-white */
--color-light-secondary: rgba(245,241,230,0.7);

/* Functional colors */
--color-success: #6b8f71;  /* sage */
--color-warning: #d4a84b;  /* amber */
--color-error: #c45d3e;    /* ember */
--color-info: #3a5a6e;     /* navy */

/* Surface hierarchy */
--color-surface-default: #e8e0d0;   /* cream */
--color-surface-raised: #f5f1ea;    /* warm-white */
--color-surface-dark: #2a2520;      /* charcoal */
--color-surface-darkest: #1a1714;   /* night */
```

#### Enriched Section Backgrounds
Use subtle tinted backgrounds to create visual rhythm between sections:
- `bg-clay/5` for warm sections
- `bg-sage/3` for calm sections
- `bg-forest/4` for emphasis sections
- Alternate with pure `bg-cream` to create breathing room

#### Card Accent Color Pairs (standardized)
| Pair | Background | Border | Dot |
|------|-----------|--------|-----|
| Amber | `bg-amber/10` | `border-amber/30` | `bg-amber` |
| Forest | `bg-forest/10` | `border-forest/30` | `bg-forest` |
| Clay | `bg-clay/10` | `border-clay/30` | `bg-clay` |
| Sage | `bg-sage/10` | `border-sage/30` | `bg-sage` |
| Moss | `bg-moss/10` | `border-moss/30` | `bg-moss` |
| Navy | `bg-navy/10` | `border-navy/30` | `bg-navy` |
| Ember | `bg-ember/10` | `border-ember/30` | `bg-ember` |

### 1.2 Spacing System

**Current state:** Grid gaps vary arbitrarily (`gap-8`, `gap-10`, `gap-12`, `gap-14`, `gap-16`). Section padding is repetitive (`py-24 md:py-36` on almost every section).

**Recommendations:**

#### Standardized Spacing Scale
```
xs:  0.5rem  (8px)
sm:  1rem    (16px)
md:  1.5rem  (24px)
lg:  2rem    (32px)
xl:  3rem    (48px)
2xl: 4rem    (64px)
3xl: 6rem    (96px)
4xl: 9rem    (144px)
```

#### Section Rhythm Variation
Instead of uniform `py-24 md:py-36` on every section:
- **Breathing sections** (editorial, pull quotes): `py-32 md:py-48`
- **Standard sections** (grids, cards): `py-24 md:py-36`
- **Compact sections** (dividers, marquees): `py-12 md:py-16`
- **Hero sections**: `min-h-[85vh]` (keep current)

### 1.3 Text Selection Styling
```css
::selection {
  background-color: var(--color-amber);
  color: var(--color-charcoal);
}
```

---

## 2. Typography Overhaul

### 2.1 Formal Type Scale

**Current state:** Heading sizes mix `text-3xl`, `text-4xl`, `text-5xl` inconsistently. No codified relationship between levels. Playfair Display is imported but never used. Letter-spacing varies arbitrarily.

**Recommendations:**

#### Proportional Scale (1.2x ratio)
```css
h1: clamp(2.5rem, 6vw, 4rem)    line-height: 1.1   tracking: -0.02em
h2: clamp(2rem, 5vw, 3.5rem)    line-height: 1.15   tracking: -0.01em
h3: clamp(1.5rem, 3vw, 2.5rem)  line-height: 1.2    tracking: 0
h4: 1.25rem                      line-height: 1.3    tracking: 0
body: 1.0625rem (17px)           line-height: 1.7    tracking: 0
small: 0.9375rem                 line-height: 1.6    tracking: 0
caption: 0.8125rem               line-height: 1.5    tracking: 0
```

#### Activate Playfair Display
Use for hero-level h1 headings on inner pages to create visual distinction from body text (EB Garamond). Playfair's high-contrast italic serifs add personality and signal "this is a major page."

#### Standardize Letter-Spacing
- All uppercase labels: `tracking-[0.4em]` (existing, keep)
- All headings: `tracking-tight` (-0.02em) — tighter = more premium
- Body copy: default tracking (0)

### 2.2 Text Hierarchy Classes
```css
.text-primary   { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary  { color: var(--color-text-tertiary); }
.text-muted     { color: var(--color-text-muted); }
```

---

## 3. Navigation & Information Architecture

### 3.1 Persistent Desktop Navigation

**Current state:** Desktop users must click the hamburger menu to access any page. No sticky header, breadcrumbs, or secondary nav. Users lose navigation context on long pages (White Paper is 800+ lines).

**Recommendations:**

#### Add Sticky Header for Inner Pages
Show a compact persistent navigation bar on all pages except homepage:
```
[Logo] ── [Home] [About ▼] [Stories & Games ▼] [Resources] [Get Involved]
```
- Appears on scroll-down after hero passes
- Compact: ~60px height, semi-transparent cream background with blur
- Collapses to hamburger on mobile (keep current behavior)
- Keep existing full-screen menu as secondary option

#### Add Breadcrumbs to Nested Pages
For About sub-pages and Story detail pages:
```
Home > About > Our Mission
Home > Stories > Sherry's Story
```

### 3.2 About Landing Page

**Current state:** `/about` silently redirects to `/about/mission`. Users don't discover Team, Sponsors, or White Paper unless they open the menu dropdown.

**Recommendation:** Create a dedicated `/about` landing page with 4 entry-point cards:
- **Our Mission** — "Empty land becomes shelter, training becomes careers"
- **Our Team** — "Meet the people building 500 Acres"
- **Our Sponsors** — "Organizations supporting our mission"
- **White Paper** — "The HABITABLE research paper"

### 3.3 Footer Navigation Expansion

**Current state:** Footer only links to About, Stories, Resources, Get Involved. Missing: Home, all About sub-pages, Games.

**Recommendation:** Expand to full site map:
```
Navigate                    Connect
  Home                        Instagram
  About                       Twitter
    Mission                   Email
    Team                      Donate
    Sponsors
    White Paper
  Stories
  Resources
  Get Involved
```

### 3.4 Dead-End Page Fixes

**Resources page** has no CTA at bottom. Add "What's Next?" section:
```
Ready to take action?
→ Apply for Fellowship
→ Learn from Stories
```

**Stories page** lacks context about the research. Add introductory text:
```
"Seven Gen Z voices shared their stories about housing, belonging, and home.
Their insights shaped the 500 Acres model."
```

### 3.5 White Paper Table of Contents

Add a sticky sidebar TOC on desktop for the White Paper page:
```
1. Executive Summary
2. The Crisis
3. Housing Capacity
4. The HCU Ladder
5. Nesting Pods
6. Robotic Fabrication
7. Fellowship Model
8. Opportunity Zones
9. Business Model
10. References
```

---

## 4. Homepage Remaster

### 4.1 Narrative Structure & Pacing

**Current state:** 18+ viewport heights with uneven pacing. Slides 2-11 (observation + statistics) occupy ~10 viewports to establish a simple premise. Interactive sections (17-25) have inconsistent interaction patterns. No clear CTA until the very end.

**Recommended Restructured Flow:**

| Phase | Viewports | Content | Purpose |
|-------|-----------|---------|---------|
| 1. Hero + Scout | 1 | Loading animation → hero landscape → Scout intro | Set stage |
| 2. Context | 2 (down from 4) | Compressed scroll text: scrolling → spaces changing → belonging questioned | Establish stakes |
| 3. Crisis | 1 (down from 4) | Combined statistics: affordability + aspiration gap | Create urgency |
| 4. Map | 2 | Interactive migration map with participant quotes | Show scope |
| 5. Research Reveal | 1 | "We asked 7 Gen Z: what does home mean now?" | Bridge to stories |
| 6. Belonging Framework | 2 | Four anchors (Place, Object, Person, Language) interactive | Show findings |
| 7. Participant Stories + Drawings | 3 | Grid of 7 participants with modals; ideal home gallery | Human connection |
| 8. Vision | 1 | "This is what 500 Acres is building" with model explanation | Inspire |
| 9. Invitation | 1 | CTAs + icon maker + email signup | Convert |
| **Total** | **~14** (down from ~18) | | |

### 4.2 Section-Specific Fixes

#### Hero & Scout
- Increase Scout size from 3.5vw to 4-5vw
- Move Scout higher on viewport for better visibility
- Add hero subheading: "A research-driven exploration of housing, belonging, and community"
- Rewrite "Explore" to: "Discover 7 stories of home"

#### Scroll Text (Slides 2-5)
- Compress from 4 slides to 3
- Strengthen Slide 4 list: visually distinguish "Anxiety" and "Hope" from informational items
- End with: "...are changing. And we rarely ask what this means for belonging itself."

#### Statistics (Slides 8-11)
- Compress from 4 slides to 2
- Reorder: Start with aspiration (90% want to own), then crisis (81% can't afford)
- Add illustrated persona silhouettes to humanize percentages
- Bridge to research: "...belonging itself becomes uncertain. So we asked: what does belonging actually mean?"

#### Belonging Framework (Slide 18)
- Add explanatory headline: "When housing is unstable, belonging migrates to: Places you return to / Things you carry / People you know / Words you share"
- Speed up image reveals from 0.4s to 0.2s
- Add glow/pulse on active circle state
- Fix mobile tap-to-collapse behavior

#### Participant Stories (Slide 24)
- Reorganize from fixed-position scatter to clean grid (2×3 or 3×2)
- Add participant names below/inside icons
- Add Next/Previous navigation in modals
- Restructure modal: Header → Primary Quote (large) → Summary → Additional Quotes (expandable)

#### Closing Sequence (Slides 26-27)
- Break long Slide 27 sentence into sequential reveals:
  1. "500 Acres is more than research."
  2. "It's a working model."
  3. "Land near nature. Hands-on training. Housing units you build yourself."
  4. "A place where Gen Z can imagine belonging — and actually build it together."
- Add prominent CTA buttons: Learn More / Apply / Donate

#### Final Slide (Slide 28)
- Clarify "Make my icon" button purpose
- Make marquee interactive (pause on hover, click to revisit stories)
- Add email signup field
- Celebrate participants: "With deep gratitude to Sherry, Klyee, Lexi, Michaella, Oliver, Joy, and FY"

### 4.3 Meaning to Reality (Slide 23)
- Reduce from 400vh to 250vh
- Establish orb metaphor explicitly: "Watch two worlds collide"
- Synchronize text reveals with orb animation
- Add mobile fallback: static infographic showing three paths

---

## 5. Inner Page Redesigns

### 5.1 Cross-Page Issues

**Visual monotony:** Every page uses identical hero → divider → 3-column grid → CTA band structure. Pages blur together despite distinct content purposes.

**Recommendation:** Give each page a unique layout personality while maintaining brand cohesion:
- **Mission:** Full-width diagonal sections with image-text overlaps
- **Team:** Staggered masonry grid with featured leadership cards
- **Sponsors:** Grouped sections by partner type with featured partners
- **White Paper:** Mix of asymmetric sections, full-width blocks, sidebar TOC
- **Resources:** True bento grid with varied card sizes
- **Get Involved:** Timeline/step-based layout showing progression
- **Stories:** Masonry grid with varied card heights

### 5.2 Our Mission Page

**Issues:** Timeline section feels static (3 equal cards). Values cards are too uniform (4 identical layouts). No impact metrics visualized.

**Recommendations:**
1. **Redesign Timeline**: Diagonal/stepped layout with connecting visual lines; vary card heights by importance
2. **Values Cards**: Make 1-2 cards featured/larger; use bento-style staggered grid
3. **Add Impact Metrics**: Small stat cards showing early numbers (fellowships, houses built, etc.)
4. **Strengthen Pull Quote Section**: More dramatic background treatment with animated elements

### 5.3 Our Team Page

**Issues:** Extreme visual monotony — 17 identical circular headshots with no hierarchy. CEO and interns look identical. No bios, no context, no organizational structure.

**Recommendations:**
1. **Create Visual Hierarchy**: Feature 3-5 core leadership with larger cards and bios
2. **Group by Function**: Organize by role type (Leadership, Design & Build, Finance, Fellowship, Artists) with section headers
3. **Add Short Bios**: Title + 1-2 sentence bio highlighting unique contribution
4. **Redesign Consultant Section**: Integrate with visual distinction or feature as "Trusted Advisors"
5. **Use Hero More Effectively**: Show team in context (at a build, meeting, gathering)

### 5.4 Our Sponsors Page

**Issues:** 12 identical cards with no grouping. No visual differentiation by partnership type or depth. Logos vary in treatment.

**Recommendations:**
1. **Group by Category**: Section headers (Design & Fabrication, Academic, Media, Financial, Events)
2. **Feature Key Partners**: VUILD, WikiHouse, BSU Foundation as larger cards with case study snippets
3. **Add Partnership Badges**: "Design Partner," "Strategic Advisor," "Training Partner"
4. **Bento Grid**: Key partners span multiple columns

### 5.5 White Paper Page

**Issues:** Too text-heavy for digital reading. HCU Ladder section harder to understand than necessary. Data visualization is all text-based. Only one pull quote in 800+ lines.

**Recommendations:**
1. **Add Visual Breaks**: Every 3-4 paragraphs, insert highlighted quote block, stat block, or visual element
2. **Redesign HCU Ladder**: True ladder/step visualization instead of stepped margin cards
3. **Create Infographics**:
   - Circular diagram: HCU/CU/SRI interconnection
   - Flywheel visualization: fellowship-to-instruction cycle
   - Cost/time/emissions comparison: traditional vs. nesting pods
4. **Improve Business Model**: Circular flow diagram instead of horizontal text
5. **Add 2-3 More Pull Quotes**: Break up text-heavy sections
6. **Sticky Sidebar TOC**: Desktop navigation through sections

### 5.6 Resources Page

**Issues:** Marquee is purely decorative filler. Resource cards lack differentiation by type. No complexity/level indicators. Bento grid logic feels arbitrary.

**Recommendations:**
1. **Replace Marquee**: Use space for introductory text or resource count stat
2. **Add Resource Type Icons**: Document, video, course, toolkit icons
3. **Add Complexity Badges**: "Beginner," "Intermediate," "Advanced," "Deep-Dive"
4. **Meaningful Bento Grid**: White Paper as large card (proprietary); group by type/level
5. **Add CTA at Bottom**: "Ready to take action?" with links to Get Involved and Stories

### 5.7 Get Involved Page

**Issues:** Engagement cards are strong but form styling feels disconnected. Build section is text-only after visual richness. No step-by-step visual flow.

**Recommendations:**
1. **Add Application Timeline**: Visual diagram showing Apply → Cohort Start → Training → Build Weekend → Ownership Path
2. **Add FAQ Accordion**: Cost, time commitment, location, experience requirements
3. **Build Section**: Add gallery/carousel of past build photos
4. **Form Variations**: 3 micro-forms (Fellowship, Volunteer, General) that auto-populate based on card clicked

### 5.8 Stories Page

**Issues:** Cards are small and text-heavy. SVG portraits lack personality. Quote snippets barely readable. No visual hierarchy.

**Recommendations:**
1. **Featured Participant**: 1-2 larger cards with full quote visible
2. **Masonry/Staggered Layout**: Varied card heights; some cards taller with more content
3. **Amplify Quotes**: Make belonging quote the primary card element at larger font size
4. **Add Theme Tags**: "Housing Insecurity," "Found Community," "Gen Z Experience"

### 5.9 Story Detail Page

**Issues:** SVG portrait feels small. Ideal Home image is plain (gray box). Navigation is utilitarian.

**Recommendations:**
1. **Enlarge SVG Portrait**: More visual prominence in hero
2. **Enhance Ideal Home Section**: Full-width image with overlaid title/description
3. **Add Progress Indicator**: "Participant 3 of 7"
4. **Visual Navigation**: Thumbnail + name cards at bottom instead of text links

### 5.10 Not Found Page

**Recommendations:**
1. Add featured links to main sections (Mission, Stories, Resources, Get Involved)
2. Include search functionality
3. "You might be looking for..." section

---

## 6. Component Library

### 6.1 Button Hierarchy

**Current state:** Primary and secondary CTAs feel same prominence. No tertiary button. No codified system.

**Recommendations:**
```css
/* Primary — high-emphasis action */
.btn-primary {
  @apply px-8 py-4 rounded-full font-serif font-bold
         bg-ember text-cream
         transition-all duration-300
         hover:bg-rust hover:shadow-lg hover:scale-105;
}

/* Secondary — medium-emphasis action */
.btn-secondary {
  @apply px-8 py-4 rounded-full font-serif font-bold
         border-2 border-charcoal text-charcoal
         transition-all duration-300
         hover:bg-charcoal hover:text-cream;
}

/* Tertiary — low-emphasis action */
.btn-tertiary {
  @apply px-6 py-2 font-serif text-sm
         text-charcoal/60
         transition-colors duration-300
         hover:text-charcoal hover:bg-charcoal/5;
}
```

### 6.2 Card System

```css
/* Primary card — elevated, featured */
.card-primary {
  @apply rounded-3xl p-10 md:p-14 border border-charcoal/5
         bg-warm-white shadow-sm
         transition-all duration-500
         hover:-translate-y-3 hover:shadow-lg;
}

/* Secondary card — accent colored */
.card-secondary {
  @apply rounded-2xl p-8 md:p-10 border-2
         transition-all duration-500
         hover:-translate-y-2;
}

/* Accent card — with left border */
.card-accent {
  @apply relative rounded-2xl border-2 border-charcoal/10
         transition-all duration-500;
  border-left-width: 6px;
}
```

### 6.3 Reusable PageHero Component
```jsx
export default function PageHero({ title, subtitle, pretitle, image, isDark }) {
  return (
    <section className={`relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28 ${isDark ? 'bg-charcoal' : ''}`}>
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
        </>
      )}
      {/* Blobs, content, scroll indicator */}
    </section>
  );
}
```

### 6.4 Form Input Enhancement

**Current state:** `border-b border-cream/20` — too subtle, no hover state.

**Recommendation:**
```jsx
<input className="
  w-full px-0 py-3 bg-transparent
  border-b-2 border-charcoal/20
  font-serif text-lg placeholder-charcoal/30
  transition-all duration-300
  hover:border-charcoal/40
  focus:outline-none focus:border-sage
  focus:shadow-[inset_0_2px_0_0_rgba(107,143,113,0.1)]
" />
```

---

## 7. Micro-interactions & Animation

### 7.1 Motion System

**Current state:** All animations use single easing curve. Hover durations inconsistent (300ms vs 500ms). No system for different motion types.

**Recommendations:**
```css
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  /* buttons, toggles */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);       /* reveals, slides */
--ease-crisp: cubic-bezier(0.77, 0, 0.18, 1);       /* menu, overlays */
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);          /* exits, fades */
```

### 7.2 Enhanced Hover States

**Current state:** Most cards only use `-translate-y-2 shadow-xl`. Buttons mostly color-only transitions. Limited variety.

**Recommendations:**
- Cards: `-translate-y-3 shadow-lg` with subtle background shift
- Buttons: `scale-105` with shadow on primary; border fill on secondary
- Links: Animated underline width expansion (`.creative-link` exists but underused)
- Images: Subtle scale (1.02) on container hover

### 7.3 Enhanced Focus States
```css
*:focus-visible {
  outline: 3px solid var(--color-sage);
  outline-offset: 4px;
  border-radius: 6px;
}

button:focus-visible, a:focus-visible {
  box-shadow: 0 0 0 4px rgba(107,143,113,0.2);
}
```

### 7.4 Menu Speed Optimization
Reduce clip-path animation from 600ms to 400ms. Total time to see all links would drop from 720ms to ~520ms.

### 7.5 Newsletter Success Animation
Replace plain text "You're in" with toast notification or subtle animation confirming subscription.

### 7.6 CSS Cleanup
Remove unused classes: `.big-number`, `.magnetic-card`, `.horizontal-scroll-container` (unless planned for future use).

---

## 8. Mobile Experience

### 8.1 Touch Targets

**Current state:** Category filter pills are `px-5 py-2.5` (small). Some navigation numbers are `text-xs`.

**Recommendations:**
- All clickable elements ≥ 44x44px (WCAG recommendation)
- Increase filter pill padding: `px-6 py-3`
- Increase story card touch targets

### 8.2 Homepage Mobile Fixes

**Critical issues:**
- Map sections don't work on touch devices — add static image fallback
- Fixed-position SVG layouts overlap on small screens — use CSS Grid/Flexbox
- Modals clip at 80vh — use 95vw width, 85vh max-height with scrollable content
- Scroll-triggered animations stutter — use IntersectionObserver-based state changes
- Orbs-and-line animation calculates wrong positions — add mobile-specific fallback

### 8.3 Tablet Optimization

**Current state:** Design jumps from mobile (768px) to desktop (1024px+) with no tablet-specific breakpoints.

**Recommendation:** Add intermediate layouts for 768px-1024px range, especially for:
- Team page grid (2 columns instead of 3)
- Sponsor page grid
- White Paper layout (no sidebar TOC, but keep wider content)

### 8.4 Font Readability
Some `text-xs uppercase` elements (0.75rem) may be too small on mobile. Ensure minimum 12px for any readable text.

---

## 9. Accessibility

### 9.1 ARIA Improvements

**Current gaps:**
- Navigation dropdown buttons missing `aria-expanded`
- Some decorative blobs missing `aria-hidden="true"`
- Form inputs lack explicit `<label>` elements
- Team hero image has `alt=""` but is contextual — needs description
- SVG illustrations lack `role="img"` and descriptive alt text

**Recommendations:**
```jsx
/* Navbar dropdown */
<button aria-expanded={isExpanded} aria-controls="about-submenu">
  About
</button>
<div id="about-submenu" role="region">...</div>

/* Form inputs */
<label htmlFor="email-newsletter" className="sr-only">Email address</label>
<input id="email-newsletter" type="email" />

/* Decorative elements */
<div className="blob" aria-hidden="true" />

/* Team hero */
<img src={teamHero} alt="Team members gathered around fire pit" />

/* Story SVGs */
<img alt={`Portrait illustration of ${p.name}`} src={svgUrl} />
```

### 9.2 Color Contrast
- Audit `text-charcoal/60` on cream backgrounds (currently borderline ~4.5:1)
- Custom cursor `mix-blend-mode: difference` can make cursor invisible on certain backgrounds
- Footer social links `text-cream/70` on dark — at lower WCAG AA limit

### 9.3 Error States
- No error handling on form submissions — add `aria-live` error messages with `role="alert"`
- No image load fallback — add `onError` handler with fallback
- Form validation: real-time feedback with accessible error messaging

### 9.4 Screen Reader Navigation
- Color-only active page indicators need text backup (e.g., checkmark or "(current)" text)
- Homepage interactive circles need `aria-label`: "Place anchor button," "Person anchor button"

---

## 10. Performance

### 10.1 Image Optimization

**Critical:** Only 2 of 61 images have `loading="lazy"`. All hero images, backgrounds, and below-fold content should use native lazy loading.

```jsx
<img src={photo} alt="..." loading="lazy" decoding="async" />
```

Add responsive images with `srcset` for hero and large images:
```jsx
<img
  src={heroImage}
  srcSet={`${heroMobile} 640w, ${heroTablet} 1024w, ${heroImage} 1400w`}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 85vw"
  loading="lazy"
/>
```

### 10.2 Code Splitting

**Current issues:**
- GSAP/ScrollTrigger bundled with React in vendor chunk (~100KB+)
- Map libraries (Mapbox GL + deck.gl, ~200KB) not in separate chunks
- Modal/Form components imported directly instead of lazy-loaded

**Recommendation:** Update `vite.config.js`:
```js
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-gsap': ['gsap', '@gsap/react', 'gsap/ScrollTrigger'],
  'vendor-maps': ['mapbox-gl', 'deck.gl'],
}
```

### 10.3 Custom Cursor Performance
Using `style.transform` in requestAnimationFrame every frame without throttling — heavy on low-end devices. Add 16ms target throttle or disable on low-powered devices.

### 10.4 Font Loading
Add `font-display: swap` to prevent invisible text during font load:
```css
@font-face {
  font-family: 'EB Garamond';
  font-display: swap;
}
```

### 10.5 Page Load Fallback Enhancement
Current `PageFallback` shows only 3 dots. Replace with contextual skeleton loader matching target page layout.

---

## 11. Conversion & Analytics

### 11.1 User Persona Journeys

Define clear journeys for each audience:

**Persona A: Potential Fellow** (18-35, seeking housing + training)
```
Home → Stories (inspiration) → Get Involved (application)
Key info: Fellowship requirements, timeline, outcomes
```

**Persona B: Supporter** (35+, wants to donate/partner)
```
Home → About/Mission → White Paper (depth) → Donate
Key info: Impact metrics, governance, partnership options
```

**Persona C: Researcher/Student**
```
Home → Resources → White Paper (research)
Key info: Full documentation, citations, frameworks
```

**Persona D: Media/Partner**
```
Home → Team → Sponsors → Contact
Key info: Press kit, case studies, contact info
```

### 11.2 Get Involved Restructure

**Current state:** Mega-funnel with 4 competing CTAs on one page.

**Recommendation:** Restructure as decision tree:
```
"How do you want to get involved?"

[Apply for Fellowship] → Toggle form
[Volunteer for Build] → Toggle form
[Attend Live Forum] → Calendar/link
[Donate] → External link
[Stay Updated] → Newsletter signup
```

Or create separate sub-pages: `/fellowship`, `/volunteer`, `/donate` with Get Involved as hub.

### 11.3 Form Backend Integration

**Critical:** Current forms show success messages but don't send data anywhere.

**Recommendation:**
- Integrate all forms with backend (API endpoints or service like Formspree/Netlify Forms)
- Add validation feedback in real-time
- Show success modal with next steps:
  ```
  "Thank you! We've received your application.
  Next steps:
  1. Check your email for confirmation
  2. We'll contact you within 48 hours
  3. In the meantime, check out Resources or Stories"
  ```

### 11.4 Analytics Integration

No analytics currently visible in codebase.

**Recommendation:**
- Integrate Google Analytics 4 or Segment
- Track: page views, form starts/completions, CTA clicks, resource link clicks
- Event tracking:
  ```
  gtag('event', 'form_start', { form_name: 'fellowship' });
  gtag('event', 'cta_click', { text: 'Get Involved', location: 'mission_cta' });
  ```

### 11.5 Homepage CTAs
Add visible conversion points at 2-3 moments:
- After Belonging Reveal (mid-page): "See how this research is becoming reality"
- After Vision (near end): Primary CTA — Apply / Learn / Join
- Final Slide: Secondary CTA — Share / Support / Sign Up

---

## 12. Implementation Priority Matrix

### Tier 1: Quick Wins (1-2 days, high impact)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | Add `loading="lazy"` to all images | Performance | 30 min |
| 2 | Add breadcrumbs to About sub-pages | Navigation | 1 hour |
| 3 | Expand footer navigation | Navigation | 1 hour |
| 4 | Add CTA to Resources page bottom | Conversion | 30 min |
| 5 | Add context intro to Stories page | Clarity | 30 min |
| 6 | Fix text selection styling | Polish | 5 min |
| 7 | Standardize letter-spacing on headers | Typography | 30 min |
| 8 | Add `aria-expanded` to nav dropdowns | Accessibility | 30 min |
| 9 | Fix team hero alt text | Accessibility | 5 min |
| 10 | Speed up menu animation (600ms → 400ms) | Polish | 5 min |
| 11 | Add decorative blobs `aria-hidden` | Accessibility | 15 min |
| 12 | Remove unused CSS classes | Performance | 30 min |

### Tier 2: Design System & Components (3-5 days)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 13 | Formalize color roles in CSS variables | Consistency | 2 hours |
| 14 | Create button hierarchy (primary/secondary/tertiary) | Hierarchy | 2 hours |
| 15 | Create card system (primary/secondary/accent) | Consistency | 2 hours |
| 16 | Standardize spacing scale | Rhythm | 2 hours |
| 17 | Activate Playfair Display for inner page h1s | Typography | 1 hour |
| 18 | Enhance form input styling | Polish | 1 hour |
| 19 | Create motion system (4 easing curves) | Animation | 1 hour |
| 20 | Create reusable PageHero component | DRY | 2 hours |
| 21 | Enhance hover states across all cards | Polish | 2 hours |
| 22 | Enhance focus states | Accessibility | 1 hour |

### Tier 3: Page Redesigns (1-2 weeks)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 23 | Create About landing page | Navigation | 3 hours |
| 24 | Add sticky desktop header for inner pages | Navigation | 4 hours |
| 25 | Redesign Team page (hierarchy, grouping, bios) | Design | 4 hours |
| 26 | Add White Paper sidebar TOC | UX | 3 hours |
| 27 | Redesign Sponsors page (grouped, featured) | Design | 3 hours |
| 28 | Create bento grid for Resources | Design | 3 hours |
| 29 | Redesign Stories page (masonry, featured cards) | Design | 3 hours |
| 30 | Add timeline to Get Involved page | Design | 3 hours |
| 31 | Add FAQ accordion to Get Involved | UX | 2 hours |
| 32 | Improve White Paper infographics (HCU ladder, flywheel) | Design | 4 hours |
| 33 | Enhance Story Detail page (larger portrait, visual nav) | Design | 2 hours |
| 34 | Enhance 404 page (site map, search) | UX | 1 hour |

### Tier 4: Homepage Remaster (1-2 weeks)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 35 | Compress scroll text (4 slides → 3) | Pacing | 2 hours |
| 36 | Compress statistics (4 slides → 2) | Pacing | 2 hours |
| 37 | Fix Slide 18 interaction (touch, speed, feedback) | Mobile | 2 hours |
| 38 | Reorganize participant SVGs to grid layout | UX | 3 hours |
| 39 | Add modal navigation (Previous/Next) | UX | 2 hours |
| 40 | Reduce Meaning-to-Reality from 400vh to 250vh | Pacing | 2 hours |
| 41 | Fix mobile map fallback | Mobile | 2 hours |
| 42 | Strengthen closing CTAs | Conversion | 1 hour |
| 43 | Clarify "Make my icon" button | Clarity | 30 min |
| 44 | Increase Scout visibility | Design | 1 hour |
| 45 | Add homepage email signup | Conversion | 1 hour |

### Tier 5: Infrastructure & Analytics (3-5 days)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 46 | Integrate form backend (Formspree/Netlify) | Critical | 4 hours |
| 47 | Add Google Analytics 4 | Analytics | 2 hours |
| 48 | Separate GSAP and Maps into own chunks | Performance | 1 hour |
| 49 | Add skeleton loaders for lazy pages | Polish | 3 hours |
| 50 | Add responsive images (srcset) | Performance | 3 hours |
| 51 | Throttle custom cursor on low-end devices | Performance | 1 hour |
| 52 | Add font-display: swap | Performance | 15 min |

---

## Appendix: Files Reference

| File | Key Changes Needed |
|------|-------------------|
| `src/styles/globals.css` | Color variables, spacing scale, motion system, button/card classes, focus states, cleanup unused classes |
| `src/components/layout/Navbar.jsx` | ARIA attributes, sticky header variant, speed optimization |
| `src/components/layout/Footer.jsx` | Expanded navigation, site map |
| `src/pages/OurTeamPage.jsx` | Hierarchy, grouping, bios, featured leadership |
| `src/pages/OurSponsorsPage.jsx` | Grouped sections, featured partners, bento grid |
| `src/pages/WhitePaperPage.jsx` | Sidebar TOC, infographics, pull quotes, section breaks |
| `src/pages/ResourcesPage.jsx` | Replace marquee, type icons, complexity badges, bottom CTA |
| `src/pages/GetInvolvedPage.jsx` | Decision tree, timeline, FAQ, form backend |
| `src/pages/StoriesPage.jsx` | Masonry layout, featured cards, context intro, theme tags |
| `src/pages/StoryDetailPage.jsx` | Larger portrait, visual nav, progress indicator |
| `src/pages/OurMissionPage.jsx` | Timeline redesign, values hierarchy, impact metrics |
| `src/pages/HomePage.jsx` | Narrative restructure, pacing compression |
| `src/components/homepage/*` | Mobile fixes, interaction patterns, CTAs |
| `src/App.jsx` | About landing page route, code splitting |
| `src/components/shared/PageHero.jsx` | New reusable component |
| `src/hooks/useReveal.js` | No changes needed |
| `vite.config.js` | Chunk splitting for GSAP and Maps |
| `index.html` | Analytics script, font-display |
