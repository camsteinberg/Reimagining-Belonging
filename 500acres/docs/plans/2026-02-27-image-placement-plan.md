# Editorial Image Placement Implementation Plan

> **Status:** IMPLEMENTED | Completed 2026-02-27

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 13 fellowship photographs to 5 internal pages at high-impact locations, transforming the site from text-only to editorial photography.

**Architecture:** Process source JPGs into optimized WebP files in `src/assets/photos/`, then import them via Vite ES module imports into each page component. Three integration patterns: hero backgrounds (with gradient overlay), card header images, and inline editorial photos.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, `sips` for resize, `cwebp` for WebP conversion

---

### Task 1: Process and optimize all 13 images

**Files:**
- Create: `src/assets/photos/origin-classroom.webp`
- Create: `src/assets/photos/pullquote-barndo-storm.webp`
- Create: `src/assets/photos/mission-team-workbench.webp`
- Create: `src/assets/photos/timeline-research.webp`
- Create: `src/assets/photos/timeline-prototype.webp`
- Create: `src/assets/photos/timeline-deploy.webp`
- Create: `src/assets/photos/team-hero-firepit.webp`
- Create: `src/assets/photos/stories-hero-barn.webp`
- Create: `src/assets/photos/getinvolved-hero-crane.webp`
- Create: `src/assets/photos/card-apply.webp`
- Create: `src/assets/photos/card-attend.webp`
- Create: `src/assets/photos/card-build.webp`
- Create: `src/assets/photos/resources-hero-ranch.webp`

**Step 1: Create a processing script**

Source images are at `/tmp/barndos-images/Barndos Summer Fellowship/`. Use `sips` to resize, then `cwebp` to convert to WebP with quality 80.

Three size tiers:
- **Hero images** (1920px wide): team-hero-firepit, stories-hero-barn, getinvolved-hero-crane, resources-hero-ranch, pullquote-barndo-storm
- **Inline/origin images** (1200px wide): origin-classroom, mission-team-workbench
- **Card images** (800px wide): timeline-research, timeline-prototype, timeline-deploy, card-apply, card-attend, card-build

```bash
SRC="/tmp/barndos-images/Barndos Summer Fellowship"
DEST="/Users/camsteinberg/Reimagining-Belonging/500acres/src/assets/photos"
TMP="/tmp/img-processing"
mkdir -p "$TMP"

# Hero images (1920px wide)
declare -A HERO_IMAGES=(
  ["team-hero-firepit"]="20250625_211417.jpg"
  ["stories-hero-barn"]="20250821_111115.jpg"
  ["getinvolved-hero-crane"]="20250701_103935.jpg"
  ["resources-hero-ranch"]="20250627_194318.jpg"
  ["pullquote-barndo-storm"]="20250611_082700.jpg"
)

for name in "${!HERO_IMAGES[@]}"; do
  cp "$SRC/${HERO_IMAGES[$name]}" "$TMP/$name.jpg"
  sips --resampleWidth 1920 "$TMP/$name.jpg" --out "$TMP/$name.jpg"
  cwebp -q 80 "$TMP/$name.jpg" -o "$DEST/$name.webp"
done

# Inline images (1200px wide)
declare -A INLINE_IMAGES=(
  ["origin-classroom"]="20250625_095430.jpg"
  ["mission-team-workbench"]="20250528_112822.jpg"
)

for name in "${!INLINE_IMAGES[@]}"; do
  cp "$SRC/${INLINE_IMAGES[$name]}" "$TMP/$name.jpg"
  sips --resampleWidth 1200 "$TMP/$name.jpg" --out "$TMP/$name.jpg"
  cwebp -q 80 "$TMP/$name.jpg" -o "$DEST/$name.webp"
done

# Card images (800px wide)
declare -A CARD_IMAGES=(
  ["timeline-research"]="20250617_105424.jpg"
  ["timeline-prototype"]="20250701_103935.jpg"
  ["timeline-deploy"]="20250627_192241.jpg"
  ["card-apply"]="20250613_113437.jpg"
  ["card-attend"]="20250625_095430.jpg"
  ["card-build"]="20250528_112822.jpg"
)

for name in "${!CARD_IMAGES[@]}"; do
  cp "$SRC/${CARD_IMAGES[$name]}" "$TMP/$name.jpg"
  sips --resampleWidth 800 "$TMP/$name.jpg" --out "$TMP/$name.jpg"
  cwebp -q 80 "$TMP/$name.jpg" -o "$DEST/$name.webp"
done
```

**Step 2: Verify all 13 files created**

```bash
ls -la src/assets/photos/*.webp | wc -l
```
Expected: 13

**Step 3: Remove .gitkeep (no longer needed)**

```bash
rm src/assets/photos/.gitkeep
```

**Step 4: Commit**

```bash
git add src/assets/photos/
git commit -m "feat: add 13 optimized fellowship photos for editorial image placement"
```

---

### Task 2: Add 6 images to OurMissionPage

**Files:**
- Modify: `src/pages/OurMissionPage.jsx`

**Step 1: Add image imports at the top of the file**

After the existing imports (line 4, after `import Logo from ...`), add:

```jsx
import originClassroom from "../assets/photos/origin-classroom.webp";
import pullquoteBarndo from "../assets/photos/pullquote-barndo-storm.webp";
import missionWorkbench from "../assets/photos/mission-team-workbench.webp";
import timelineResearch from "../assets/photos/timeline-research.webp";
import timelinePrototype from "../assets/photos/timeline-prototype.webp";
import timelineDeploy from "../assets/photos/timeline-deploy.webp";
```

**Step 2: Add image to Mission left column**

In the Mission section, inside the `md:col-span-4 md:col-start-1` div (after the closing `</h2>` tag of the "Empty land becomes shelter" heading), add:

```jsx
<div className="reveal-left stagger-2 mt-10 aspect-[3/4] rounded-2xl overflow-hidden hidden md:block">
  <img src={missionWorkbench} alt="Fellowship team at construction workbench" className="w-full h-full object-cover" />
</div>
```

Note: `hidden md:block` hides it on mobile where the column stacks.

**Step 3: Add background image to Pull Quote section**

In the pull quote `<section>` (the one with `bg-charcoal diagonal-top diagonal-bottom`), add as the FIRST child inside the section, before the existing `<div className="absolute inset-0 opacity-5">`:

```jsx
<img src={pullquoteBarndo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
<div className="absolute inset-0 bg-charcoal/70" />
```

**Step 4: Add images to Timeline cards**

In the timeline section, each card currently starts with the step number `<span>`. Add an image BEFORE the step number span in each card. Modify the data array to include images:

Change the timeline map data to include an `image` field:
```jsx
{
  num: "01",
  title: "Research & Design",
  image: timelineResearch,
  // ... rest unchanged
},
{
  num: "02",
  title: "Prototype & Train",
  image: timelinePrototype,
  // ... rest unchanged
},
{
  num: "03",
  title: "Deploy & Scale",
  image: timelineDeploy,
  // ... rest unchanged
},
```

Then inside the `.map()` render, add before the step number `<span>`:
```jsx
<div className="w-full aspect-video rounded-xl overflow-hidden mb-8">
  <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
</div>
```

**Step 5: Replace Logo placeholder in Origin section**

In the Origin section, find:
```jsx
<Logo className="w-2/3 h-2/3" showText={true} />
```

Replace with:
```jsx
<img src={originClassroom} alt="Fellowship learning session in barn classroom" className="w-full h-full object-cover" />
```

**Step 6: Verify build**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build
```
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/pages/OurMissionPage.jsx
git commit -m "feat: add 6 editorial photos to OurMissionPage"
```

---

### Task 3: Add hero background to OurTeamPage

**Files:**
- Modify: `src/pages/OurTeamPage.jsx`

**Step 1: Add image import**

After the existing imports at the top, add:
```jsx
import teamHero from "../assets/photos/team-hero-firepit.webp";
```

**Step 2: Add hero background image and gradient overlay**

In the Hero `<section>` (the one with `min-h-[60vh]`), add as the FIRST children inside the section, before the decorative blob divs:

```jsx
<img src={teamHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
<div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
```

**Step 3: Verify build**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build
```

**Step 4: Commit**

```bash
git add src/pages/OurTeamPage.jsx
git commit -m "feat: add hero background photo to OurTeamPage"
```

---

### Task 4: Add hero background to StoriesPage

**Files:**
- Modify: `src/pages/StoriesPage.jsx`

**Step 1: Add image import**

After the existing imports, add:
```jsx
import storiesHero from "../assets/photos/stories-hero-barn.webp";
```

**Step 2: Add hero background and gradient**

In the Hero `<section>` (line 11, the one with `min-h-[85vh]`), add as the FIRST children, before the decorative blob div:

```jsx
<img src={storiesHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
<div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
```

**Step 3: Verify build and commit**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build
git add src/pages/StoriesPage.jsx
git commit -m "feat: add hero background photo to StoriesPage"
```

---

### Task 5: Add hero background and card images to GetInvolvedPage

**Files:**
- Modify: `src/pages/GetInvolvedPage.jsx`

**Step 1: Add image imports**

After the existing imports (line 3), add:
```jsx
import heroConstruction from "../assets/photos/getinvolved-hero-crane.webp";
import cardApply from "../assets/photos/card-apply.webp";
import cardAttend from "../assets/photos/card-attend.webp";
import cardBuild from "../assets/photos/card-build.webp";
```

**Step 2: Add `image` field to ENGAGEMENT_STEPS data**

Add an `image` property to each step object:
```jsx
{
  num: "01",
  title: "Apply",
  image: cardApply,
  // ... rest unchanged
},
{
  num: "02",
  title: "Attend",
  image: cardAttend,
  // ... rest unchanged
},
{
  num: "03",
  title: "Build",
  image: cardBuild,
  // ... rest unchanged
},
```

**Step 3: Add hero background image**

In the Hero `<section>` (line 76, `bg-charcoal`), add as the FIRST child, before the gradient blob divs:

```jsx
<img src={heroConstruction} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
```

Note: This page's hero already has a dark `bg-charcoal` background with blurred gradient blobs, so no additional overlay is needed — the charcoal bg + opacity-20 handles readability.

**Step 4: Add card header images**

In the `cardContent` JSX (around line 112-128), add an image div as the FIRST element inside the fragment, before the step number `<span>`:

```jsx
<div className="w-full aspect-video rounded-xl overflow-hidden mb-6">
  <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
</div>
```

**Step 5: Verify build and commit**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build
git add src/pages/GetInvolvedPage.jsx
git commit -m "feat: add hero background and card photos to GetInvolvedPage"
```

---

### Task 6: Add hero background to ResourcesPage

**Files:**
- Modify: `src/pages/ResourcesPage.jsx`

**Step 1: Add image import**

After the existing imports at the top, add:
```jsx
import resourcesHero from "../assets/photos/resources-hero-ranch.webp";
```

**Step 2: Find the hero section**

The hero section starts around line 163 with `<section className="relative min-h-[85vh]`. It has two decorative blob divs.

**Step 3: Add hero background and gradient**

Add as the FIRST children inside the hero section, before the blob divs:

```jsx
<img src={resourcesHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-12" />
<div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream/40" />
```

Note: Using `opacity-12` (slightly more subtle) since this is a utilitarian page.

**Step 4: Verify build and commit**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build
git add src/pages/ResourcesPage.jsx
git commit -m "feat: add hero background photo to ResourcesPage"
```

---

### Task 7: Final build verification and push

**Step 1: Full build check**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres && npm run build
```
Expected: Build succeeds

**Step 2: Check git status**

```bash
git status && git log --oneline -7
```
Expected: Clean working tree, 6 new commits for image processing + 5 page updates

**Step 3: Push**

```bash
git push
```
