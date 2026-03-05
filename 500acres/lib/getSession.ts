// lib/getSession.ts
import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME, SessionVerifyError } from './auth';

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch (err) {
    if (err instanceof SessionVerifyError) {
      console.warn(`Session verification failed [${err.code}]: ${err.message}`);
    } else {
      console.warn('Session verification failed: unexpected error');
    }
    return null;
  }
}
