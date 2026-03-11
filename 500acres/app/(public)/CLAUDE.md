# app/(public)/ — Public Marketing Pages

## Layout (Client Component)

```typescript
'use client';
// Wraps all public pages with: CustomCursor, ScrollProgress, Navbar, Footer
// Footer hidden on homepage (pathname === '/')
```

Components from `@/components/public/layout/` and `@/components/public/shared/`.

## Page Pattern

```typescript
'use client';
import useReveal from '@/hooks/useReveal';
import heroImage from '@/assets/photos/my-hero.webp';  // Static import

export default function MyPage() {
  const ref = useReveal();
  return (
    <div ref={ref} className="inner-page grain bg-cream">
      {/* page content */}
    </div>
  );
}
```

- `useReveal()` — IntersectionObserver hook, adds `is-revealed` class for entrance animations
- `inner-page` — typography defaults (line-height, heading styles, selection color)
- `grain` — fixed noise texture overlay via `::before` pseudo-element
- `bg-cream` — page background color

## CSS Classes (defined in `globals.css`)

| Class | Effect |
|---|---|
| `inner-page` | Typography defaults, selection color (amber) |
| `grain` | Noise texture overlay |
| `page-container` | Horizontal padding + max-width |
| `reveal-up` | Fade in + slide up (40px) |
| `reveal-left` / `reveal-right` | Fade in + slide from side |
| `reveal-scale` | Fade in + scale from 0.95 |
| `reveal-fade` | Opacity-only fade in |
| `stagger-1` through `stagger-6` | Transition delays (0.1s increments) |

All reveal classes activate on `.is-revealed` (set by `useReveal` hook).

## Shared Components (`@/components/public/shared/`)

| Component | Usage |
|---|---|
| `SectionHeader` | Pretitle + heading + optional body for page sections |
| `SectionDivider` | Decorative break between sections |
| `CTABand` | Full-width call-to-action strip |
| `Breadcrumbs` | Navigation breadcrumbs |
| `PageHero` | Hero banner with background image |
| `PullQuote` | Styled blockquote |
| `Modal` | Dialog overlay |
| `ScrollProgress` | Top progress bar |
| `CustomCursor` | Custom cursor effect |

## Typography Pattern

```html
<!-- Pretitle -->
<p class="font-sans text-xs uppercase tracking-[0.3em] text-charcoal/50">Pretitle</p>
<!-- Heading -->
<h2 class="font-serif text-[clamp(2rem,5vw,3.5rem)] font-bold text-charcoal">Heading</h2>
<!-- Body -->
<p class="font-serif text-lg leading-relaxed text-charcoal/80">Body text</p>
```

## Image Handling

```typescript
import myPhoto from '@/assets/photos/my-photo.webp';  // Static import
import Image from 'next/image';

<Image src={myPhoto} alt="Description" fill className="object-cover" />
```

- **Always** import from `@/assets/` — NOT from `public/` directory
- Use `next/image` with static imports for automatic optimization
- Prefer `.webp` format
