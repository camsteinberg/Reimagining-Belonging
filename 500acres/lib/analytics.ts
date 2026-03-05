import sql from '@/lib/db';

export async function recordEvent(event: {
  sessionId: string;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  country?: string | null;
  region?: string | null;
  screenW?: number | null;
  screenH?: number | null;
  eventType?: string | null;
  durationMs?: number | null;
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
