// lib/phone.ts
import { parsePhoneNumber } from 'libphonenumber-js';

// Default region when users type local numbers like (555) 123-4567
const DEFAULT_REGION = (process.env.DEFAULT_PHONE_REGION || 'US') as any;

/**
 * Normalize arbitrary user input to E.164 for storage & lookup.
 * Returns null if invalid.
 * Examples: "(415) 555-1212" -> "+14155551212"
 */
export function normalizePhone(input: string | null | undefined) {
  const raw = (input || '').trim();
  if (!raw) return null;
  try {
    const p = parsePhoneNumber(raw, DEFAULT_REGION);
    if (p && (p.isValid() || p.isPossible())) return p.number; // accept real + plausible numbers
  } catch {}
  return null;
}

/**
 * Optional: Nice formatting for UI (do NOT store this).
 * Returns the original input if it can't format.
 */
export function formatPhoneForDisplay(input: string) {
  try {
    const p = parsePhoneNumber(input);
    if (p && p.isValid()) return p.formatInternational(); // e.g., "+1 555 123 4567"
  } catch {}
  return input;
}

/** Simple email detector for login routing (email vs phone/username). */
export function looksLikeEmail(input: string) {
  return /\S+@\S+\.\S+/.test(input);
}
