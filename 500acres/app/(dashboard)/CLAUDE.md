# app/(dashboard)/ — Protected Dashboard

## Layout (Server Component)

```typescript
// layout.tsx — DO NOT re-wrap with AppShell in pages
import AppShell from '@/components/AppShell';
import ErrorBoundary from '@/components/public/shared/ErrorBoundary';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');
  // Fetches phone status for sidebar, wraps in AppShell + ErrorBoundary
  return <AppShell sidebarProps={sidebarProps}><ErrorBoundary>{children}</ErrorBoundary></AppShell>;
}
```

AppShell provides: sidebar (desktop + mobile drawer), mobile header with hamburger, main content area.

## Page Pattern (Server Component)

```typescript
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/getSession';
import MyClientComponent from './MyClientComponent';

export const metadata: Metadata = { title: 'Page Name' };

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/my-page');
  const displayName = session.username ?? session.email ?? 'Fellow';
  return <MyClientComponent username={displayName} role={session.role ?? null} />;
}
```

Pages are thin server components that pass session props to client components.

## Data Fetching

**SWR** (fellowship components — `components/fellowship/`):
```typescript
import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(r => r.json());
const { data, error, mutate } = useSWR<MyType>('/api/endpoint', fetcher);
```

Used in: BudgetViewer, BudgetAdmin, AdminDashboard (grants, KPIs, fellows)

**useEffect + fetch** (other dashboard components):
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch('/api/endpoint').then(r => r.json()).then(setData).finally(() => setLoading(false));
}, []);
```

Used in: UserManagement, TillDashboard, GovernanceDashboard

## SurfaceCard

```typescript
import SurfaceCard from '@/components/ui/SurfaceCard';
<SurfaceCard variant="default">  // bg-surface, shadow, rounded-3xl
<SurfaceCard variant="muted">    // bg-surface-subtle (no elevation)
<SurfaceCard variant="inset">    // bg-surface-elevated
<SurfaceCard padding="sm|md|lg"> // p-4 | p-5 md:p-6 | p-6 md:p-8
```

## Styling

- CSS custom properties everywhere: `text-[var(--color-text)]`, `bg-[var(--color-canvas)]`
- Icons: `lucide-react` — `import { IconName } from 'lucide-react'`
- Charts: `recharts` — AreaChart, BarChart, PieChart with Campfire palette colors
- Spacing: design system tokens `--space-xs` through `--space-4xl`

## ErrorBoundary

```typescript
import ErrorBoundary from '@/components/public/shared/ErrorBoundary';
<ErrorBoundary inline label="Analytics">   // Compact card with retry button
<ErrorBoundary>                             // Full-page fallback with retry + home
```

## Role-Based Access

- **Middleware** handles redirects: fellows -> `/fellowship`, admins -> `/fellowship-admin`
- **Admin-only pages**: `/fellowship-admin`, `/users`, `/analytics`
- **Page-level checks**: `if (session.role !== 'admin') redirect('/fellowship')`
- **API-level checks**: return 403 in route handler (see api/CLAUDE.md)
