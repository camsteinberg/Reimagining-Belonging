import { NextRequest, NextResponse } from 'next/server';
import { recordEvent } from '@/lib/analytics';
import { UAParser } from 'ua-parser-js';

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
    const result = UAParser(uaString);
    const uaSummary = `${result.browser.name || 'Unknown'}/${result.browser.version || '?'} ${result.os.name || ''}/${result.os.version || ''} ${result.device.type || 'desktop'}`;

    // Geo lookup placeholder — store null for now
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
