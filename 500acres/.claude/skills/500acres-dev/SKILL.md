---
name: 500acres-dev
description: Project conventions, design system, and patterns for the 500 Acres website. Use when creating pages, components, adding images, or making any changes to the site.
---

# 500 Acres Development Guide

## Tech Stack

- **Next.js 15** (App Router, route groups)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** (CSS-first config via `@theme` block in globals.css)
- **GSAP 3** for complex animations, CSS for simple transitions
- **Neon PostgreSQL** (serverless, via `@neondatabase/serverless`)
- **Custom JWT auth** (jose, httpOnly cookies)
- Deployed to **Vercel**

## Project Structure

```
app/
  (public)/        # Public site (homepage, about, stories, resources, get-involved)
  (auth)/          # Auth pages (login, register, forgot-password, reset-password)
  (dashboard)/     # Protected dashboard (fellowship, governance, till, analytics, etc.)
  api/             # API routes
  globals.css      # Design tokens + all custom CSS
  layout.tsx       # Root layout (fonts, metadata)
components/
  public/
    homepage/      # Homepage scroll sections (HeroLanding, ZoomTransition, etc.)
    layout/        # Navbar, Footer
    shared/        # Logo, CustomCursor, Modal, ErrorBoundary, SectionHeader, CTABand
  fellowship/      # AdminDashboard, FellowDashboard, BudgetAdmin, BudgetChart
  ui/              # SurfaceCard
  AppShell.tsx     # Dashboard sidebar layout
  Sidebar.tsx      # Dashboard navigation sidebar
assets/            # Images, headshots, photos, logos, SVGs (imported via @/assets/...)
data/              # mapConfig.js, participants.js, slides.js
hooks/             # useReveal, useAnalytics
lib/               # auth.ts, db.ts, getSession.ts, mail.ts, tokens.ts
middleware.ts      # Route protection + role-based access
```

## Design System (Campfire Theme)

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | #e8e0d0 | Page backgrounds, light text on dark |
| `charcoal` | #2a2520 | Body text, dark sections |
| `forest` | #3d6b4f | Primary accent, active nav states |
| `sage` | #6b8f71 | Secondary green accent |
| `moss` | #365f45 | CTA sections, dark green backgrounds |
| `ember` | #c45d3e | Red/orange accent, primary buttons |
| `gold` | #b89f65 | Gold accent |
| `amber` | #d4a84b | Warning, highlight accent |
| `bark` | #8b5e3c | Brown accent |
| `warm-white` | #f5f1ea | Light text on dark (replaces pure white) |
| `navy` | #3a5a6e | Blue accent |
| `night` | #1a1714 | Darkest backgrounds |

Semantic tokens: `--color-canvas`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border-soft`, `--color-primary`, `--color-danger`, `--color-success`, `--color-warning`

**Rules:** Never use `text-white` (use `text-warm-white`), never use `bg-black` (use `bg-charcoal`), never use hardcoded hex — always use CSS variables or Tailwind color classes.

### Typography

- **Serif:** EB Garamond — headings, body text, editorial
- **Display:** Playfair Display — hero/display headings
- **Sans:** Inter — labels, metadata, navigation, dashboard UI
- Dashboard headings use `font-serif`
- Common patterns:
  - Heading: `font-serif text-3xl md:text-5xl font-bold text-charcoal`
  - Label: `font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60`
  - Body: `font-serif text-lg text-charcoal/60 leading-[1.8]`

### Dashboard Components

- **SurfaceCard** (`components/ui/SurfaceCard.tsx`) — 3 variants: default, muted, inset
- **AppShell** — sidebar layout with collapsible nav
- All dashboard pages use CSS variables (`var(--color-text)`, `var(--color-surface)`, etc.)

## Auth System

- Custom JWT (HS256) via `jose` library
- httpOnly secure cookies (`session` cookie name)
- `getSession()` from `@/lib/getSession` for server-side auth
- `/api/me` endpoint for client-side auth detection
- Middleware protects all `/dashboard`, `/fellowship`, `/users`, `/analytics` etc. routes
- Registration creates `pending` users; admins approve via `/users` page
- Roles: `fellow` (default), `admin`

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/globals.css` | All design tokens + custom CSS |
| `app/layout.tsx` | Root layout (fonts, metadata) |
| `middleware.ts` | Route protection + role routing |
| `lib/auth.ts` | JWT signing/verification |
| `lib/db.ts` | Neon database connection |
| `components/public/layout/Navbar.tsx` | Public site navigation |
| `components/AppShell.tsx` | Dashboard layout shell |
