import { jwtVerify, SignJWT, errors } from 'jose';

export const COOKIE_NAME = 'session';
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

const DEFAULT_TTL = 60 * 60 * 24;
const REMEMBER_TTL = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
};

export type SessionErrorCode = 'expired' | 'malformed' | 'invalid_signature' | 'unknown';

export class SessionVerifyError extends Error {
  code: SessionErrorCode;
  constructor(code: SessionErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SessionVerifyError';
    this.code = code;
    this.cause = cause;
  }
}

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
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      clockTolerance: 30, // 30-second clock skew tolerance
    });
    return payload as SessionPayload & { exp: number; iat: number };
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      throw new SessionVerifyError('expired', 'Session token has expired', err);
    }
    if (
      err instanceof errors.JWTInvalid ||
      err instanceof errors.JWSInvalid
    ) {
      throw new SessionVerifyError('malformed', 'Session token is malformed', err);
    }
    if (err instanceof errors.JWSSignatureVerificationFailed) {
      throw new SessionVerifyError('invalid_signature', 'Session token signature is invalid', err);
    }
    throw new SessionVerifyError('unknown', 'Session verification failed', err);
  }
}
