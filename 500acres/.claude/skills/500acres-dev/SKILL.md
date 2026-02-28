---
name: 500acres-dev
description: Project conventions, design system, and patterns for the 500 Acres website. Use when creating pages, components, adding images, or making any changes to the site.
---

# 500 Acres Development Guide

## Tech Stack

- **React 19** + **React Router 7** (lazy-loaded pages)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **GSAP 3** for complex animations, CSS for simple transitions
- **Vite 7** build system, deployed to Vercel

## Project Structure

```
src/
  pages/           # Route-level pages (lazy-loaded except HomePage)
  components/
    homepage/      # Homepage-only components
    layout/        # Navbar, Footer, PageTransition, ScrollToTop
    shared/        # Logo, CustomCursor, Modal, ErrorBoundary
    about/         # About section components
  hooks/           # useReveal (IntersectionObserver)
  data/            # participants.js, slides.js, mapConfig.js
  assets/
    headshots/     # Team member photos (.webp, 800px max)
    photos/        # Editorial/hero photos (.webp)
    logos/         # Sponsor logos (.png, .svg)
    images/        # Homepage graphics
    svg/           # Icon SVGs
  styles/          # globals.css (2500+ lines)
```

## Design System

### Colors (Campfire Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | #e8e0d0 | Page backgrounds, light text on dark |
| `charcoal` | #2a2520 | Body text, dark sections |
| `forest` | #3d6b4f | Primary accent, active nav states, hover text |
| `sage` | #6b8f71 | Secondary green accent |
| `moss` | #365f45 | CTA sections, dark green backgrounds |
| `amber` | #d4a84b | Gold accent |
| `clay` | #b8755d | Warm accent |
| `ember` | #c45d3e | Red/orange accent |
| `bark` | #5c3d2e | Brown accent |
| `night` | #1a1714 | Darkest backgrounds |

### Typography

- **Serif:** EB Garamond — headings, body text, elegant content
- **Sans:** Inter — labels, metadata, navigation, uppercase tracking
- Common patterns:
  - Heading: `font-serif text-3xl md:text-5xl font-bold text-charcoal`
  - Label: `font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60`
  - Body: `font-serif text-lg text-charcoal/60 leading-[1.8]`

### Layout

- `.page-container` — max-width 1400px, padding `max(2.5rem, 6vw)`
- Section spacing: `py-24 md:py-36`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10`

## Inner Page Template

Every inner page follows this structure:

```jsx
export default function ExamplePage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="inner-page grain bg-cream min-h-screen overflow-hidden">
      {/* Hero — min-h-[60vh] to min-h-[85vh] */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-12" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
        {/* Decorative blobs */}
        <div className="absolute top-[15%] left-[-8%] w-[40vw] h-[40vw] bg-sage/5 blob pointer-events-none" />

        <div className="page-container relative z-10">
          <p className="reveal-up font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-10">
            Section Label
          </p>
          <h1 className="reveal-up stagger-1 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] font-bold text-charcoal mb-8">
            Page Title
          </h1>
          <p className="reveal-up stagger-2 font-serif text-lg md:text-xl text-charcoal/70 max-w-md">
            Subtitle text here.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="page-container"><div className="h-px bg-charcoal/10" /></div>

      {/* Content sections... */}

      {/* CTA band */}
      <section className="relative py-24 md:py-36 bg-moss overflow-hidden">
        <div className="page-container relative z-10 text-center">
          <h2 className="reveal-up font-serif text-3xl md:text-5xl font-bold text-cream mb-6">
            Ready to build?
          </h2>
          <Link to="/get-involved" className="reveal-up stagger-2 inline-block bg-cream text-charcoal px-10 py-4 rounded-full font-serif text-lg font-bold hover:bg-sage hover:text-cream transition-colors duration-300">
            Get Involved
          </Link>
        </div>
      </section>
    </div>
  );
}
```

## Animation System

### Scroll Reveals

Apply `useReveal()` to the page root via `ref`, then use these classes:

| Class | Effect |
|-------|--------|
| `reveal-up` | Slides up from 60px below |
| `reveal-left` | Slides in from -80px left |
| `reveal-right` | Slides in from 80px right |
| `reveal-scale` | Scales up from 0.85 |
| `stagger-1` through `stagger-6` | Delays 100ms–600ms |

All use `cubic-bezier(0.16, 1, 0.3, 1)` easing, 0.8s duration.

### Decorative Elements

- **Blobs:** `className="absolute ... bg-sage/5 blob pointer-events-none"` — morphing organic shapes
- **Grain:** Applied via `grain` class on page root — SVG fractal noise overlay
- **Dividers:** `<div className="h-px bg-charcoal/10" />` inside `.page-container`

## Image Pipeline

### Adding new images

1. **Resize:** `sips -Z 800 "source.jpg" --out /tmp/resized.jpg`
2. **Convert to WebP:** `cwebp -q 80 /tmp/resized.jpg -o src/assets/<dir>/name.webp`
3. **Import in component:** `import myImage from "../assets/<dir>/name.webp";`

### Headshots specifically

- Max dimension: 800px
- Format: `.webp`
- Location: `src/assets/headshots/`
- Naming: `firstname-lastname.webp` (lowercase, hyphenated)
- Displayed in 160x160 rounded circles with accent dot

### Photo naming convention

Descriptive, hyphenated: `team-hero-firepit.webp`, `mission-team-workbench.webp`

## Routing

### Adding a new page

1. Create `src/pages/NewPage.jsx`
2. Add lazy import in `App.jsx`: `const NewPage = lazy(() => import("./pages/NewPage"));`
3. Add route: `<Route path="/new-page" element={<NewPage />} />`
4. Add to `NAV_LINKS` in `Navbar.jsx`

### Navbar dropdown pattern

```jsx
{
  label: "Section Name",
  num: "02",
  children: [
    { to: "/section/child", label: "Child Page" },
    { to: "https://external.com", label: "External Link", external: true },
  ],
}
```

External links render as `<a target="_blank">` with an external-link icon. Internal links use `<Link>` with smooth menu-close transition.

## Card Patterns

### Resource/Sponsor card with accent colors

```jsx
<div className="group relative p-10 md:p-12 rounded-2xl border bg-amber/10 border-amber/30
  transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
  <div className="flex items-center gap-3 mb-10">
    <div className="w-2 h-2 rounded-full bg-amber" />
    <span className="font-sans text-xs uppercase tracking-[0.2em] text-charcoal/60">Category</span>
  </div>
  <h2 className="font-serif text-xl md:text-2xl font-bold text-charcoal mb-6 group-hover:text-forest transition-colors">
    Title
  </h2>
  <p className="font-serif text-base text-charcoal/60 leading-[1.8] mb-10">Description</p>
</div>
```

### Accent color pairs used across the site

- `bg-amber/10 border-amber/30` + `bg-amber`
- `bg-forest/10 border-forest/30` + `bg-forest`
- `bg-clay/10 border-clay/30` + `bg-clay`
- `bg-sage/10 border-sage/30` + `bg-sage`
- `bg-moss/10 border-moss/30` + `bg-moss`
- `bg-navy/10 border-navy/30` + `bg-navy`

## Team Data Pattern

```jsx
const TEAM_MEMBERS = [
  { name: "Full Name", role: "Title", photo: importedHeadshot },
  { name: "No Photo Person", role: "Title" },  // Falls back to initials
];
```

Members without a `photo` property render initials in a circle instead.

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.jsx` | Routes + lazy imports |
| `src/components/layout/Navbar.jsx` | Navigation + dropdowns |
| `src/components/layout/Footer.jsx` | Site footer |
| `src/styles/globals.css` | All custom CSS (2500+ lines) |
| `src/hooks/useReveal.js` | IntersectionObserver for scroll animations |
| `src/data/participants.js` | Story/participant data |
| `vite.config.js` | Build config with manual chunks |
