// app/api/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { signSession, COOKIE_NAME } from '@/lib/auth';
import { looksLikeEmail, normalizePhone } from '@/lib/phone';
import { createRateLimiter, getClientIp } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 5 attempts per minute per IP
const isRateLimited = createRateLimiter(5, 60_000);

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null; // E.164
  password: string;
  role: string | null;
  status: string | null;
};

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const { identifier, password, remember } = await req.json();
    const login = (identifier || '').trim();

    if (!login || !password) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 400 });
    }

    let users: UserRow[] = [];

    if (looksLikeEmail(login)) {
      users = (await sql`
        SELECT id, email, username, phone, password, role, status
        FROM "User"
        WHERE lower(email) = lower(${login})
        LIMIT 1
      `) as UserRow[];
    } else {
      const phoneNorm = normalizePhone(login);
      if (phoneNorm) {
        users = (await sql`
          SELECT id, email, username, phone, password, role, status
          FROM "User"
          WHERE phone = ${phoneNorm}
          LIMIT 1
        `) as UserRow[];
      } else {
        // Fallback: support legacy username during transition.
        users = (await sql`
          SELECT id, email, username, phone, password, role, status
          FROM "User"
          WHERE username = ${login}
          LIMIT 1
        `) as UserRow[];
      }
    }

    const user = users[0];
    if (!user) {
      console.warn('Login failed: user not found');
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.warn('Login failed: wrong password');
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        { success: false, message: 'Your account is awaiting admin approval. You\'ll receive an email when approved.' },
        { status: 403 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Contact an administrator.' },
        { status: 403 }
      );
    }

    const { token, maxAge } = await signSession(
      {
        userId: String(user.id),
        username: user.username ?? '',
        email: user.email ?? undefined,
        role: user.role ?? undefined,
        status: user.status ?? 'active',
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
