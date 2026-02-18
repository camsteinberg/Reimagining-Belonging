# 500 Acres React App — Audit Fix Implementation Plan

## Date: 2026-02-17

## Context

Comprehensive Playwright + code review audit identified 10 issues across functionality, performance, mobile compatibility, and UX. This plan addresses all findings using a 3-agent parallel team with zero file ownership conflicts.

## Agent Team Structure

### Agent 1: `touch-fixer` — Touch & Interaction Specialist

**Scope:** All hover-only interactions that break on touch devices, touch target sizing, mobile layout gaps.

**Files owned:**
- `src/components/homepage/BelongingFramework.jsx` — add tap-toggle for circle expansion
- `src/components/homepage/ParticipantDrawings.jsx` — add touch handlers alongside mouseenter
- `src/styles/globals.css` — touch media queries, footer touch targets, Scout empty space fix

**Requirements:**
- BelongingFramework circles: add `onClick` toggle state that mirrors hover behavior on touch devices
- ParticipantDrawings: add `touchstart`/`click` handler for drawing expansion
- Footer social links (Instagram, Twitter): ensure min 44x44px touch targets via padding
- Scout character hidden on mobile: adjust layout so no empty space remains
- Use `@media (hover: none), (pointer: coarse)` for touch-specific CSS
- Preserve all existing desktop hover behavior unchanged

### Agent 2: `perf-optimizer` — Performance & Image Specialist

**Scope:** Image optimization (WebP conversion, lazy loading, srcset), asset pipeline.

**Files owned:**
- `src/assets/images/` — convert top PNGs to WebP
- `vite.config.js` — image optimization plugin
- `src/components/homepage/ClosingSequence.jsx`
- `src/components/homepage/IdealHomes.jsx`
- `src/components/homepage/FinalSlide.jsx`
- `src/components/homepage/ParticipantStories.jsx`
- `src/components/homepage/PhoneOverlay.jsx`
- `src/components/homepage/HeroLanding.jsx`
- `src/components/homepage/BackgroundCrossfade.jsx`

**Requirements:**
- Convert the 5 largest PNGs to WebP: finalImage2.png (4MB), finalImage.png (3MB), idealHome 06.png (1.9MB), 04.png (1.2MB), 01.png (1MB)
- Add `loading="lazy"` to all `<img>` tags for content below the fold
- Remove explicit `loading="eager"` from FinalSlide.jsx
- Keep hero image eager (above the fold)
- Update all import paths to reference WebP versions

### Agent 3: `reliability-fixer` — Reliability & UX Specialist

**Scope:** LoadingScreen subpage fix, Mapbox error handling, map initialization.

**Files owned:**
- `src/components/shared/LoadingScreen.jsx` — conditional homepage-only rendering
- `src/App.jsx` — pass isHomepage prop to LoadingScreen
- `src/components/homepage/MigrationMap.jsx` — add .catch() error handling
- `src/components/homepage/InitialMap.jsx` — add error handling

**Requirements:**
- LoadingScreen: accept `show` prop, only render when `show={true}` (homepage)
- App.jsx: pass `isHomepage` to LoadingScreen as `show` prop
- MigrationMap: add `.catch()` to `Promise.all` with console.error and graceful fallback
- InitialMap: add error handling for map initialization
- Ensure external link security (rel="noopener noreferrer" on all target="_blank")

## File Ownership Matrix

No two agents touch the same file. This enables fully parallel execution.

## Quality Gates

After all agents complete:
1. Start Vite dev server
2. Run Playwright test across all 5 viewports
3. Verify zero regressions
4. Visual screenshot comparison
