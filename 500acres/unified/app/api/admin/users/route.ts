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

  if (statusFilter && ['pending', 'active', 'suspended'].includes(statusFilter)) {
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
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://habitable.us';
        if (status === 'active' && user.old_status === 'pending') {
          await sendSystemEmail(
            user.email,
            'Your 500 Acres account has been approved!',
            `<p>Hi ${user.username},</p>
             <p>Your account has been approved. You can now sign in at <a href="${siteUrl}/login">${siteUrl}/login</a>.</p>
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

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  return NextResponse.json({ success: true, updates });
}
