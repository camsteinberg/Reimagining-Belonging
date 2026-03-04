# Dashboard Integration Design: habitable.us + BarndosDashboard

**Date:** 2026-03-04
**Status:** Approved

## Overview

Merge the 500 Acres public site (React+Vite SPA) and BarndosDashboard (Next.js full-stack app) into a single unified Next.js 15 application deployed at habitable.us. Add authentication with admin-approved registration, a full custom analytics module, and unify both under the Campfire design system.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Architecture | Unified Next.js 15 app (migrate Vite SPA into dashboard codebase) |
| Login UX | Navbar "Login" button → /login page → redirect to /dashboard |
| Analytics | Full custom analytics (pageviews, visitors, sessions, referrals, geo, device, real-time) |
| Design | Unified Campfire design system across public site + dashboard |
| Animations | GSAP for public pages, Framer Motion for dashboard (coexist via code-splitting) |
| Maps | Mapbox/Deck.GL for public, Google Maps for dashboard (both kept) |
| Registration | Open registration with admin approval before activation |

## Architecture

### Route Structure

```
habitable.us/ (Next.js 15 App Router)
├── app/
│   ├── (public)/                    # Public route group (no auth)
│   │   ├── layout.tsx               # Public layout (Navbar with Login, Footer)
│   │   ├── page.tsx                 # Homepage (28-section scroll)
│   │   ├── about/
│   │   │   ├── page.tsx             # About landing
│   │   │   ├── mission/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   ├── sponsors/page.tsx
│   │   │   └── white-paper/page.tsx
│   │   ├── stories/
│   │   │   ├── page.tsx             # Stories grid
│   │   │   └── [slug]/page.tsx      # Individual story
│   │   ├── resources/page.tsx
│   │   └── get-involved/page.tsx
│   │
│   ├── (auth)/                      # Auth route group (standalone layout)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/                 # Protected route group (auth required)
│   │   ├── layout.tsx               # Dashboard layout (sidebar, user menu)
│   │   ├── dashboard/page.tsx       # Dashboard home
│   │   ├── analytics/page.tsx       # NEW: Website analytics
│   │   ├── till/page.tsx
│   │   ├── barndobucks/page.tsx
│   │   ├── buzz/page.tsx
│   │   ├── fellowship/page.tsx
│   │   ├── fellowship-admin/page.tsx
│   │   ├── governance/page.tsx
│   │   ├── realestate/page.tsx
│   │   └── account/page.tsx
│   │
│   ├── api/
│   │   ├── analytics/               # NEW
│   │   │   ├── event/route.ts       # Collect events (public, rate-limited)
│   │   │   ├── realtime/route.ts    # Real-time active users
│   │   │   └── report/route.ts      # Aggregated reports (admin only)
│   │   ├── admin/
│   │   │   ├── fellows/route.ts     # Existing
│   │   │   └── users/route.ts       # NEW: User approval management
│   │   ├── login/route.ts
│   │   ├── register/route.ts        # MODIFIED: pending status
│   │   ├── logout/route.ts
│   │   └── ... (all existing endpoints unchanged)
│   │
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Merged Campfire tokens
│   └── middleware.ts                # Auth middleware
│
├── components/
│   ├── public/                      # Migrated from Vite
│   │   ├── homepage/                # 16 scroll section components
│   │   ├── shared/                  # PageHero, CTABand, PullQuote, etc.
│   │   └── layout/                  # Navbar, Footer
│   ├── dashboard/                   # Existing dashboard components
│   │   ├── fellowship/
│   │   ├── analytics/               # NEW: Analytics charts/cards
│   │   └── ui/
│   └── auth/                        # Login/register forms
│
├── lib/
│   ├── auth.ts, db.ts               # Existing
│   ├── analytics.ts                 # NEW: Collection/query logic
│   ├── geo.ts                       # NEW: IP geo lookup
│   └── ... (existing libs)
│
├── hooks/
│   ├── useReveal.ts                 # Migrated (GSAP scroll reveals)
│   └── useAnalytics.ts              # NEW: Client-side tracker
│
├── data/                            # Migrated static data
└── public/                          # Static assets
```

### Route Groups

- `(public)` — No auth. Public Navbar with Login button, Footer. GSAP loaded here.
- `(auth)` — Standalone layout for auth pages. Campfire-styled but minimal.
- `(dashboard)` — Auth required. Dashboard sidebar layout. Framer Motion loaded here.

### Middleware

Protects `(dashboard)` routes. Checks JWT cookie for valid session with `status === 'active'`. Redirects to `/login` if unauthenticated. Redirects admins from `/fellowship` to `/fellowship-admin`.

## Authentication & User Flow

### User Model Changes

Add `status` column to `User` table:

```sql
ALTER TABLE "User" ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended'));
-- Existing users get 'active' status
```

### Registration Flow (with approval)

1. User visits `/register`
2. Fills in: name, email, password, optional phone
3. `POST /api/register` creates user with `status: 'pending'`, `role: 'fellow'`
4. User sees: "Account created. You'll receive an email when approved."
5. Admin gets email notification via Resend
6. Admin visits `/dashboard/users` → pending users list
7. Admin approves → `status: 'active'` → user gets approval email
8. OR Admin rejects → `status: 'suspended'` → user gets rejection email

### Login Flow

1. Click "Login" in navbar → `/login`
2. Enter email/username/phone + password
3. `POST /api/login`:
   - `status === 'pending'` → "Your account is awaiting approval"
   - `status === 'suspended'` → "Your account has been suspended"
   - `status === 'active'` → JWT cookie, redirect to `/dashboard`
4. JWT payload: `{ userId, username, email, role, status }`

### Logged-in Navbar

When authenticated, Login button becomes user avatar/dropdown with: Dashboard, Account, Logout.

### Admin User Management (`/dashboard/users`)

- Table of all users with status filter (pending/active/suspended)
- Actions: Approve, Suspend, Change Role
- Email notifications on status changes

## Analytics Module

### Database Schema

```sql
CREATE TABLE analytics_events (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  country     TEXT,
  region      TEXT,
  screen_w    INTEGER,
  screen_h    INTEGER,
  event_type  TEXT DEFAULT 'pageview',
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_path ON analytics_events(path);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
```

### Client-side Tracker (`useAnalytics` hook)

- Runs on all public pages
- Generates session_id per browser session (sessionStorage)
- On page load: `POST /api/analytics/event` with pageview data
- On unload: `navigator.sendBeacon` with duration
- No cookies, no fingerprinting — privacy-respecting

### Server-side Processing (`/api/analytics/event`)

- No auth required (public pages send events)
- Rate-limited: max 10 events/second per IP
- IP → geo via MaxMind GeoLite2 (no external API)
- User-agent parsed into device/browser/OS
- IP stripped from stored data (privacy)

### Dashboard View (`/analytics`)

Cards: pageviews, unique visitors, avg session duration, bounce rate
Charts: pageviews over time (area), top pages (table), referral sources (table)
Breakdowns: device type (donut), geography (table)
Real-time: active visitors count + current pages (polled every 30s)
Time filters: 7d, 30d, 90d, custom range

### API Endpoints

- `POST /api/analytics/event` — Collect events (public, rate-limited)
- `GET /api/analytics/realtime` — Active visitors in last 5 min (admin only)
- `GET /api/analytics/report?period=7d` — Aggregated report (admin only)

## Migration Strategy

### Component Migration

Most Vite components are pure React + GSAP. Migration requires:

1. Adding `'use client'` directives (GSAP needs browser APIs)
2. Replacing `react-router-dom` with Next.js `Link` and file-system routing
3. Moving static data files as-is
4. Adapting env vars: `VITE_MAPBOX_TOKEN` → `NEXT_PUBLIC_MAPBOX_TOKEN`
5. Merging CSS into unified globals.css

### CSS Merge

The 2847-line Campfire `globals.css` becomes the design foundation:

- Campfire design tokens (`@theme` layer)
- Color roles, surfaces, typography
- Animation utilities (`.reveal-up`, `.hover-lift`, etc.)
- Public page styles
- Dashboard adopts same tokens

### Dashboard Visual Refresh

Existing dashboard components adopt Campfire palette:

- Surfaces: grays → cream, warm-white, charcoal
- Accents: blues → ember, rust, gold
- Charts: Recharts palette → campfire colors (forest, sage, gold, navy, rust)
- Typography: headings → EB Garamond, data/labels → Inter
- Cards: warm-white on cream surface pattern

### Unchanged

- All 7 dashboard module logic (Till, BarndoBucks, Buzz, Fellowship, Governance, Real Estate)
- All existing API routes
- Database schema (only additive: status column + analytics table)
- Google Sheets/Drive/Expensify/Resend/Twilio integrations

## Dependencies

### Added

- `gsap` + `@gsap/react` (for public page animations)
- `mapbox-gl` + `deck.gl` (for public page maps)
- `maxmind` or `geoip-lite` (for analytics geo lookup)
- `ua-parser-js` (for user-agent parsing)

### Kept

All existing dashboard dependencies (Next.js, React, Tailwind, Recharts, Framer Motion, Google Maps, PostgreSQL, bcryptjs, jose, googleapis, resend, twilio, xlsx, etc.)

## Environment Variables

All existing env vars from the dashboard, plus:

```
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox-access-token>
```

Existing dashboard env vars unchanged (DATABASE_URL, AUTH_SECRET, Google credentials, etc.)

## Deployment

- Single Vercel deployment
- Environment variables configured in Vercel dashboard
- Build: `next build`
- No changes to existing CI/CD (if any)
