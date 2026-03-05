# Campfire Design System -- 500 Acres

> **Source of truth:** `app/globals.css`
> Page-specific overrides live in `design-system/pages/[page-name].md` and take precedence.

**Stack:** Next.js 15 + Tailwind CSS v4 (`@theme` block) + CSS custom properties

---

## Color Palette

Warm earth tones, deep night sky, forest canopy, firelit warmth.

### Core Palette (`@theme` tokens -- usable as Tailwind classes)

| Token              | Hex / Value | Tailwind class   | Role                  |
|--------------------|-------------|------------------|-----------------------|
| `--color-cream`    | `#e8e0d0`  | `bg-cream`       | Canvas / base surface |
| `--color-rust`     | `#8b5e3c`  | `bg-rust`        | Hover accent          |
| `--color-gold`     | `#b89f65`  | `bg-gold`        | Decorative accent     |
| `--color-charcoal` | `#2a2520`  | `bg-charcoal`    | Text / dark surfaces  |
| `--color-forest`   | `#3d6b4f`  | `bg-forest`      | Nature accent         |
| `--color-navy`     | `#3a5a6e`  | `bg-navy`        | Info                  |
| `--color-warm-white`| `#f5f1ea` | `bg-warm-white`  | Raised surface / cards|
| `--color-sage`     | `#6b8f71`  | `bg-sage`        | Success               |
| `--color-moss`     | `#365f45`  | `bg-moss`        | Deep green accent     |
| `--color-bark`     | `#5c3d2e`  | `bg-bark`        | Strong primary        |
| `--color-clay`     | `#b8755d`  | `bg-clay`        | Warm mid-tone         |
| `--color-amber`    | `#d4a84b`  | `bg-amber`       | Warning / selection   |
| `--color-ember`    | `#c45d3e`  | `bg-ember`       | CTA / primary action  |
| `--color-night`    | `#1a1714`  | `bg-night`       | Darkest surface       |
| `--color-starlight`| `#f0ead6`  | `bg-starlight`   | Elevated surface      |
| `--color-smoke`    | `#8a837a`  | `bg-smoke`       | Muted text            |
| `--color-pine`     | `#2d4a37`  | `bg-pine`        | Deep forest           |
| `--color-hearth`   | `#a0522d`  | `bg-hearth`      | Warm brown accent     |

### Semantic Tokens (`:root` CSS custom properties)

| Token                       | Value                          | Usage                    |
|-----------------------------|--------------------------------|--------------------------|
| `--color-text-primary`      | `#2a2520`                      | Body text                |
| `--color-text-secondary`    | `rgba(42,37,32,0.75)`         | Secondary copy           |
| `--color-text-tertiary`     | `rgba(42,37,32,0.55)`         | Tertiary / captions      |
| `--color-text-muted`        | `rgba(42,37,32,0.3)`          | Disabled / placeholder   |
| `--color-success`           | `#6b8f71` (sage)               | Success states           |
| `--color-danger`            | `#b91c1c`                      | Error / destructive      |
| `--color-warning`           | `#d4a84b` (amber)              | Warnings                 |
| `--color-info`              | `#3a5a6e` (navy)               | Informational            |
| `--color-primary`           | `#c45d3e` (ember)              | CTA / brand accent       |
| `--color-primary-strong`    | `#5c3d2e` (bark)               | Strong emphasis          |
| `--color-primary-soft`      | `rgba(196,93,62,0.12)`        | Tinted backgrounds       |

### Surface & Border Tokens

| Token                       | Value                          | Usage                    |
|-----------------------------|--------------------------------|--------------------------|
| `--color-canvas`            | `#e8e0d0` (cream)              | Dashboard background     |
| `--color-surface`           | `#f5f1ea` (warm-white)         | Default surface          |
| `--color-surface-subtle`    | `#f0ebe0`                      | Subtle surface           |
| `--color-surface-elevated`  | `#f0ead6` (starlight)          | Elevated surface         |
| `--color-surface-muted`     | `rgba(42,37,32,0.05)`         | Muted fill               |
| `--color-border-soft`       | `rgba(42,37,32,0.10)`         | Subtle dividers          |
| `--color-border-strong`     | `rgba(42,37,32,0.22)`         | Strong borders           |

---

## Typography

| Variable          | Font Family        | Usage                                |
|-------------------|--------------------|--------------------------------------|
| `--font-serif`    | EB Garamond        | Body text (default on `body`)        |
| `--font-sans`     | Inter              | UI elements, secondary text          |
| `--font-display`  | Playfair Display   | Display headings, editorial accents  |

Fonts loaded via `next/font/google` in `app/layout.tsx` (no external `@import`).

Fluid typography uses `clamp()` throughout -- no fixed breakpoint font-size jumps.

---

## Spacing Scale

| Token          | Value     |
|----------------|-----------|
| `--space-xs`   | `0.5rem`  |
| `--space-sm`   | `1rem`    |
| `--space-md`   | `1.5rem`  |
| `--space-lg`   | `2rem`    |
| `--space-xl`   | `3rem`    |
| `--space-2xl`  | `4rem`    |
| `--space-3xl`  | `6rem`    |
| `--space-4xl`  | `9rem`    |

---

## Easing Curves

| Token            | Value                              | Usage              |
|------------------|------------------------------------|--------------------|
| `--ease-bounce`  | `cubic-bezier(0.34,1.56,0.64,1)`  | Playful entrances  |
| `--ease-smooth`  | `cubic-bezier(0.16,1,0.3,1)`      | General motion     |
| `--ease-crisp`   | `cubic-bezier(0.77,0,0.18,1)`     | Snappy transitions |
| `--ease-out`     | `cubic-bezier(0.22,1,0.36,1)`     | Exit animations    |

---

## Motion

### Reveal Animations (scroll-triggered, `globals.css`)

All use `--ease-smooth` (`cubic-bezier(0.16,1,0.3,1)`). Add class + toggle `.is-revealed` via JS.

| Class            | Initial State             | Duration |
|------------------|---------------------------|----------|
| `.reveal-up`     | `translateY(60px)`, 0 opacity | 0.8s |
| `.reveal-left`   | `translateX(-80px)`, 0 opacity | 0.8s |
| `.reveal-right`  | `translateX(80px)`, 0 opacity | 0.8s |
| `.reveal-scale`  | `scale(0.85)`, 0 opacity  | 0.8s     |
| `.reveal-fade`   | 0 opacity                 | 1.2s     |

Standard interaction durations: `duration-300` (buttons/links), `duration-500` (cards).

### Focus States

```css
*:focus-visible        { outline: 3px solid var(--color-sage); outline-offset: 4px; border-radius: 6px; }
button:focus-visible,
a:focus-visible        { box-shadow: 0 0 0 4px rgba(107,143,113,0.2); }
```

---

## Component Classes

Defined in `@layer components` in `globals.css`.

### Buttons

| Class            | Appearance                                         |
|------------------|----------------------------------------------------|
| `.btn-primary`   | Ember bg, cream text, rounded-full, bold serif, px-8 py-4. Hover: rust bg + scale. |
| `.btn-secondary` | Transparent, charcoal border + text, rounded-full, px-8 py-4. Hover: charcoal bg, cream text.  |
| `.btn-tertiary`  | Transparent, charcoal/60 text, no border, px-6 py-2. Hover: light charcoal bg.   |

### Cards (CSS classes)

| Class             | Appearance                                         |
|-------------------|----------------------------------------------------|
| `.card-primary`   | Warm-white bg, rounded-3xl, p-10/md:p-14, subtle border. Hover: translateY(-12px) + shadow. |
| `.card-secondary` | Rounded-2xl, p-8/md:p-10, 2px border. Hover: translateY(-8px). |
| `.card-accent`    | Rounded-2xl, 6px left border, charcoal/10 border.  |

### SurfaceCard (React component: `components/ui/SurfaceCard.tsx`)

Dashboard card component with rounded-3xl, soft border, card shadow, 300ms transition.

| Prop      | Options                    | Default     |
|-----------|----------------------------|-------------|
| `variant` | `default` / `muted` / `inset` | `default` |
| `padding` | `sm` / `md` / `lg`        | `md`        |

| Variant   | Background                           |
|-----------|--------------------------------------|
| `default` | `--color-surface` (warm-white)       |
| `muted`   | `--color-surface-subtle` (#f0ebe0)   |
| `inset`   | `--color-surface-elevated` (starlight) |

---

## Dashboard Scoping

Dashboard styles are scoped via `[data-dashboard]` attribute on the layout wrapper:
- Background switches to `--color-canvas` (cream)
- Links use `--color-primary` (ember) with tinted underlines
- Sidebar uses charcoal dark theme (`--surface-sidebar: #2a2520`)

Public site uses separate base variables: `--bg: #f2efe7`, `--ink: #111`, `--panel: #ffffffcc`.

---

## Accessibility

- `prefers-reduced-motion: reduce` kills all animation/transition durations
- Skip-to-content link in `layout.tsx` (sr-only, visible on focus)
- `cursor: pointer` on all interactive elements via base layer reset
- `cursor: not-allowed` on disabled elements and `[aria-disabled="true"]`
- Selection highlight uses amber bg with charcoal text

---

## Anti-Patterns

- No emojis as icons -- use SVG icons (Lucide preferred)
- No hardcoded hex in components -- use Tailwind palette classes or CSS variables
- No layout-shifting hovers -- prefer `translateY` over `scale` for cards
- No instant state changes -- all interactive elements need `transition-all duration-300`
- No `@import url()` for fonts -- use `next/font/google`
- Keep focus states visible for keyboard navigation
- Minimum 4.5:1 contrast ratio for text
