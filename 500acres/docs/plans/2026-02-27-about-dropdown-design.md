# About Us Dropdown & Team Page Design

**Date:** 2026-02-27
**Status:** Approved

## Summary

Transform the "About" nav link from a single page into an expandable menu item with two sub-links: "Our Mission" and "Our Team". The current About page content moves to Our Mission; Our Team is a new page populated from the employee spreadsheet.

## Approach

**Expandable sub-links in fullscreen menu.** When the user clicks "About" in the fullscreen nav overlay, instead of navigating, it expands to reveal two indented sub-links with GSAP staggered animation. Sub-links navigate to `/about/mission` and `/about/team`.

## Architecture

### Routing Changes

| Old Route | New Route | Page Component |
|-----------|-----------|----------------|
| `/about` | `/about/mission` | `OurMissionPage.jsx` |
| — | `/about/team` | `OurTeamPage.jsx` |
| `/about` | redirect → `/about/mission` | — |

### Navbar Changes

`NAV_LINKS` restructured to support `children`:

```js
{ label: "About", num: "02", children: [
    { to: "/about/mission", label: "Our Mission" },
    { to: "/about/team", label: "Our Team" },
]}
```

Items with `children` become toggles (not links). Clicking expands/collapses. Sub-links animate in with GSAP (indented, smaller font). Clicking a sub-link navigates normally via existing `handleNavClick`.

### Our Mission Page

Identical to the current `AboutPage.jsx` content: hero, mission statement, values, pull quote, vision timeline, origin story, newsletter signup, CTA band. The team section is removed from this page since it now lives on its own page.

### Our Team Page

Three sections on cream background, matching site editorial style:

**Section 1 — "Our Team" (Core Employees)**
3-column responsive grid. Each card: circular placeholder image with initials, name, job title. No bios.

| Name | Role |
|------|------|
| Michelle Crosby | CEO |
| John Seidl | Chairman |
| Mikey Thomas | Superintendent |
| Fengming Mo | Financial Analyst |
| Aiden Miller | AI & Data Strategy Fellow |
| Cole Kreilig | Machine Learning & Systems Fellow |
| Cam Steinberg | Project Manager |
| Rocio Loberza | Architectural Designer |

**Section 2 — "Fellows"**
Same card style.

| Name | Role |
|------|------|
| Yuchun Zhang | Urban Design Intern |
| Lex | Artist in Residence |
| Kyle & Antonio | Artists in Residence |

**Section 3 — "Consultants & Advisors"**
Same card style.

| Name | Role |
|------|------|
| Roy Nelson | Tax Consultant |
| Melanie Birch | Book Keeper |
| Araman Kakar | Financial Controller |
| Spozami Kakar | Board Secretary / Accounts Manager |

Each card uses the existing placeholder pattern (circular `bg-charcoal/5` with initials + colored accent dot), ready for real photos.

### Footer Update

Footer "About" link → `/about/mission`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/Navbar.jsx` | Restructure NAV_LINKS, add expand/collapse for children |
| `src/pages/AboutPage.jsx` | Rename/refactor to `OurMissionPage.jsx`, remove team section |
| `src/pages/OurTeamPage.jsx` | New file — team grid with placeholder images |
| `src/App.jsx` | Update routes: `/about/mission`, `/about/team`, redirect `/about` |
| `src/components/layout/Footer.jsx` | Update About link to `/about/mission` |
