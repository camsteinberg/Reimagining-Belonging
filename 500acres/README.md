# 500 Acres

A website for **500 Acres**, a non-profit focused on making housing equitable through technology — helping Gen Z build houses with robots by 2026.

The homepage preserves the original *Reimagining Belonging* scroll animation — a 28-section interactive experience exploring Gen Z's relationship with home, featuring housing statistics, interactive migration maps, participant interviews, ideal home drawings, and a belonging framework. The rest of the site provides pages for reading participant stories, accessing housing resources, getting involved, and managing fellowship operations via a protected dashboard.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** — server/client rendering with Turbopack dev
- **Tailwind CSS 4** — custom Campfire theme (cream/charcoal/ember/sage/forest)
- **GSAP + ScrollTrigger** — scroll-driven homepage animations
- **Mapbox GL + Deck.GL** — interactive migration maps with arc layers
- **Neon PostgreSQL** (serverless) — database
- **jose** — JWT authentication
- **SWR** — dashboard data fetching
- **Recharts** — budget visualizations
- **Resend** — transactional email

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# Fill in required values — see .env.local.example for descriptions
npm run dev
```

The site will be available at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest watch mode |

## Project Structure

```
500acres/
├── app/
│   ├── (public)/         # Public pages (homepage, stories, resources, get-involved)
│   ├── (auth)/           # Login, register, forgot/reset password
│   ├── (dashboard)/      # Protected dashboard (fellowship, analytics, users, etc.)
│   ├── api/              # 27 API routes
│   └── globals.css       # Design system + all styles (~3100 lines)
├── components/
│   ├── public/           # Homepage scroll components, navbar, footer, shared UI
│   ├── fellowship/       # Dashboard components
│   └── ui/               # Reusable UI primitives (SurfaceCard)
├── lib/                  # Auth, DB, rate limiting, email, tokens
├── hooks/                # useAnalytics, useReveal
├── data/                 # Participant profiles, map config
└── public/               # Static assets, GeoJSON
```

## Pages

**Public:**
- `/` — 28-section scroll animation (Reimagining Belonging)
- `/stories` — Participant grid
- `/stories/:slug` — Individual participant story
- `/resources` — Housing resources
- `/get-involved` — Engagement + donation

**Auth:**
- `/login`, `/register`, `/forgot-password`, `/reset-password`

**Dashboard (protected):**
- `/fellowship`, `/fellowship-admin` — Fellow dashboard
- `/analytics`, `/users`, `/governance` — Admin dashboard
- `/barndobucks`, `/realestate`, `/till`, `/buzz` — Data dashboards

## Environment Variables

See [`.env.local.example`](.env.local.example) for all required variables with descriptions.

## Deployment

Deployed on **Vercel** with security headers (HSTS, CSP, permissions policy) and 1-year asset caching.
