# Editorial Image Placement Design

> **Status:** IMPLEMENTED | Completed 2026-02-27

**Date:** 2026-02-27
**Status:** Approved
**Approach:** Editorial Storytelling — 12-15 images at highest-impact locations

## Summary

Add real fellowship photography to the 5 internal pages (OurMission, OurTeam, Stories, Resources, GetInvolved) at strategic high-impact locations. Preserve the site's elegant text-forward design while grounding it in real imagery.

## Image Source

688 photos from the Barndos Summer Fellowship (May-Aug 2025). Located at `/tmp/barndos-images/Barndos Summer Fellowship/`. Images need to be:
1. Converted to WebP for web performance
2. Resized to appropriate dimensions
3. Placed in `src/assets/photos/` (directory already exists with .gitkeep)

## Image Placements by Page

### OurMissionPage (6 images)

| Section | Image File | Description | Integration |
|---------|-----------|-------------|-------------|
| Origin (replace Logo placeholder) | `20250625_095430.jpg` | Stanford presenter in garage-classroom with Airstream/hills | Replace `<Logo>` in the `aspect-square bg-charcoal/5` div with `<img>` — container already has `rounded-2xl overflow-hidden reveal-scale` |
| Pull quote background | `20250611_082700.jpg` | Storm clouds over white barndo cottage | Add `<img>` with `absolute inset-0 object-cover` + `bg-charcoal/80` overlay behind existing text |
| Mission left column | `20250528_112822.jpg` | Four-person team at construction workbench | Add below heading in `md:col-span-4` div as `aspect-[3/4] rounded-2xl overflow-hidden` |
| Timeline: Research & Design | `20250617_105424.jpg` | Classroom presentation, engaged learning | Add `aspect-video rounded-xl overflow-hidden mb-8` at top of card, before step number |
| Timeline: Prototype & Train | `20250701_103935.jpg` | Crane lifting roof trusses, workers on roof | Same pattern as above |
| Timeline: Deploy & Scale | `20250627_192241.jpg` | Fellows in front of barndo at golden hour | Same pattern as above |

### OurTeamPage (1 image)

| Section | Image File | Description | Integration |
|---------|-----------|-------------|-------------|
| Hero background | `20250625_211417.jpg` | Evening fire pit circle with dramatic sky | Add `<img>` with `absolute inset-0 object-cover opacity-15` behind text, with gradient overlay `from-cream via-cream/80 to-cream/40` |

### StoriesPage (1 image)

| Section | Image File | Description | Integration |
|---------|-----------|-------------|-------------|
| Hero background | `20250821_111115.jpg` | Barn interior with Barndo concept posters, horse in doorway | Same hero background pattern with cream gradient overlay |

### GetInvolvedPage (4 images)

| Section | Image File | Description | Integration |
|---------|-----------|-------------|-------------|
| Hero background | `20250701_103935.jpg` | Crane/construction dramatic scene | Add behind gradient blobs with `absolute inset-0 object-cover opacity-20` |
| Apply card | `20250613_113437.jpg` | Two women at colorful post-it desk | Card header image in `aspect-video rounded-t-2xl overflow-hidden` |
| Attend card | `20250625_095430.jpg` | Classroom/learning session | Same card image pattern |
| Build card | `20250528_112822.jpg` | Team at construction workbench | Same card image pattern |

### ResourcesPage (1 image)

| Section | Image File | Description | Integration |
|---------|-----------|-------------|-------------|
| Hero background | `20250627_194318.jpg` | Horse trailer, red barn, rolling hills | Subtle hero background with cream gradient overlay |

## Technical Approach

### Image Processing Pipeline
1. Copy selected ~13 images from zip extract to `src/assets/photos/`
2. Convert to WebP using `cwebp` or sharp for optimal web performance
3. Resize: hero images to 1920px wide, card images to 800px wide, origin to 1000px
4. Import via Vite ES module imports (matching existing pattern)

### Integration Patterns

**Hero background pattern:**
```jsx
<section className="relative ...">
  <img src={heroImg} className="absolute inset-0 w-full h-full object-cover opacity-15" alt="" />
  <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
  {/* existing content */}
</section>
```

**Card header image pattern:**
```jsx
<div className="aspect-video rounded-t-2xl overflow-hidden mb-6">
  <img src={cardImg} className="w-full h-full object-cover" alt="..." />
</div>
```

**Origin section replacement:**
```jsx
<div className="reveal-scale aspect-square bg-charcoal/5 rounded-2xl overflow-hidden">
  <img src={originImg} className="w-full h-full object-cover" alt="..." />
</div>
```

### Existing CSS Animation Support
- `reveal-scale` — scale-up entrance for the origin image
- `image-reveal` + `is-revealed` — clip-path wipe animation available in globals.css
- `reveal-up`, `reveal-left`, `reveal-right` — directional reveals for any new image containers

## Files Changed

| File | Change |
|------|--------|
| `src/assets/photos/*.webp` | 13 new optimized images |
| `src/pages/OurMissionPage.jsx` | Add 6 images (origin, pull quote bg, mission column, 3 timeline cards) |
| `src/pages/OurTeamPage.jsx` | Add hero background image |
| `src/pages/StoriesPage.jsx` | Add hero background image |
| `src/pages/GetInvolvedPage.jsx` | Add hero background + 3 card images |
| `src/pages/ResourcesPage.jsx` | Add hero background image |
