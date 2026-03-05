// lib/rateLimiter.ts
// In-memory sliding-window rate limiter keyed by IP address.

type Entry = { count: number; resetAt: number };

const MAX_ENTRIES = 10_000;

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const map = new Map<string, Entry>();
  let lastCleanup = Date.now();

  return function isRateLimited(ip: string): boolean {
    const now = Date.now();

    // Periodic cleanup: sweep expired entries every 60s or when map is large
    if (now - lastCleanup > 60_000 || map.size > MAX_ENTRIES) {
      map.forEach((val, key) => {
        if (now > val.resetAt) map.delete(key);
      });
      lastCleanup = now;
    }

    const entry = map.get(ip);
    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count++;
    return entry.count > maxRequests;
  };
}

/** Extract client IP from request headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}
