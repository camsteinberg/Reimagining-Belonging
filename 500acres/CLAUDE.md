# 500 Acres — Reimagining Belonging

Gen Z housing crisis documentary + fellowship management platform.
Next.js 15 (App Router) | React 19 | Tailwind CSS 4 | Neon PostgreSQL | Vercel

## Commands

| Command | What |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest watch mode |

## Directory Map

```
app/
  (public)/       Public marketing pages (homepage, stories, resources, get-involved)
  (auth)/         Login, register, forgot/reset password
  (dashboard)/    Protected dashboard (fellowship, analytics, users, till, etc.)
  api/            27 API routes
  globals.css     Design system + all styles (~3100 lines)
components/
  public/         Homepage scroll sections, navbar, footer, shared UI
  fellowship/     Dashboard components (BudgetViewer, AdminDashboard, etc.)
  ui/             Reusable primitives (SurfaceCard)
lib/              Auth, DB, rate limiting, email, tokens, phone, sheets
hooks/            useAnalytics, useReveal
data/             Participant profiles, map config, slides
assets/           Static images (imported via @/assets/, NOT public/)
```

## Design System

**Fonts** (loaded via `next/font/google` in `app/layout.tsx`):
`--font-serif` EB Garamond (body) | `--font-sans` Inter (UI) | `--font-display` Playfair Display (headings)

**Core palette** (defined in `@theme` block of `globals.css`):

| Token | Hex | Usage |
|---|---|---|
| `--color-cream` | `#e8e0d0` | Public page backgrounds |
| `--color-charcoal` | `#2a2520` | Primary text, sidebar bg |
| `--color-ember` | `#c45d3e` | Primary CTA, accent |
| `--color-sage` | `#6b8f71` | Success states |
| `--color-forest` | `#3d6b4f` | Secondary green |
| `--color-warm-white` | `#f5f1ea` | Surfaces |
| `--color-gold` | `#b89f65` | Warning, highlights |
| `--color-navy` | `#3a5a6e` | Info states |

**Semantic tokens**: `--color-text` (primary) | `--color-text-secondary` | `--color-text-muted` | `--color-canvas` (dashboard bg) | `--color-surface` (cards) | `--color-border-soft` | `--color-primary` (ember)

**Absolute rules**:
- NEVER use `text-white` or `bg-black` -- use `text-warm-white`, `bg-charcoal`, or token vars
- NEVER hardcode hex values -- always use `var(--color-*)` or Tailwind color names
- All styles in `globals.css` `@theme` block -- there is NO `tailwind.config` file (Tailwind 4 CSS-first)

## Auth Model

JWT via `jose` (HS256) with httpOnly `session` cookie.
- **Roles**: `admin` (full access) | `fellow` (fellowship dashboard only)
- **Middleware** (`middleware.ts`): protects `/dashboard`, `/fellowship`, `/till`, `/users`, etc.
- Admin visiting `/fellowship` -> redirected to `/fellowship-admin`
- Fellow visiting `/fellowship-admin` or `/users` -> redirected away
- See `lib/CLAUDE.md` for auth function signatures

## Env Vars

| Category | Variables |
|---|---|
| Database | `DATABASE_URL` |
| Auth | `AUTH_SECRET` |
| Maps | `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| Google Sheets | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE` |
| Sheet IDs | `GOVERNANCE_SHEET_ID`, `CONTACTS_ID`, `TOPQ_SHEET_ID`, `BARNDOS_SHEET_ID`, `TILL_FILE_IDS` |
| App | `NEXT_PUBLIC_SITE_URL`, `MONEY_TEAM_EMAILS`, `DEFAULT_PHONE_REGION` |

## Conventions

- **Path alias**: `@/*` maps to project root (`@/lib/auth`, `@/components/ui/SurfaceCard`)
- **Deployment**: Vercel with security headers (HSTS, CSP, X-Frame-Options DENY)
- **Images**: static imports from `@/assets/` with `next/image` -- NOT from `public/` directory
- **Icons**: `lucide-react` everywhere
- **Charts**: `recharts` for dashboard visualizations
