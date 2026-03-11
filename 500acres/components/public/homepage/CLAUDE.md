# components/public/homepage/ — GSAP ScrollTrigger Animations

16 scroll section components for the homepage documentary experience.

## Two Animation Patterns

**useGSAP (preferred)** — MeaningToReality, ZoomTransition:
```typescript
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const containerRef = useRef<HTMLElement>(null);
useGSAP(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // animations...
}, { scope: containerRef });
```

**useEffect (older)** — HeroLanding, ParticipantStories, InitialMap:
```typescript
useEffect(() => {
  gsap.fromTo(el, { scale: 1.1 }, { scale: 1, duration: 8, ease: 'none' });
}, []);
```

## GPU Acceleration

Animate ONLY `x`, `y`, `scale`, `rotation`, `opacity`. NEVER `left`/`top`/`width`/`height`.

## Reduced Motion (REQUIRED)

```typescript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
// For visible final state without animation:
gsap.set(element, { opacity: 1, y: 0 });
```

## ScrollTrigger Config

```typescript
scrollTrigger: {
  trigger: element,
  end: () => `top+=${window.innerHeight} top`,
  scrub: true,
  invalidateOnRefresh: true,  // REQUIRED: recalculate on resize
  pinReparent: true,          // REQUIRED with pin: prevents layout shift
}
```

## window.__bg Bridge

Cross-component background crossfade (BackgroundCrossfade.tsx):
```typescript
// @ts-expect-error -- global bridge for cross-component background sync
window.__bg = { changeBg, setBgInstant, pickMostVisibleSlide, isSlide7FadeoutRef };

// Using from other components — ALWAYS null-check:
// @ts-expect-error -- global bridge for cross-component background sync
if (window.__bg) window.__bg.changeBg(url, 500);
```

## Body Class Toggles

CSS-driven state via `document.body` classes:
```typescript
onEnter: () => document.body.classList.add('slide6-zoom-active'),
toggleClass: { targets: document.body, className: 'slide8-active' },
document.body.classList.toggle('slide24-active', entry.isIntersecting);
```
Active: `slide6-zoom-active`, `slide7-active`, `slide7-fadeout`, `slide8-active`, `slide24-active`

## Section Markup

```html
<section className="slide slide6" data-bg={imageSrc}>           <!-- with background -->
<section className="slide slide23" data-bg="">                   <!-- empty background -->
<section className="slide slide26" data-bg={img} data-fade="2500"> <!-- custom fade ms -->
```
- `slide` — base class (required for BackgroundCrossfade observer)
- `slideN` — unique section identifier
- `data-bg` — background URL (IntersectionObserver watches these)
- `data-fade` — crossfade duration override (default ~400ms)
