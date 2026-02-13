# 500 Acres

A website for **500 Acres**, a non-profit focused on making housing equitable through technology — helping Gen Z build houses with robots by 2026.

The homepage preserves the original *Reimagining Belonging* scroll animation — a 28-section interactive experience exploring Gen Z's relationship with home, featuring housing statistics, interactive migration maps, participant interviews, ideal home drawings, and a belonging framework. The rest of the site provides pages for learning about the organization, reading participant stories, accessing housing resources, and getting involved.

## Tech Stack

- **React 19** + **Vite 7** — fast dev server and optimized builds
- **Tailwind CSS 4** — utility-first styling with a custom woodsy color theme
- **GSAP** — scroll-driven animations, page transitions, and interactive elements
- **Mapbox GL** + **Deck.GL** — interactive migration maps with arc layers
- **React Router** — client-side routing with smooth page transitions

## Getting Started

```bash
# Install dependencies
npm install

# Add your Mapbox token
cp .env.local.example .env.local
# Edit .env.local and set VITE_MAPBOX_TOKEN=your_token_here

# Start dev server
npm run dev
```

The site will be available at `http://localhost:5173`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
500acres/
├── public/
│   └── data/              # GeoJSON files for maps
├── src/
│   ├── assets/
│   │   ├── brand/         # Logo files
│   │   ├── images/        # Section backgrounds, drawings, photos
│   │   └── svg/           # Participant portrait SVGs
│   ├── components/
│   │   ├── homepage/      # 16 scroll animation section components
│   │   ├── layout/        # Navbar, Footer, PageTransition, ScrollToTop
│   │   └── shared/        # Modal, Logo
│   ├── data/              # Participant profiles, slide config, map config
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Route-level page components
│   └── styles/            # Global CSS + Tailwind theme
├── .env.local             # Mapbox token (not committed)
└── vercel.json            # Vercel deployment config
```

## Pages

- **/** — The full scroll animation experience (28 sections)
- **/about** — Mission, vision timeline, origin story
- **/stories** — Participant grid with links to individual profiles
- **/stories/:slug** — Individual participant story with quotes and drawings
- **/resources** — Filterable housing resource cards and partner organizations
- **/get-involved** — Volunteer form, engagement funnel, donation CTA

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_MAPBOX_TOKEN` | Mapbox GL access token (required for map sections) |

## Deployment

Configured for **Vercel** with SPA fallback routing via `vercel.json`.
