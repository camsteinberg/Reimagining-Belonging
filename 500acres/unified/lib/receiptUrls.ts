import crypto from 'crypto';

const normalizeAppUrl = () => {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
};

const signReceiptToken = (receiptId: number) => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is required');
  return crypto.createHmac('sha256', secret).update(String(receiptId)).digest('hex');
};

export const isValidReceiptToken = (receiptId: number, token: string | null) => {
  if (!token) return false;
  const expected = signReceiptToken(receiptId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
};

export const buildReceiptPublicUrl = (receiptId: number) => {
  const base = normalizeAppUrl();
  const token = signReceiptToken(receiptId);
  return `${base}/api/fellowship/receipts/${receiptId}/file?token=${token}`;
};
