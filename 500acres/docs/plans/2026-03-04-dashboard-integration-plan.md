# Dashboard Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge the 500 Acres public site (React+Vite) and BarndosDashboard (Next.js) into a single unified Next.js 15 application with authentication, custom analytics, and the Campfire design system.

**Architecture:** A single Next.js 15 App Router application using route groups: `(public)` for the marketing site, `(auth)` for login/register, and `(dashboard)` for protected admin pages. Public pages use GSAP for animations (via `'use client'`), dashboard pages use Framer Motion. Auth is JWT-based with PostgreSQL, extended with user approval workflow and a custom analytics module.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, GSAP 3, Framer Motion, Recharts, Mapbox GL + Deck.GL (public), Google Maps (dashboard), PostgreSQL (Neon serverless), bcryptjs, jose (JWT), Resend (email), MaxMind GeoLite2 (geo lookup), ua-parser-js (user agent parsing).

**Design Doc:** `docs/plans/2026-03-04-dashboard-integration-design.md`

---

## Phase 1: Project Scaffold & Dependencies

### Task 1: Clone dashboard and set up unified project structure

**Files:**
- Source: `git@github.com:aidanm20/BarndosDashboard.git`
- Modify: `dashboard/package.json`

**Step 1: Clone the dashboard repo into the 500acres workspace**

```bash
cd /Users/camsteinberg/Reimagining-Belonging/500acres
git clone git@github.com:aidanm20/BarndosDashboard.git /tmp/BarndosDashboard-source
```

**Step 2: Copy the dashboard app into a new working directory**

We'll build the unified app inside the existing 500acres repo. The dashboard `dashboard/` folder becomes our Next.js root.

```bash
# Create the unified app directory alongside the existing Vite app
cp -r /tmp/BarndosDashboard-source/dashboard ./unified
cp /tmp/BarndosDashboard-source/.env ./unified/.env.local
cp -r /tmp/BarndosDashboard-source/lib ./unified/lib-root
```

**Step 3: Install additional dependencies for public site features**

```bash
cd unified
npm install gsap @gsap/react mapbox-gl @deck.gl/layers @deck.gl/mapbox @deck.gl/react deck.gl ua-parser-js maxmind
npm install -D @types/ua-parser-js
```

**Step 4: Verify the dashboard still builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add unified/
git commit -m "scaffold: copy dashboard and install public site dependencies"
```

---

### Task 2: Create route group structure

**Files:**
- Create: `unified/app/(public)/layout.tsx`
- Create: `unified/app/(public)/page.tsx` (placeholder)
- Create: `unified/app/(auth)/layout.tsx`
- Move: `unified/app/login/` → `unified/app/(auth)/login/`
- Move: `unified/app/register/` → `unified/app/(auth)/register/`
- Move: `unified/app/forgot-password/` → `unified/app/(auth)/forgot-password/`
- Move: `unified/app/reset-password/` → `unified/app/(auth)/reset-password/`
- Create: `unified/app/(dashboard)/layout.tsx`
- Move: dashboard pages → `unified/app/(dashboard)/`
- Modify: `unified/middleware.ts`

**Step 1: Create the (public) route group with a placeholder layout**

```tsx
// unified/app/(public)/layout.tsx
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

```tsx
// unified/app/(public)/page.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">500 Acres — Coming Soon</h1>
    </div>
  );
}
```

**Step 2: Create the (auth) route group and move auth pages**

```tsx
// unified/app/(auth)/layout.tsx
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

```bash
mkdir -p unified/app/\(auth\)
mv unified/app/login unified/app/\(auth\)/login
mv unified/app/register unified/app/\(auth\)/register
mv unified/app/forgot-password unified/app/\(auth\)/forgot-password
mv unified/app/reset-password unified/app/\(auth\)/reset-password
```

**Step 3: Create the (dashboard) route group and move dashboard pages**

```tsx
// unified/app/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import { getSession } from '@/lib/getSession';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return <>{children}</>;
}
```

```bash
mkdir -p unified/app/\(dashboard\)
mv unified/app/dashboard unified/app/\(dashboard\)/dashboard
mv unified/app/till unified/app/\(dashboard\)/till
mv unified/app/barndobucks unified/app/\(dashboard\)/barndobucks
mv unified/app/buzz unified/app/\(dashboard\)/buzz
mv unified/app/fellowship unified/app/\(dashboard\)/fellowship
mv unified/app/fellowship-admin unified/app/\(dashboard\)/fellowship-admin
mv unified/app/governance unified/app/\(dashboard\)/governance
mv unified/app/realestate unified/app/\(dashboard\)/realestate
mv unified/app/account unified/app/\(dashboard\)/account
```

**Step 4: Update the root page to redirect**

The existing `app/page.tsx` currently redirects to login. Replace it so it renders the public homepage (from the `(public)` group).

```tsx
// unified/app/page.tsx — DELETE this file since (public)/page.tsx handles /
```

Actually, `(public)/page.tsx` will handle the `/` route, so remove the root `page.tsx`:

```bash
rm unified/app/page.tsx
```

**Step 5: Update middleware for new route structure**

The route groups are transparent to URLs — paths stay the same (`/dashboard`, `/till`, etc.). Update middleware to also skip `(public)` routes and handle `(auth)` routes correctly.

```typescript
// unified/middleware.ts — update PROTECTED_PREFIXES
// No changes needed — the URLs haven't changed, only the file structure.
// /dashboard, /till, /barndobucks, etc. still match the same prefixes.
```

**Step 6: Update the root layout**

The root `layout.tsx` currently wraps everything in `AppShell` with sidebar. We need the sidebar only for dashboard routes, not public or auth routes. Modify the root layout to be minimal, and move the AppShell into `(dashboard)/layout.tsx`.

```tsx
// unified/app/layout.tsx — simplified root layout
import type { Metadata } from 'next';
import { EB_Garamond, Inter } from 'next/font/google';
import './globals.css';

const ebGaramond = EB_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '500 Acres — Reimagining Belonging',
  description: 'Building community in nature. Helping Gen Z solve the housing crisis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

Update `(dashboard)/layout.tsx` to include the AppShell:

```tsx
// unified/app/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import { getSession } from '@/lib/getSession';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import AppShell from '@/components/AppShell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const rows = (await sql`
    SELECT phone FROM "User" WHERE id = ${session.userId} LIMIT 1
  `) as { phone: string | null }[];

  const sidebarProps = {
    username: session.username ?? session.email ?? 'Fellow',
    role: session.role ?? null,
    hasPhone: !!rows?.[0]?.phone,
  };

  return <AppShell sidebarProps={sidebarProps}>{children}</AppShell>;
}
```

**Step 7: Verify build**

```bash
cd unified && npm run build
```

Expected: Build succeeds. `/` shows placeholder. `/login` still works. `/dashboard` still works (with auth).

**Step 8: Commit**

```bash
git add -A
git commit -m "scaffold: create route groups (public), (auth), (dashboard)"
```

---

## Phase 2: Design System Merge

### Task 3: Merge Campfire design tokens into globals.css

**Files:**
- Source: `src/styles/globals.css` (Vite project — 2847 lines)
- Modify: `unified/app/globals.css`

**Step 1: Copy the Campfire @theme block and base styles**

Read the full `src/styles/globals.css` from the Vite project. Extract:
1. The `@theme { ... }` block with all Campfire color/font tokens
2. The `@layer base { ... }` reset and body styles
3. Custom cursor styles
4. Scroll progress bar styles
5. Loading screen styles
6. Page container utility
7. All reveal animation classes (`.reveal-up`, `.reveal-left`, etc.)
8. All hover utilities (`.hover-lift`, `.hover-image-scale`, etc.)
9. Button/card/link utilities (`.btn-pill`, `.story-card`, `.creative-link`)
10. Keyframe animations (`emberFloat`, `scoutDotBounce`, `marqueeScroll`, etc.)
11. Color role variables (primary text, surfaces, functional colors)
12. Spacing scale variables
13. Easing curve variables
14. Accessible focus states
15. Dropdown menu styles

Merge these INTO `unified/app/globals.css`, replacing the existing dashboard-only variables. Keep Tailwind's `@import "tailwindcss"` at the top.

The dashboard's existing CSS variables (e.g., `--color-canvas`, `--color-surface`, `--color-primary`) should be remapped to use Campfire tokens. Create a mapping:

```css
:root {
  /* ── Remap dashboard variables to Campfire palette ── */
  --color-canvas: var(--color-cream);
  --color-surface: var(--color-warm-white);
  --color-surface-subtle: #f0ebe0; /* cream tinted lighter */
  --color-surface-elevated: var(--color-starlight);
  --color-border-soft: rgba(42, 37, 32, 0.12); /* charcoal-based */
  --color-border-strong: rgba(42, 37, 32, 0.25);
  --color-primary: var(--color-ember);
  --color-primary-strong: var(--color-bark);
  --color-primary-soft: rgba(196, 93, 62, 0.15); /* ember at 15% */
  --color-muted: var(--color-smoke);
  --color-text: var(--color-charcoal);
  --color-text-muted: var(--color-smoke);
  --color-danger: #c45d3e; /* ember */
  --color-warning: var(--color-amber);

  /* Sidebar — Campfire dark variant */
  --surface-sidebar: var(--color-charcoal);
  --sidebar-border: rgba(245, 241, 234, 0.1); /* warm-white at 10% */
  --sidebar-active: rgba(245, 241, 234, 0.1);
  --sidebar-active-text: var(--color-warm-white);
  --sidebar-hover: rgba(245, 241, 234, 0.06);
  --sidebar-pill: var(--color-ember);
  --sidebar-muted: var(--color-smoke);
  --sidebar-cta-bg: var(--color-ember);
  --sidebar-cta-text: var(--color-warm-white);
  --sidebar-logout-bg: rgba(245, 241, 234, 0.06);
  --sidebar-logout-hover: rgba(245, 241, 234, 0.12);
  --surface-card-shadow: 0 22px 48px -32px rgba(42, 37, 32, 0.18);
}
```

**Step 2: Add Google Fonts to root layout**

The Vite project loads Playfair Display via `<link>` in `index.html`. Add it to the Next.js font imports:

```tsx
// In unified/app/layout.tsx, add Playfair Display:
import { EB_Garamond, Inter, Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});
// Add playfair.variable to body className
```

**Step 3: Verify build and visual check**

```bash
cd unified && npm run dev
```

Open the login page and verify it now uses the Campfire palette (cream background, ember accent, charcoal text, EB Garamond headings).

**Step 4: Commit**

```bash
git add -A
git commit -m "design: merge Campfire design tokens into globals.css"
```

---

### Task 4: Update dashboard Sidebar to Campfire palette

**Files:**
- Modify: `unified/components/Sidebar.tsx`

**Step 1: Read the current Sidebar component**

Read `unified/components/Sidebar.tsx` to understand its structure.

**Step 2: Update Sidebar to use Campfire dark theme**

The sidebar should use `charcoal` background with `warm-white` text. The CSS variables were already remapped in Task 3, so the Sidebar should automatically pick up the new palette. Verify and adjust if any hardcoded colors exist.

Key visual changes:
- Background: charcoal (`#2a2520`)
- Text: warm-white (`#f5f1ea`)
- Active item: warm-white at 10% opacity
- Hover: warm-white at 6% opacity
- CTA button: ember (`#c45d3e`)
- Logo text: "500 Acres" in serif font instead of "500AcresOS" in sans

**Step 3: Update the AppShell mobile header**

In `components/AppShell.tsx`, update the mobile header bar text from "500AcresOS" to "500 Acres" with serif font:

```tsx
<span className="text-lg font-serif font-bold">
  500 Acres
</span>
```

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "design: update sidebar and shell to Campfire palette"
```

---

## Phase 3: Authentication Enhancements

### Task 5: Add status column to User table

**Files:**
- Create: `unified/scripts/add-user-status.sql`
- Modify: `unified/lib/auth.ts`

**Step 1: Write the migration SQL**

```sql
-- scripts/add-user-status.sql
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('pending', 'active', 'suspended'));

-- Ensure all existing users are active
UPDATE "User" SET status = 'active' WHERE status IS NULL;
```

**Step 2: Run the migration**

```bash
# Using the DATABASE_URL from .env.local
source unified/.env.local
psql "$DATABASE_URL" -f unified/scripts/add-user-status.sql
```

**Step 3: Update SessionPayload type to include status**

```typescript
// unified/lib/auth.ts — add status to SessionPayload
export type SessionPayload = {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string; // 'pending' | 'active' | 'suspended'
};
```

**Step 4: Commit**

```bash
git add -A
git commit -m "auth: add status column to User table"
```

---

### Task 6: Update login route to check user status

**Files:**
- Modify: `unified/app/api/login/route.ts`

**Step 1: Update the SQL query to include status**

In the login route, add `status` to the SELECT clause:

```typescript
type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  password: string;
  role: string | null;
  status: string | null; // NEW
};
```

Update all three SQL queries (email, phone, username) to include `status`:

```sql
SELECT id, email, username, phone, password, role, status
FROM "User"
WHERE ...
```

**Step 2: Add status checks after password verification**

After `const ok = await bcrypt.compare(password, user.password);` and the `!ok` check, add:

```typescript
// Check account status
if (user.status === 'pending') {
  return NextResponse.json(
    { success: false, message: 'Your account is awaiting admin approval. You\'ll receive an email when approved.' },
    { status: 403 }
  );
}

if (user.status === 'suspended') {
  return NextResponse.json(
    { success: false, message: 'Your account has been suspended. Contact an administrator.' },
    { status: 403 }
  );
}
```

**Step 3: Include status in JWT payload**

```typescript
const { token, maxAge } = await signSession(
  {
    userId: String(user.id),
    username: user.username ?? '',
    email: user.email ?? undefined,
    role: user.role ?? undefined,
    status: user.status ?? 'active', // NEW
  },
  !!remember
);
```

**Step 4: Verify login still works**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "auth: check user status on login, block pending/suspended accounts"
```

---

### Task 7: Update registration to create users with pending status

**Files:**
- Modify: `unified/app/api/register/route.ts`
- Modify: `unified/lib/mail.ts`

**Step 1: Update the INSERT to set status = 'pending'**

In `unified/app/api/register/route.ts`, modify the INSERT statement:

```typescript
const rows = (await sql`
  INSERT INTO "User" (username, email, phone, password, role, status, "createdAt")
  VALUES (${uname}, ${mail}, ${phoneNorm}, ${hash}, ${roleToSave}, 'pending', NOW())
  RETURNING id
`) as IdRow[];
```

**Step 2: Send admin notification email**

After the INSERT, add:

```typescript
// Notify admins of new registration
try {
  const { sendSystemEmail } = await import('@/lib/mail');
  const adminEmails = process.env.MONEY_TEAM_EMAILS?.split(',') ?? [];
  if (adminEmails.length > 0) {
    await sendSystemEmail(
      adminEmails,
      `New account registration: ${uname}`,
      `<p>A new account has been created and needs approval:</p>
       <ul>
         <li><strong>Username:</strong> ${uname}</li>
         <li><strong>Email:</strong> ${mail}</li>
         <li><strong>Role requested:</strong> ${roleToSave}</li>
       </ul>
       <p>Visit the dashboard to approve or reject this account.</p>`
    );
  }
} catch (emailErr) {
  console.error('Failed to send admin notification:', emailErr);
  // Don't fail registration if email fails
}
```

**Step 3: Update the success response message**

```typescript
return NextResponse.json({
  success: true,
  message: 'Account created! An admin will review your request. You\'ll receive an email when approved.',
  userId: rows[0].id,
});
```

**Step 4: Commit**

```bash
git add -A
git commit -m "auth: registration creates pending users with admin notification"
```

---

### Task 8: Build admin user management API

**Files:**
- Create: `unified/app/api/admin/users/route.ts`

**Step 1: Create the user management endpoint**

```typescript
// unified/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';
import sql from '@/lib/db';
import { sendSystemEmail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserRow = {
  id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  createdAt: string;
};

// GET /api/admin/users — list all users (admin only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const statusFilter = req.nextUrl.searchParams.get('status');
  let users: UserRow[];

  if (statusFilter) {
    users = (await sql`
      SELECT id, username, email, role, status, "createdAt"
      FROM "User"
      WHERE status = ${statusFilter}
      ORDER BY "createdAt" DESC
    `) as UserRow[];
  } else {
    users = (await sql`
      SELECT id, username, email, role, status, "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `) as UserRow[];
  }

  return NextResponse.json({ users });
}

// PUT /api/admin/users — update user status or role (admin only)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, status, role } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Get current user info for email notification
  const current = (await sql`
    SELECT email, username, status as old_status FROM "User" WHERE id = ${userId} LIMIT 1
  `) as { email: string; username: string; old_status: string }[];

  if (current.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updates: string[] = [];

  if (status && ['pending', 'active', 'suspended'].includes(status)) {
    await sql`UPDATE "User" SET status = ${status} WHERE id = ${userId}`;
    updates.push(`status → ${status}`);

    // Send email notification on status change
    const user = current[0];
    if (user.email) {
      try {
        if (status === 'active' && user.old_status === 'pending') {
          await sendSystemEmail(
            user.email,
            'Your 500 Acres account has been approved!',
            `<p>Hi ${user.username},</p>
             <p>Your account has been approved. You can now sign in at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://habitable.us'}/login">habitable.us/login</a>.</p>
             <p>Welcome to 500 Acres!</p>`
          );
        } else if (status === 'suspended') {
          await sendSystemEmail(
            user.email,
            'Your 500 Acres account has been suspended',
            `<p>Hi ${user.username},</p>
             <p>Your account has been suspended. If you believe this is an error, please contact an administrator.</p>`
          );
        }
      } catch (emailErr) {
        console.error('Failed to send status change email:', emailErr);
      }
    }
  }

  if (role && ['admin', 'fellow'].includes(role)) {
    await sql`UPDATE "User" SET role = ${role} WHERE id = ${userId}`;
    updates.push(`role → ${role}`);
  }

  return NextResponse.json({ success: true, updates });
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "auth: add admin user management API endpoint"
```

---

### Task 9: Build admin user management UI

**Files:**
- Create: `unified/app/(dashboard)/users/page.tsx`
- Create: `unified/app/(dashboard)/users/UserManagement.tsx`

**Step 1: Create the server page wrapper**

```tsx
// unified/app/(dashboard)/users/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import UserManagement from './UserManagement';

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/users');
  if (session.role !== 'admin') redirect('/dashboard');

  return <UserManagement />;
}
```

**Step 2: Create the client component**

Build a `UserManagement.tsx` client component that:
- Fetches users from `GET /api/admin/users`
- Shows a status filter (All / Pending / Active / Suspended) with pending count badge
- Displays a table with columns: Username, Email, Role, Status, Created, Actions
- Actions: Approve (for pending), Suspend, Change Role dropdown
- Calls `PUT /api/admin/users` on action click
- Shows success/error toast feedback

The component should use the existing `SurfaceCard` component for layout consistency and follow the dashboard's existing patterns (e.g., `BuzzDashboard`, `GovernanceDashboard`).

**Step 3: Add Users link to Sidebar**

Update the Sidebar component to include a "Users" link (admin only) with a badge showing pending user count.

**Step 4: Update middleware to protect /users**

Add `/users` to `PROTECTED_PREFIXES` in `middleware.ts`.

**Step 5: Verify build**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "auth: add admin user management page with approval workflow"
```

---

### Task 10: Update middleware to check user status

**Files:**
- Modify: `unified/middleware.ts`

**Step 1: Add status check to middleware**

After verifying the JWT, check that the user's status is `'active'`:

```typescript
try {
  const session = await verifySession(token);

  // Block non-active users from protected routes
  if (session.status && session.status !== 'active') {
    const url = new URL('/login', req.url);
    url.searchParams.set('status', session.status as string);
    // Clear the invalid session cookie
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // ... rest of existing middleware logic
```

**Step 2: Update LoginForm to show status messages**

In `LoginForm.tsx`, check for a `status` query param and show appropriate messages:
- `?status=pending` → "Your account is awaiting approval."
- `?status=suspended` → "Your account has been suspended."

**Step 3: Commit**

```bash
git add -A
git commit -m "auth: middleware blocks non-active users, shows status messages"
```

---

## Phase 4: Public Pages Migration

### Task 11: Migrate static data and assets

**Files:**
- Copy: `src/data/` → `unified/data/`
- Copy: `src/assets/` → `unified/public/` and `unified/assets/`
- Copy: `public/data/` → `unified/public/data/`

**Step 1: Copy data files**

```bash
mkdir -p unified/data
cp src/data/participants.js unified/data/participants.ts
cp src/data/slides.js unified/data/slides.ts
cp src/data/mapConfig.js unified/data/mapConfig.ts
```

Convert JS files to TS by adding type annotations. For `mapConfig.ts`, update the env var:

```typescript
// unified/data/mapConfig.ts
export const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiYWlkYW5taWxsZXIxMDAiLCJhIjoiY21rZ215MXR5MDl3ZzNmcHBrNjF4OTRtbiJ9.dB524Fvwi53kzAZzo6CqTQ";
```

**Step 2: Copy image assets**

```bash
# Copy images to Next.js public directory for static serving
cp -r src/assets/images unified/public/images
cp -r src/assets/headshots unified/public/headshots
cp -r src/assets/photos unified/public/photos
cp -r src/assets/logos unified/public/logos
cp -r src/assets/svg unified/public/svg
cp -r src/assets/brand unified/public/brand

# Copy GeoJSON data files
cp -r public/data unified/public/data
```

**Step 3: Copy asset source files for Next.js imports**

For images referenced via `import` in components (like slides.js), we need them in the source tree:

```bash
cp -r src/assets unified/assets
```

**Step 4: Update Next.js config to handle image imports**

Verify `next.config.ts` allows importing images from `assets/` directory. Next.js handles this natively.

**Step 5: Commit**

```bash
git add -A
git commit -m "migrate: copy data files, images, and assets from Vite project"
```

---

### Task 12: Migrate the useReveal hook

**Files:**
- Create: `unified/hooks/useReveal.ts`

**Step 1: Port the hook to TypeScript with 'use client'**

```typescript
// unified/hooks/useReveal.ts
'use client';

import { useEffect, useRef } from 'react';

/**
 * IntersectionObserver hook that adds 'is-revealed' class
 * to elements with reveal-* or image-reveal classes.
 */
export default function useReveal(rootMargin = '-60px') {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll(
      '.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade, .reveal-clip-up, .image-reveal'
    );

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [rootMargin]);

  return containerRef;
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "migrate: port useReveal hook to TypeScript"
```

---

### Task 13: Migrate shared components (Logo, PageHero, SectionHeader, etc.)

**Files:**
- Create: `unified/components/public/shared/Logo.tsx`
- Create: `unified/components/public/shared/PageHero.tsx`
- Create: `unified/components/public/shared/SectionHeader.tsx`
- Create: `unified/components/public/shared/SectionDivider.tsx`
- Create: `unified/components/public/shared/CTABand.tsx`
- Create: `unified/components/public/shared/PullQuote.tsx`
- Create: `unified/components/public/shared/Breadcrumbs.tsx`
- Create: `unified/components/public/shared/ScrollProgress.tsx`
- Create: `unified/components/public/shared/CustomCursor.tsx`
- Create: `unified/components/public/shared/LoadingScreen.tsx`
- Create: `unified/components/public/shared/ErrorBoundary.tsx`
- Create: `unified/components/public/shared/Modal.tsx`

**Step 1: Create the components directory**

```bash
mkdir -p unified/components/public/shared
```

**Step 2: Port each component**

For each component in `src/components/shared/`:
1. Read the original `.jsx` file
2. Add `'use client'` directive at top
3. Replace `react-router-dom` imports with `next/link` and `next/navigation`
4. Replace `<Link to=` with `<Link href=`
5. Replace `useNavigate()` with `useRouter()` from `next/navigation`
6. Replace `useLocation()` with `usePathname()` from `next/navigation`
7. Replace `useParams()` with the `params` prop from Next.js page components
8. Update image imports to use Next.js `Image` component or `/public` paths
9. Add basic TypeScript types for props
10. Save as `.tsx`

The components are mostly self-contained React + CSS, so minimal changes are needed beyond the router swap.

**Step 3: Verify no import errors**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add -A
git commit -m "migrate: port shared components to Next.js"
```

---

### Task 14: Migrate Navbar with Login button

**Files:**
- Create: `unified/components/public/layout/Navbar.tsx`

**Step 1: Port the Navbar**

This is the most complex component migration. Key changes:

1. Add `'use client'` directive
2. Replace all `react-router-dom` imports:
   - `Link` → `next/link` (change `to=` → `href=`)
   - `useLocation()` → `usePathname()` from `next/navigation`
   - `useNavigate()` → `useRouter()` from `next/navigation`
3. Add a "Login" button at the end of both `STICKY_NAV_LINKS` and `NAV_LINKS`:

For sticky nav:
```typescript
{ to: '/login', label: 'Login' }
```

For overlay menu, add as the last item:
```typescript
{ to: '/login', label: 'Login', num: '06' }
```

4. Add auth state detection — check for session cookie to toggle Login/Avatar:

```typescript
// At top of Navbar component, add auth state
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  // Check if session cookie exists (client-side check)
  const hasSession = document.cookie.includes('session=');
  setIsLoggedIn(hasSession);
}, []);
```

When `isLoggedIn`, render a user dropdown instead of "Login" in the sticky nav:
```tsx
{isLoggedIn ? (
  <div className="relative">
    <button>Dashboard ▾</button>
    {/* Dropdown: Dashboard, Account, Logout */}
  </div>
) : (
  <Link href="/login">Login</Link>
)}
```

5. Fix the `handleNavClick` function to use Next.js router:
```typescript
const router = useRouter();
// Replace navigate(to) with router.push(to)
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "migrate: port Navbar with Login button and auth state"
```

---

### Task 15: Migrate Footer

**Files:**
- Create: `unified/components/public/layout/Footer.tsx`

**Step 1: Port the Footer**

1. Add `'use client'`
2. Replace `Link` imports (`react-router-dom` → `next/link`, `to=` → `href=`)
3. Newsletter form — connect to a future API endpoint (or keep client-only for now)
4. Add TypeScript types

**Step 2: Commit**

```bash
git add -A
git commit -m "migrate: port Footer to Next.js"
```

---

### Task 16: Migrate all 16 homepage section components

**Files:**
- Create: `unified/components/public/homepage/HeroLanding.tsx`
- Create: `unified/components/public/homepage/BackgroundCrossfade.tsx`
- Create: `unified/components/public/homepage/PhoneOverlay.tsx`
- Create: `unified/components/public/homepage/ScrollText.tsx`
- Create: `unified/components/public/homepage/ZoomTransition.tsx`
- Create: `unified/components/public/homepage/StatisticsBlock.tsx`
- Create: `unified/components/public/homepage/InitialMap.tsx`
- Create: `unified/components/public/homepage/MigrationMap.tsx`
- Create: `unified/components/public/homepage/BelongingReveal.tsx`
- Create: `unified/components/public/homepage/BelongingFramework.tsx`
- Create: `unified/components/public/homepage/ParticipantDrawings.tsx`
- Create: `unified/components/public/homepage/MeaningToReality.tsx`
- Create: `unified/components/public/homepage/ParticipantStories.tsx`
- Create: `unified/components/public/homepage/IdealHomes.tsx`
- Create: `unified/components/public/homepage/ClosingSequence.tsx`
- Create: `unified/components/public/homepage/FinalSlide.tsx`

**Step 1: Create the directory**

```bash
mkdir -p unified/components/public/homepage
```

**Step 2: Port each component**

For each component in `src/components/homepage/`:
1. Read the original `.jsx`
2. Add `'use client'` (all use GSAP/browser APIs)
3. Update any image imports to use `/public` paths or Next.js `Image`
4. Update data imports to point to `@/data/` instead of `../data/`
5. Replace any `react-router-dom` usage with Next.js equivalents
6. Add basic TypeScript props types
7. Keep GSAP/ScrollTrigger logic exactly as-is — it works the same in Next.js client components

**Step 3: Special handling for map components**

`InitialMap.tsx` and `MigrationMap.tsx` use Mapbox GL and Deck.GL. These must:
- Use dynamic imports with `ssr: false` to avoid server-side rendering issues:

```typescript
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponentInner'), { ssr: false });
```

Or wrap the component:
```tsx
'use client';
import { useEffect, useState } from 'react';

export default function InitialMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-screen" />; // placeholder
  // ... rest of map logic
}
```

**Step 4: Verify imports resolve**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add -A
git commit -m "migrate: port all 16 homepage section components"
```

---

### Task 17: Build the public homepage route

**Files:**
- Modify: `unified/app/(public)/page.tsx`
- Modify: `unified/app/(public)/layout.tsx`

**Step 1: Create the public layout with Navbar and Footer**

```tsx
// unified/app/(public)/layout.tsx
'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/public/layout/Navbar';
import Footer from '@/components/public/layout/Footer';
import ScrollProgress from '@/components/public/shared/ScrollProgress';
import CustomCursor from '@/components/public/shared/CustomCursor';

export default function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[300] focus:bg-charcoal focus:text-cream focus:px-6 focus:py-3 focus:rounded-full focus:font-sans focus:text-sm">
        Skip to content
      </a>
      <Navbar isHomepage={isHomepage} />
      <main id="main-content">
        {children}
      </main>
      {!isHomepage && <Footer />}
    </>
  );
}
```

**Step 2: Build the homepage page component**

Port `src/pages/HomePage.jsx` to `unified/app/(public)/page.tsx`:

```tsx
// unified/app/(public)/page.tsx
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroLanding from '@/components/public/homepage/HeroLanding';
import BackgroundCrossfade from '@/components/public/homepage/BackgroundCrossfade';
// ... import all 16 components
import LoadingScreen from '@/components/public/shared/LoadingScreen';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  // Port the exact logic from src/pages/HomePage.jsx
  // ...
}
```

**Step 3: Add loading screen to homepage only**

The `LoadingScreen` component should show on the homepage. Include it in the page component (not the layout) since it's homepage-specific.

**Step 4: Verify the homepage renders**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Loading screen appears
- Hero landing renders
- Scroll sections work
- GSAP animations trigger
- Maps render (Mapbox/Deck.GL)

**Step 5: Commit**

```bash
git add -A
git commit -m "migrate: build public homepage with all scroll sections"
```

---

### Task 18: Migrate inner pages (About, Stories, Resources, Get Involved)

**Files:**
- Create: `unified/app/(public)/about/page.tsx`
- Create: `unified/app/(public)/about/mission/page.tsx`
- Create: `unified/app/(public)/about/team/page.tsx`
- Create: `unified/app/(public)/about/sponsors/page.tsx`
- Create: `unified/app/(public)/about/white-paper/page.tsx`
- Create: `unified/app/(public)/stories/page.tsx`
- Create: `unified/app/(public)/stories/[slug]/page.tsx`
- Create: `unified/app/(public)/resources/page.tsx`
- Create: `unified/app/(public)/get-involved/page.tsx`

**Step 1: Port each inner page**

For each page in `src/pages/`:
1. Read the original `.jsx`
2. Add `'use client'`
3. Replace router imports
4. Replace `useParams()` with Next.js page `params` prop for dynamic routes:

```tsx
// unified/app/(public)/stories/[slug]/page.tsx
'use client';

import { useParams } from 'next/navigation';
// Port StoryDetailPage logic, using useParams() to get slug
```

5. Update data imports to `@/data/`
6. Update image paths
7. Save as `.tsx`

**Step 2: Verify all routes render**

```bash
npm run dev
```

Test each URL:
- `/about`
- `/about/mission`
- `/about/team`
- `/about/sponsors`
- `/about/white-paper`
- `/stories`
- `/stories/sherry` (dynamic route)
- `/resources`
- `/get-involved`

**Step 3: Commit**

```bash
git add -A
git commit -m "migrate: port all inner pages (about, stories, resources, get-involved)"
```

---

## Phase 5: Analytics Module

### Task 19: Create analytics database table

**Files:**
- Create: `unified/scripts/create-analytics-table.sql`

**Step 1: Write the migration**

```sql
-- scripts/create-analytics-table.sql
CREATE TABLE IF NOT EXISTS analytics_events (
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

CREATE INDEX IF NOT EXISTS idx_analytics_path ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
```

**Step 2: Run the migration**

```bash
source unified/.env.local
psql "$DATABASE_URL" -f unified/scripts/create-analytics-table.sql
```

**Step 3: Commit**

```bash
git add -A
git commit -m "analytics: create analytics_events table"
```

---

### Task 20: Build analytics event collection API

**Files:**
- Create: `unified/app/api/analytics/event/route.ts`
- Create: `unified/lib/analytics.ts`

**Step 1: Create the analytics lib**

```typescript
// unified/lib/analytics.ts
import sql from '@/lib/db';

export async function recordEvent(event: {
  sessionId: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  screenW?: number;
  screenH?: number;
  eventType?: string;
  durationMs?: number;
}) {
  await sql`
    INSERT INTO analytics_events (session_id, path, referrer, user_agent, country, region, screen_w, screen_h, event_type, duration_ms)
    VALUES (
      ${event.sessionId},
      ${event.path},
      ${event.referrer ?? null},
      ${event.userAgent ?? null},
      ${event.country ?? null},
      ${event.region ?? null},
      ${event.screenW ?? null},
      ${event.screenH ?? null},
      ${event.eventType ?? 'pageview'},
      ${event.durationMs ?? null}
    )
  `;
}
```

**Step 2: Create the event collection endpoint**

```typescript
// unified/app/api/analytics/event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { recordEvent } from '@/lib/analytics';
import UAParser from 'ua-parser-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter (per IP, 10 req/sec)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await req.json();
    const { sessionId, path, referrer, screenW, screenH, eventType, durationMs } = body;

    if (!sessionId || !path) {
      return NextResponse.json({ error: 'sessionId and path required' }, { status: 400 });
    }

    // Parse user agent
    const uaString = req.headers.get('user-agent') || '';
    const parser = new UAParser(uaString);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const uaSummary = `${browser.name || 'Unknown'}/${browser.version || '?'} ${os.name || ''}/${os.version || ''} ${device.type || 'desktop'}`;

    // Geo lookup (simplified — use IP-based geo service or MaxMind)
    // For now, store null. We'll add geo lookup in a follow-up task.
    const country = null;
    const region = null;

    await recordEvent({
      sessionId,
      path,
      referrer: referrer || null,
      userAgent: uaSummary,
      country,
      region,
      screenW: screenW ? Number(screenW) : null,
      screenH: screenH ? Number(screenH) : null,
      eventType: eventType || 'pageview',
      durationMs: durationMs ? Number(durationMs) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Analytics event error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "analytics: build event collection API with rate limiting"
```

---

### Task 21: Build client-side analytics tracker hook

**Files:**
- Create: `unified/hooks/useAnalytics.ts`

**Step 1: Create the tracker hook**

```typescript
// unified/hooks/useAnalytics.ts
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('_a_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('_a_sid', id);
  }
  return id;
}

export default function useAnalytics() {
  const pathname = usePathname();
  const startTime = useRef(Date.now());
  const lastPath = useRef('');

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    // Send duration for previous page
    if (lastPath.current && lastPath.current !== pathname) {
      const duration = Date.now() - startTime.current;
      navigator.sendBeacon(
        '/api/analytics/event',
        JSON.stringify({
          sessionId,
          path: lastPath.current,
          eventType: 'session_end',
          durationMs: duration,
        })
      );
    }

    // Record new pageview
    startTime.current = Date.now();
    lastPath.current = pathname;

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        path: pathname,
        referrer: document.referrer || null,
        screenW: window.innerWidth,
        screenH: window.innerHeight,
        eventType: 'pageview',
      }),
    }).catch(() => {
      // Silently fail — analytics should never break the site
    });

    // Send duration on page unload
    const handleUnload = () => {
      const duration = Date.now() - startTime.current;
      navigator.sendBeacon(
        '/api/analytics/event',
        JSON.stringify({
          sessionId,
          path: pathname,
          eventType: 'session_end',
          durationMs: duration,
        })
      );
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pathname]);
}
```

**Step 2: Add the hook to the public layout**

In `unified/app/(public)/layout.tsx`, add:

```tsx
import useAnalytics from '@/hooks/useAnalytics';

export default function PublicLayout({ children }: { children: ReactNode }) {
  useAnalytics(); // Track page views on all public pages
  // ... rest of layout
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "analytics: build client-side tracker hook and wire to public layout"
```

---

### Task 22: Build analytics report API

**Files:**
- Create: `unified/app/api/analytics/report/route.ts`
- Create: `unified/app/api/analytics/realtime/route.ts`

**Step 1: Create the report endpoint**

```typescript
// unified/app/api/analytics/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';
import sql from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const period = req.nextUrl.searchParams.get('period') || '7d';
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;

  // Total pageviews
  const [{ count: totalPageviews }] = await sql`
    SELECT COUNT(*) as count FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
  ` as { count: number }[];

  // Unique sessions
  const [{ count: uniqueVisitors }] = await sql`
    SELECT COUNT(DISTINCT session_id) as count FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
  ` as { count: number }[];

  // Average session duration
  const [{ avg_duration }] = await sql`
    SELECT AVG(duration_ms) as avg_duration FROM analytics_events
    WHERE event_type = 'session_end' AND duration_ms IS NOT NULL
    AND created_at > NOW() - INTERVAL '${days} days'
  ` as { avg_duration: number | null }[];

  // Bounce rate (sessions with only one pageview)
  const bounceData = await sql`
    WITH session_counts AS (
      SELECT session_id, COUNT(*) as pageviews
      FROM analytics_events
      WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY session_id
    )
    SELECT
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE pageviews = 1) as bounce_sessions
    FROM session_counts
  ` as { total_sessions: number; bounce_sessions: number }[];

  // Top pages
  const topPages = await sql`
    SELECT path, COUNT(*) as views
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10
  ` as { path: string; views: number }[];

  // Referral sources
  const referrers = await sql`
    SELECT
      CASE
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        ELSE referrer
      END as source,
      COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY source
    ORDER BY count DESC
    LIMIT 10
  ` as { source: string; count: number }[];

  // Device breakdown (parsed from user_agent)
  const devices = await sql`
    SELECT
      CASE
        WHEN user_agent LIKE '%mobile%' THEN 'Mobile'
        WHEN user_agent LIKE '%tablet%' THEN 'Tablet'
        ELSE 'Desktop'
      END as device_type,
      COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY device_type
    ORDER BY count DESC
  ` as { device_type: string; count: number }[];

  // Pageviews over time (daily)
  const dailyViews = await sql`
    SELECT DATE(created_at) as date, COUNT(*) as views
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date
  ` as { date: string; views: number }[];

  // Geography (top countries)
  const geography = await sql`
    SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY country
    ORDER BY count DESC
    LIMIT 10
  ` as { country: string; count: number }[];

  const bounce = bounceData[0];
  const bounceRate = bounce.total_sessions > 0
    ? Math.round((bounce.bounce_sessions / bounce.total_sessions) * 100)
    : 0;

  return NextResponse.json({
    period: `${days}d`,
    totalPageviews: Number(totalPageviews),
    uniqueVisitors: Number(uniqueVisitors),
    avgDurationMs: avg_duration ? Math.round(Number(avg_duration)) : null,
    bounceRate,
    topPages,
    referrers,
    devices,
    dailyViews,
    geography,
  });
}
```

**Step 2: Create the real-time endpoint**

```typescript
// unified/app/api/analytics/realtime/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';
import sql from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Active sessions in last 5 minutes
  const active = await sql`
    SELECT DISTINCT ON (session_id) session_id, path, created_at
    FROM analytics_events
    WHERE created_at > NOW() - INTERVAL '5 minutes'
    ORDER BY session_id, created_at DESC
  ` as { session_id: string; path: string; created_at: string }[];

  return NextResponse.json({
    activeVisitors: active.length,
    currentPages: active.map((a) => ({ sessionId: a.session_id, path: a.path })),
  });
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "analytics: build report and realtime API endpoints"
```

---

### Task 23: Build analytics dashboard UI

**Files:**
- Create: `unified/app/(dashboard)/analytics/page.tsx`
- Create: `unified/app/(dashboard)/analytics/AnalyticsDashboard.tsx`

**Step 1: Create the server page wrapper**

```tsx
// unified/app/(dashboard)/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import AnalyticsDashboard from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/analytics');
  if (session.role !== 'admin') redirect('/dashboard');

  return <AnalyticsDashboard />;
}
```

**Step 2: Build the analytics dashboard client component**

Create `AnalyticsDashboard.tsx` with:
- Period selector (7d / 30d / 90d buttons)
- Stat cards row: Total Pageviews, Unique Visitors, Avg Duration, Bounce Rate
- Area chart: Daily pageviews (Recharts `AreaChart`)
- Two-column grid:
  - Top Pages table (path + view count)
  - Referral Sources table (source + count)
- Two-column grid:
  - Device breakdown (donut chart or simple bars)
  - Geography table (country + count)
- Real-time section: active visitor count + current pages (polled every 30s)

Use the existing `SurfaceCard` component for all cards. Use Recharts (already installed) for charts. Follow the pattern established by `BuzzDashboard` and `TillDashboard`.

Use Campfire palette colors for charts:
```typescript
const CHART_COLORS = ['#c45d3e', '#b89f65', '#3d6b4f', '#6b8f71', '#3a5a6e', '#8b5e3c', '#d4a84b'];
```

**Step 3: Add Analytics link to Sidebar**

Update the Sidebar component to include an "Analytics" link (admin only).

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "analytics: build analytics dashboard UI with charts and realtime"
```

---

## Phase 6: Dashboard Visual Refresh

### Task 24: Apply Campfire palette to existing dashboard pages

**Files:**
- Modify: `unified/app/(dashboard)/*/Dashboard.tsx` (all dashboard client components)
- Modify: `unified/components/fellowship/*.tsx`
- Modify: `unified/components/ui/SurfaceCard.tsx`

**Step 1: Update SurfaceCard to use Campfire surface tokens**

The CSS variable remapping in Task 3 should handle most of this automatically. Verify that `SurfaceCard` renders with cream/warm-white surfaces instead of white.

**Step 2: Update chart colors across all dashboards**

In each dashboard that uses Recharts (`TillDashboard`, `BuzzDashboard`, `BudgetChart`, etc.), update the color arrays to use Campfire tokens:

```typescript
// Before
const COLORS = ['#48c58a', '#3b82f6', '#f59e0b', ...];

// After — Campfire palette
const COLORS = ['#c45d3e', '#b89f65', '#3d6b4f', '#6b8f71', '#3a5a6e', '#d4a84b', '#8b5e3c'];
```

**Step 3: Update hardcoded colors in dashboard components**

Search for any hardcoded hex colors (e.g., `#48c58a`, `text-green-*`, `bg-blue-*`) in dashboard components and replace with Campfire equivalents:

| Old | New |
|-----|-----|
| Green (`#48c58a`, `green-*`) | Sage (`#6b8f71`) or Forest (`#3d6b4f`) |
| Blue (`#3b82f6`, `blue-*`) | Navy (`#3a5a6e`) |
| Yellow (`#fbbf24`, `yellow-*`) | Gold (`#b89f65`) or Amber (`#d4a84b`) |
| Red (`#f87171`, `red-*`) | Ember (`#c45d3e`) |
| Gray (`gray-*`) | Smoke (`#8a837a`) or Charcoal (`#2a2520`) |

**Step 4: Update typography**

In dashboard components, ensure:
- Headings use `font-serif` (EB Garamond) — applies automatically via CSS variables
- Data labels and body text use `font-sans` (Inter) — already the case

**Step 5: Verify visual consistency**

```bash
npm run dev
```

Visit each dashboard page and verify the Campfire palette is applied consistently.

**Step 6: Commit**

```bash
git add -A
git commit -m "design: apply Campfire palette to all dashboard pages"
```

---

## Phase 7: Integration & Polish

### Task 25: Update environment variables and configuration

**Files:**
- Modify: `unified/.env.local`
- Modify: `unified/next.config.ts`

**Step 1: Add Mapbox token**

```bash
echo "NEXT_PUBLIC_MAPBOX_TOKEN=<value-from-500acres-.env.local>" >> unified/.env.local
```

**Step 2: Add site URL for email links**

```bash
echo "NEXT_PUBLIC_SITE_URL=https://habitable.us" >> unified/.env.local
```

**Step 3: Update next.config.ts if needed**

Check if any special config is needed for:
- Image domains (Mapbox tiles, Google Maps)
- Webpack fallbacks for Mapbox GL
- External packages for GSAP

```typescript
// unified/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.mapbox.com' },
    ],
  },
  // Mapbox GL requires this for Next.js
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js',
    };
    return config;
  },
};

export default nextConfig;
```

**Step 4: Commit**

```bash
git add -A
git commit -m "config: update env vars and next.config for unified app"
```

---

### Task 26: Add SEO metadata and Open Graph tags

**Files:**
- Modify: `unified/app/(public)/layout.tsx` or individual page files

**Step 1: Add metadata exports to public pages**

For each public page, add Next.js metadata:

```typescript
// unified/app/(public)/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '500 Acres — Reimagining Belonging',
  description: 'Building community in nature. Helping Gen Z solve the housing crisis.',
  openGraph: {
    title: '500 Acres — Reimagining Belonging',
    description: 'Building community in nature.',
    url: 'https://habitable.us',
    siteName: '500 Acres',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '500 Acres — Reimagining Belonging',
    description: 'Building community in nature.',
    images: ['/og-image.png'],
  },
};
```

Note: Since the homepage uses `'use client'`, metadata must be exported from a separate server component wrapper or a `layout.tsx` file.

**Step 2: Commit**

```bash
git add -A
git commit -m "seo: add metadata and Open Graph tags to public pages"
```

---

### Task 27: Update Vercel deployment config

**Files:**
- Create or modify: `unified/vercel.json`

**Step 1: Create vercel.json**

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "deploy: add Vercel config with security headers"
```

---

### Task 28: Full build verification and smoke test

**Files:** None (verification only)

**Step 1: Run full build**

```bash
cd unified && npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Start production server locally**

```bash
npm run start
```

**Step 3: Smoke test all routes**

| Route | Expected |
|-------|----------|
| `/` | Homepage with scroll experience, animations, maps |
| `/about` | About landing page |
| `/about/mission` | Mission page with reveals |
| `/stories` | Stories grid |
| `/stories/sherry` | Individual story page |
| `/resources` | Resources page |
| `/get-involved` | Get involved form |
| `/login` | Login page (Campfire styled) |
| `/register` | Registration page |
| `/dashboard` | Dashboard home (requires auth) |
| `/analytics` | Analytics dashboard (admin only) |
| `/till` | Financial statements |
| `/buzz` | NPS tracking |
| `/users` | User management (admin only) |

**Step 4: Verify auth flows**

1. Register a new user → should see "awaiting approval" message
2. Login with pending user → should see "awaiting approval" error
3. Login with active admin → should redirect to dashboard
4. Visit /users → should see pending user
5. Approve user → user should get email
6. Login with approved user → should work

**Step 5: Verify analytics**

1. Visit public pages → analytics events should be recorded
2. Visit /analytics as admin → should see pageview data

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address smoke test issues"
```

---

### Task 29: Clean up and final commit

**Files:**
- Remove: old Vite config files (if they exist in unified/)
- Verify: `.gitignore` excludes `node_modules`, `.env.local`, etc.

**Step 1: Remove any stale files**

```bash
# Remove Vite-specific files if accidentally copied
rm -f unified/vite.config.js
rm -f unified/index.html
```

**Step 2: Verify .gitignore**

Ensure `.gitignore` includes:
```
node_modules/
.env.local
.next/
dist/
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: clean up stale files, finalize unified project"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1. Scaffold | 1–2 | Clone dashboard, install deps, create route groups |
| 2. Design | 3–4 | Merge Campfire tokens, update sidebar |
| 3. Auth | 5–10 | Status column, login checks, registration approval, admin UI, middleware |
| 4. Public Pages | 11–18 | Migrate data/assets, hooks, components, all pages |
| 5. Analytics | 19–23 | Database table, event API, tracker hook, report API, dashboard UI |
| 6. Visual Refresh | 24 | Apply Campfire palette to all dashboard components |
| 7. Integration | 25–29 | Env vars, SEO, Vercel config, smoke testing, cleanup |

**Total: 29 tasks across 7 phases.**

Each task is independently committable and testable. Earlier tasks don't depend on later ones, but tasks within each phase should be done in order.
