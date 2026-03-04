import { env } from 'process';

type PushExpenseArgs = {
  amountCents: number;
  merchant?: string | null;
  comment?: string | null;
  expenseDate?: string | Date | null;
  category?: string | null;
  transactionId?: string | null;
  receiptUrl?: string | null;
};

const coerceDate = (date?: string | Date | null) => {
  if (!date) return new Date().toISOString().slice(0, 10);
  if (typeof date === 'string') return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

/**
 * Pushes (or updates) a single expense to Expensify.
 * When `transactionId` is provided, Expensify will update that expense; otherwise a new one is created.
 */
export async function pushExpenseToExpensify({
  amountCents,
  merchant,
  comment,
  expenseDate,
  category,
  transactionId,
  receiptUrl,
}: PushExpenseArgs): Promise<string | null> {
  const partnerUserID = env.EXPENSIFY_PARTNER_USER_ID || env.partnerUserID;
  const partnerUserSecret = env.EXPENSIFY_PARTNER_USER_SECRET || env.partnerUserSecret;
  const policyID = env.EXPENSIFY_POLICY_ID || env.policyID;
  const serviceEmail =
    env.EXPENSIFY_SERVICE_EMAIL || env.serviceEmail || env.partnerUserID || partnerUserID;

  const missing: string[] = [];
  if (!partnerUserID) missing.push('partnerUserID');
  if (!partnerUserSecret) missing.push('partnerUserSecret');
  if (!policyID) missing.push('policyID');
  if (!serviceEmail) missing.push('serviceEmail');
  if (missing.length) {
    console.warn(`[expensify][push] missing ${missing.join(', ')}, skipping push`);
    return null;
  }

  const normalizedAmountCents = Math.round(Number(amountCents));
  if (!normalizedAmountCents || normalizedAmountCents <= 0) {
    console.warn('[expensify][push] amount missing/invalid, skipping push');
    return null;
  }

  const expenseDateStr = coerceDate(expenseDate);
  const normalizedReceiptUrl = receiptUrl?.trim() || null;
  const payload = {
    type: 'create',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    inputSettings: {
      type: 'expenses',
      policyID,
      employeeEmail: serviceEmail,
      transactionList: [
        {
          created: expenseDateStr,
          currency: 'USD',
          amount: normalizedAmountCents,
          merchant: merchant?.trim() || 'NA',
          comment: comment || 'Grant expense',
          category: category || 'Other',
          reimbursable: true,
          billable: false,
          policyID,
          ...(transactionId ? { transactionID: transactionId } : {}),
          ...(normalizedReceiptUrl ? { receipt: normalizedReceiptUrl } : {}),
        },
      ],
    },
  };

  const body = new URLSearchParams();
  body.set('requestJobDescription', JSON.stringify(payload));

  const res = await fetch(
    'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.responseCode !== 200) {
    console.error('[expensify][push][error]', {
      status: res.status,
      json,
    });
    throw new Error(json?.responseMessage || `Expensify push failed (HTTP ${res.status})`);
  }

  const expenseId =
    json?.transactionIDs?.[0] ||
    json?.transactionList?.[0]?.transactionID ||
    (Array.isArray(json?.expenses) ? json.expenses[0]?.transactionID : null) ||
    null;

  return expenseId ? String(expenseId) : null;
}
