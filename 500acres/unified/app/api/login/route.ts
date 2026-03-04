// app/api/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { signSession, COOKIE_NAME } from '@/lib/auth';
import { looksLikeEmail, normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null; // E.164
  password: string;
  role: string | null;
};

export async function POST(req: Request) {
  try {
    const { identifier, password, remember } = await req.json();
    const login = (identifier || '').trim();

    if (!login || !password) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 400 });
    }

    let users: UserRow[] = [];

    if (looksLikeEmail(login)) {
      users = (await sql`
        SELECT id, email, username, phone, password, role
        FROM "User"
        WHERE lower(email) = lower(${login})
        LIMIT 1
      `) as UserRow[];
    } else {
      const phoneNorm = normalizePhone(login);
      if (phoneNorm) {
        users = (await sql`
          SELECT id, email, username, phone, password, role
          FROM "User"
          WHERE phone = ${phoneNorm}
          LIMIT 1
        `) as UserRow[];
      } else {
        // Fallback: support legacy username during transition.
        users = (await sql`
          SELECT id, email, username, phone, password, role
          FROM "User"
          WHERE username = ${login}
          LIMIT 1
        `) as UserRow[];
      }
    }

    const user = users[0];
    if (!user) {
      console.warn('Login failed: user not found', { identifier: login });
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.warn('Login failed: wrong password', { userId: user.id });
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const { token, maxAge } = await signSession(
      {
        userId: String(user.id),
        username: user.username ?? '',
        email: user.email ?? undefined,
        role: user.role ?? undefined,
      },
      !!remember
    );

    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }
}
