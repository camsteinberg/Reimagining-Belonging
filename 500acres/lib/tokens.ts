// lib/tokens.ts
import crypto from 'crypto';

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');        // raw token (emailed)
  const hash = crypto.createHash('sha256').update(token).digest('hex'); // store
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);     // 1 hour
  return { token, hash, expiresAt };
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
