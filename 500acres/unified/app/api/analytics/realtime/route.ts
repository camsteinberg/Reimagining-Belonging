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
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const active = await sql`
    SELECT DISTINCT ON (session_id) session_id, path, created_at
    FROM analytics_events
    WHERE created_at > ${fiveMinAgo}
    ORDER BY session_id, created_at DESC
  `;

  return NextResponse.json({
    activeVisitors: active.length,
    currentPages: active.map((a) => ({
      sessionId: a.session_id,
      path: a.path,
    })),
  });
}
