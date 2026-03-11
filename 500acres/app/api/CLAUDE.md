# app/api/ — API Route Patterns

## Required Exports (ALL routes)

```typescript
export const runtime = 'nodejs';       // NEVER edge
export const dynamic = 'force-dynamic'; // No caching
```

## Auth Check Pattern

```typescript
import { getSession } from '@/lib/getSession';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Admin-only routes:
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // ...
}
```

## Database Pattern

```typescript
import sql from '@/lib/db';  // DEFAULT import — see lib/CLAUDE.md for gotchas

const rows = (await sql`
  SELECT id, email FROM "User" WHERE id = ${session.userId} LIMIT 1
`) as UserRow[];
```

## Error Response Pattern

```typescript
export async function POST(req: Request) {
  try {
    // ... logic
  } catch (e) {
    console.error('descriptive-label error', e);
    return NextResponse.json({ error: 'Human-readable message' }, { status: 500 });
  }
}
```

## Rate Limiting (auth endpoints only)

```typescript
import { createRateLimiter, getClientIp } from '@/lib/rateLimiter';

const isRateLimited = createRateLimiter(3, 60_000); // module scope

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ...
}
```

Used on: `/api/login`, `/api/register`, `/api/password/forgot`, `/api/password/reset`, `/api/account/phone/start`

## Google Sheets Pattern (dashboard data routes)

```typescript
import { google } from 'googleapis';

// Inline auth setup (some routes use getSheetsClient, some inline):
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: email, private_key: key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
```

Used on: `/api/buzz`, `/api/governance`, `/api/realestate-data`, `/api/barndobucks`

## Email Pattern

```typescript
try {
  await sendPasswordResetEmail(user.email, resetUrl);
} catch (e) {
  console.error('sendPasswordResetEmail error', e);
  // NEVER break the request on email failure
}
```
