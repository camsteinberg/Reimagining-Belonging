// lib/getSession.ts
import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME } from './auth';

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
