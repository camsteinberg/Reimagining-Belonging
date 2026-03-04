import { jwtVerify, SignJWT } from 'jose';

export const COOKIE_NAME = 'session';
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

const DEFAULT_TTL = 60 * 60 * 24;
const REMEMBER_TTL = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
};

export async function signSession(payload: SessionPayload, remember: boolean) {
  const ttl = remember ? REMEMBER_TTL : DEFAULT_TTL;
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(SECRET);
  return { token, maxAge: ttl };
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as SessionPayload & { exp: number; iat: number };
}
