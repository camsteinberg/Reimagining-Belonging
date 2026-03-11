# lib/ — Server Utilities

## auth.ts

```typescript
export const COOKIE_NAME = 'session';
export type SessionPayload = { userId: string; username?: string; email?: string; role?: string; status?: string };
export type SessionErrorCode = 'expired' | 'malformed' | 'invalid_signature' | 'unknown';
export class SessionVerifyError extends Error { code: SessionErrorCode }

export async function signSession(payload: SessionPayload, remember: boolean): Promise<{ token: string; maxAge: number }>
export async function verifySession(token: string): Promise<SessionPayload & { exp: number; iat: number }>
```

- HS256 via `jose`. Default TTL 24h, remember-me 30d.
- `verifySession` throws `SessionVerifyError` -- never returns null.

## getSession.ts

```typescript
export async function getSession(): Promise<SessionPayload | null>
```

- Reads cookie, calls `verifySession`, catches errors, returns `null` on failure. **Never throws.**
- Use in Server Components and API routes.

## db.ts

```typescript
import sql from '@/lib/db';  // DEFAULT import -- not { sql }
const rows = await sql`SELECT * FROM "User" WHERE id = ${id}`;
```

- Neon serverless (`@neondatabase/serverless`). Tagged template literals for parameterized queries.
- **`"User"` table MUST be double-quoted** -- Neon/Postgres folds unquoted identifiers to lowercase.
- Results are plain arrays: `rows[0]`, not `rows.rows[0]`.
- Cast result types: `const rows = (await sql`...`) as MyType[];`

## mail.ts

```typescript
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>
export async function sendPhoneVerificationCodeEmail(to: string, code: string): Promise<void>
export async function sendSystemEmail(to: string | string[], subject: string, html: string, options?: { text?: string; replyTo?: string | string[] }): Promise<void>
```

- Resend SDK (lazy-loaded). Uses `EMAIL_FROM` env var.
- **Gotcha**: email failures must NEVER break the request -- always wrap in try/catch.

## tokens.ts

```typescript
export function generateResetToken(): { token: string; hash: string; expiresAt: Date }
export function hashToken(token: string): string  // SHA-256
```

- `token` is emailed to user; `hash` is stored in DB. Verify by hashing the submitted token.

## rateLimiter.ts

```typescript
export function createRateLimiter(maxRequests: number, windowMs: number): (ip: string) => boolean
export function getClientIp(req: Request): string
```

- In-memory sliding window. Factory returns `isRateLimited(ip)` -- true = block the request.
- Usage: `const isRateLimited = createRateLimiter(3, 60_000);` at module scope.

## googleSheets.ts

```typescript
export function getSheetsClient(): sheets_v4.Sheets
```

- Google service account JWT auth. Reads `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`.

## phone.ts

```typescript
export function normalizePhone(input: string | null | undefined): string | null  // E.164
export function formatPhoneForDisplay(input: string): string
export function looksLikeEmail(input: string): boolean
```

- `libphonenumber-js`. Default region from `DEFAULT_PHONE_REGION` env var (default: `'US'`).

## Other Modules

| File | Purpose |
|---|---|
| `analytics.ts` | Analytics tracking helpers |
| `expensify.ts` | Expensify report parsing |
| `receiptUrls.ts` | Receipt URL resolution |
| `till-xlsx.ts` | XLSX financial statement parser (balance sheets, income statements). Has vitest specs in `tests/till-xlsx.*.spec.ts` |
