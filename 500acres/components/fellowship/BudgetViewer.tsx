'use client';

import useSWR from 'swr';
import SurfaceCard from '@/components/ui/SurfaceCard';
import BudgetChart, { BudgetRow } from './BudgetChart';

type ApiResponse = { headers: string[]; rows: BudgetRow[] };
type CurrentUser = { id: string; username?: string; email?: string };
type KpiRow = { id: number; is_done?: boolean | null };

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
  return json;
};

const num = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitize = (value: unknown) =>
  typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

function filterRowsForUser(rows: BudgetRow[], currentUser?: CurrentUser) {
  if (!currentUser) return [];

  const tokens = new Set<string>();
  const addToken = (value?: string | null) => {
    if (!value) return;
    const clean = sanitize(value);
    if (clean) tokens.add(clean);
  };

  addToken(currentUser.username);
  addToken(currentUser.email);
  if (currentUser.email) {
    addToken(currentUser.email.split('@')[0] || '');
  }
  addToken(currentUser.id);

  const parts = (currentUser.username || '').split(/\s+/);
  parts.forEach(addToken);

  if (tokens.size === 0) return [];

  return rows.filter((row) => {
    const fellowKey = sanitize(row.fellow);
    if (!fellowKey) return false;
    for (const token of tokens) {
      if (token && fellowKey.includes(token)) return true;
    }
    return false;
  });
}

type Props = { role?: string; currentUser?: CurrentUser };

export default function BudgetViewer({ role = 'fellow', currentUser }: Props) {
  const { data, error } = useSWR<ApiResponse>('/api/budget', fetcher);
  const { data: kpiRows } = useSWR<KpiRow[]>(
    role === 'admin' ? null : '/api/fellowship/kpis',
    fetcher
  );

  const allRows: BudgetRow[] = (data?.rows || []).map((row) => ({
    ...row,
    allocated: num(row.allocated),
    actual: num(row.actual),
  }));

  const baseRows =
    role === 'admin' ? allRows : filterRowsForUser(allRows, currentUser);

  const completedCount = Array.isArray(kpiRows)
    ? kpiRows.filter((k) => !!k.is_done).length
    : 0;
  const totalCount = Array.isArray(kpiRows) ? kpiRows.length : 0;
  const pendingCount = Math.max(totalCount - completedCount, 0);

  const rows = baseRows.map((row) => ({
    ...row,
    kpiCompleted: role === 'admin' ? 0 : completedCount,
    kpiPending: role === 'admin' ? 0 : pendingCount,
    kpiTotal: role === 'admin' ? 0 : totalCount,
  }));

  const showEmptyState = !error && rows.length === 0;

  return (
    <SurfaceCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
            Budget
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Allocated budget alongside KPI completion progress.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-strong)]">
          {rows.length} rows
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-[#c45d3e]/20 bg-[#c45d3e]/5 px-3 py-2 text-sm text-[#c45d3e]">
          Failed to load budget: {String((error as any)?.message ?? '')}
        </div>
      )}

      {rows.length > 0 && <BudgetChart rows={rows} />}

      {showEmptyState && (
        <div className="text-sm text-[var(--color-text-muted)]">
          No budget data for your account yet.
        </div>
      )}
    </SurfaceCard>
  );
}
