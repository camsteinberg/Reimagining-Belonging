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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Total pageviews
  const pvResult = await sql`
    SELECT COUNT(*) as count FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
  `;
  const totalPageviews = Number(pvResult[0]?.count ?? 0);

  // Unique sessions (visitors)
  const uvResult = await sql`
    SELECT COUNT(DISTINCT session_id) as count FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
  `;
  const uniqueVisitors = Number(uvResult[0]?.count ?? 0);

  // Average session duration
  const durResult = await sql`
    SELECT AVG(duration_ms) as avg_duration FROM analytics_events
    WHERE event_type = 'session_end' AND duration_ms IS NOT NULL
    AND created_at > ${cutoff}
  `;
  const avgDurationMs = durResult[0]?.avg_duration
    ? Math.round(Number(durResult[0].avg_duration))
    : null;

  // Bounce rate (sessions with only one pageview)
  const bounceData = await sql`
    WITH session_counts AS (
      SELECT session_id, COUNT(*) as pageviews
      FROM analytics_events
      WHERE event_type = 'pageview' AND created_at > ${cutoff}
      GROUP BY session_id
    )
    SELECT
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE pageviews = 1) as bounce_sessions
    FROM session_counts
  `;
  const totalSessions = Number(bounceData[0]?.total_sessions ?? 0);
  const bounceSessions = Number(bounceData[0]?.bounce_sessions ?? 0);
  const bounceRate =
    totalSessions > 0
      ? Math.round((bounceSessions / totalSessions) * 100)
      : 0;

  // Top pages
  const topPages = await sql`
    SELECT path, COUNT(*) as views
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10
  `;

  // Referral sources
  const referrers = await sql`
    SELECT
      CASE
        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
        ELSE referrer
      END as source,
      COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
    GROUP BY source
    ORDER BY count DESC
    LIMIT 10
  `;

  // Device breakdown
  const devices = await sql`
    SELECT
      CASE
        WHEN user_agent ILIKE '%mobile%' THEN 'Mobile'
        WHEN user_agent ILIKE '%tablet%' THEN 'Tablet'
        ELSE 'Desktop'
      END as device_type,
      COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
    GROUP BY device_type
    ORDER BY count DESC
  `;

  // Pageviews over time (daily)
  const dailyViews = await sql`
    SELECT DATE(created_at) as date, COUNT(*) as views
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  // Geography (top countries)
  const geography = await sql`
    SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > ${cutoff}
    GROUP BY country
    ORDER BY count DESC
    LIMIT 10
  `;

  return NextResponse.json({
    period: `${days}d`,
    totalPageviews,
    uniqueVisitors,
    avgDurationMs,
    bounceRate,
    topPages,
    referrers,
    devices,
    dailyViews,
    geography,
  });
}
