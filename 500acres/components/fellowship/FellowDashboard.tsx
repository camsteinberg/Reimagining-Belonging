'use client';

import { ReactNode, useState } from 'react';
import useSWR from 'swr';
import BudgetViewer from './BudgetViewer';
import SurfaceCard from '@/components/ui/SurfaceCard';

type Props = { userId: string; role: string; username?: string; email?: string };

type KpiRow = {
  id: number;
  title: string;
  objective: string;
  is_done: boolean;
};

type PayRow = {
  id: number;
  week_start: string | null;
  hours: number | null;
  rate_cents: number | null;
  total_cents: number | null;
  note: string | null;
};

type GrantRow = {
  id: number;
  fellow_id: string;
  amount_requested_cents: number;
  amount_approved_cents: number | null;
  amount_disbursed_cents: number;
  amount_spent_cents: number;
  purpose: string;
  category: string;
  project: string | null;
  linked_kpi_ids?: number[] | null;
  status: string;
  requested_by_date: string | null;
  created_at: string;
  updated_at: string;
};

type ReceiptRow = {
  id: number;
  grant_id: number;
  file_url: string | null;
  vendor: string;
  amount_cents: number;
  purchase_date: string;
  category: string;
  status: string;
  created_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const message = payload?.detail || payload?.error || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }
  return payload;
};

const dash = '—';
const getTodayIsoDate = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

export default function FellowDashboard({ userId, role, username, email }: Props) {
  const currentUser = {
    id: userId,
    username: username || undefined,
    email: email || undefined,
  };

  return (
    <div className="space-y-6 text-[var(--color-text)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-4xl font-semibold md:text-5xl">Fellowship</h2>
        <SurfaceCard
          variant="muted"
          padding="sm"
          className="inline-flex w-auto flex-col items-end gap-1 text-right"
        >
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            Role
          </p>
          <p className="text-base font-semibold text-[var(--color-text)]">{role || dash}</p>
        </SurfaceCard>
      </div>

    <div className="grid grid-cols-1 gap-4">
      <BudgetViewer role={role} currentUser={currentUser} />
    </div>

      <div className="grid grid-cols-1 gap-4">
        <KPIsCard />
        <GrantsCard />
      </div>
    </div>
  );
}

/* ---------------- Weekly pay (Fellow) ---------------- */
function WeeklyPayCard() {
  const { data, error } = useSWR<PayRow[]>('/api/fellowship/pay', fetcher);
  const rows = Array.isArray(data) ? data : [];

  const fmtDate = (iso?: string | null) => {
    if (!iso) return dash;
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return dash;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const fmtHours = (value?: number | null) => {
    if (value == null) return dash;
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return dash;
    if (Number.isInteger(numeric)) return numeric.toString();
    return numeric.toFixed(1);
  };

  const fmtMoney = (cents?: number | null) => {
    if (cents == null) return dash;
    const dollars = cents / 100;
    return `$${dollars.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const recordLabel =
    rows.length > 0 ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : 'No records';

  return (
    <SurfaceCard className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
          <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
          Weekly pay
        </h3>
        <span className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          {recordLabel}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--color-ember)]/20 bg-[var(--color-ember)]/5 px-3 py-2 text-sm text-[var(--color-ember)]">
          Failed to load pay: {String((error as any)?.message ?? '')}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-2 py-2 text-left">Week starting</th>
              <th className="px-2 py-2 text-right">Hours</th>
              <th className="px-2 py-2 text-right">Rate</th>
              <th className="px-2 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.week_start}-${row.id}`}
                className="border-b border-[var(--color-border-soft)] last:border-none"
              >
                <td className="px-2 py-3 align-top">
                  <div className="font-medium text-[var(--color-text)]">
                    {fmtDate(row.week_start)}
                  </div>
                  {row.note && (
                    <div className="mt-1 break-words text-xs text-[var(--color-text-muted)]">{row.note}</div>
                  )}
                </td>
                <td className="px-2 py-3 text-right align-top tabular-nums">
                  {fmtHours(row.hours)}
                </td>
                <td className="px-2 py-3 text-right align-top tabular-nums">
                  {row.rate_cents != null ? `${fmtMoney(row.rate_cents)}/hr` : dash}
                </td>
                <td className="px-2 py-3 text-right align-top tabular-nums font-semibold text-[var(--color-text)]">
                  {fmtMoney(row.total_cents)}
                </td>
              </tr>
            ))}
            {!error && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-[var(--color-text-muted)]">
                  No pay records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}

/* ---------------- KPIs (Fellow) ---------------- */
function KPIsCard() {
  const { data, error, mutate, isLoading } = useSWR<KpiRow[]>('/api/fellowship/kpis', fetcher);
  const rows = Array.isArray(data) ? data : [];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editStatus, setEditStatus] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addObjective, setAddObjective] = useState('');

  const startEdit = (row: KpiRow) => {
    setEditingId(row.id);
    setEditTitle(row.title);
    setEditObjective(row.objective);
    setEditStatus(Boolean(row.is_done));
  };

  const save = async () => {
    if (editingId == null) return;
    await fetch('/api/fellowship/kpis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        title: editTitle.trim(),
        objective: editObjective.trim(),
        isDone: editStatus,
      }),
    });
    setEditingId(null);
    setEditStatus(false);
    mutate();
  };

  const remove = async (id: number) => {
    await fetch(`/api/fellowship/kpis?id=${id}`, { method: 'DELETE' });
    mutate();
  };

  const add = async () => {
    if (!addTitle.trim() || !addObjective.trim()) return;
    await fetch('/api/fellowship/kpis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: addTitle.trim(), objective: addObjective.trim() }),
    });
    setOpenAdd(false);
    mutate();
  };

  return (
    <SurfaceCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
            KPIs
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Goals you are actively tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenAdd(true)}
          className="rounded-xl bg-[var(--color-ember)] px-3 py-2 text-sm font-semibold text-warm-white transition hover:bg-[var(--color-bark)]"
        >
          Add KPI
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--color-ember)]/20 bg-[var(--color-ember)]/5 px-3 py-2 text-sm text-[var(--color-ember)]">
          Failed to load KPIs: {String((error as any)?.message ?? '')}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '44%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-2 py-2 text-left">Goal</th>
              <th className="px-2 py-2 text-left">Objective</th>
              <th className="px-2 py-2 text-center">Status</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={`skel-${i}`} className="border-b border-[var(--color-border-soft)] last:border-none animate-pulse">
                <td className="px-2 py-3"><div className="h-4 w-24 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="h-4 w-40 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3 text-center"><div className="mx-auto h-5 w-16 rounded-full bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3 text-right"><div className="ml-auto h-6 w-20 rounded-lg bg-[var(--color-border-soft)]" /></td>
              </tr>
            ))}
            {!isLoading && rows.map((row) => {
              const editing = editingId === row.id;
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border-soft)] last:border-none"
                >
                  <td className="px-2 py-3 align-top">
                    {editing ? (
                      <input
                        className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    ) : (
                      <span className="font-medium text-[var(--color-text)]">{row.title}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 align-top">
                    {editing ? (
                      <input
                        className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        value={editObjective}
                        onChange={(e) => setEditObjective(e.target.value)}
                      />
                    ) : (
                      <span className="text-[var(--color-text)]">{row.objective}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center align-top">
                    {editing ? (
                      <select
                        value={editStatus ? 'completed' : 'open'}
                        onChange={(e) => setEditStatus(e.target.value === 'completed')}
                        className="w-full max-w-[9rem] rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs"
                      >
                        <option value="open">Open</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.is_done
                            ? 'bg-[#6b8f71]/15 text-[#3d6b4f]'
                            : 'bg-[var(--color-ember)]/10 text-[var(--color-ember)]'
                        }`}
                      >
                        {row.is_done ? 'Completed' : 'Open'}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {editing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={save}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-warm-white hover:brightness-95"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditStatus(false);
                          }}
                          className="rounded-lg bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-strong)] hover:bg-[var(--color-primary)] hover:text-warm-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row.id)}
                          className="rounded-lg bg-[var(--color-ember)] px-3 py-2 text-xs font-semibold text-warm-white hover:bg-[var(--color-bark)]"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-2 py-6 text-center text-[var(--color-text-muted)]"
                >
                  No KPIs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openAdd && (
        <ModalShell title="Add KPI" onClose={() => setOpenAdd(false)}>
          <div className="space-y-4">
            <input
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="Goal"
              className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
            <input
              value={addObjective}
              onChange={(e) => setAddObjective(e.target.value)}
              placeholder="Objective"
              className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAdd(false)}
              className="rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              className="rounded-xl bg-[var(--color-ember)] px-3 py-2 text-sm font-semibold text-warm-white hover:bg-[var(--color-bark)]"
            >
              Add
            </button>
          </div>
        </ModalShell>
      )}
    </SurfaceCard>
  );
}

/* ---------------- Grants (Fellow) ---------------- */
function GrantsCard() {
  const { data, error, mutate, isLoading } = useSWR<GrantRow[]>('/api/fellowship/grants', fetcher);
  const grants = Array.isArray(data) ? data : [];
  const { data: kpis } = useSWR<KpiRow[]>('/api/fellowship/kpis', fetcher);

  const [openAdd, setOpenAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('program');
  const [project, setProject] = useState('General Fellowship');
  const [purpose, setPurpose] = useState('');
  const [requestedBy, setRequestedBy] = useState(getTodayIsoDate());
  const [ack, setAck] = useState(false);
  const [linkedKpis, setLinkedKpis] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [openReceiptsFor, setOpenReceiptsFor] = useState<GrantRow | null>(null);

  const kpiOptions = Array.isArray(kpis)
    ? kpis.map((kpi) => ({ id: kpi.id, label: kpi.title || `KPI ${kpi.id}` }))
    : [];
  const categoryLabels: Record<string, string> = {
    program: 'Program Expense',
    restricted: 'Restricted Grant',
    personal: 'Personal/Benefit',
  };

  const fmtMoney = (cents?: number | null) => {
    if (cents == null) return dash;
    const dollars = cents / 100;
    return `$${dollars.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return dash;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return dash;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const resetForm = () => {
    setAmount('');
    setCategory('program');
    setProject('General Fellowship');
    setPurpose('');
    setRequestedBy(getTodayIsoDate());
    setAck(false);
    setLinkedKpis([]);
    setSubmitting(false);
  };

  const submit = async () => {
    const trimmedPurpose = purpose.trim();
    const purposeTooShort = trimmedPurpose.length < 50;
    const amountNum = Number(amount || 0);
    if (!ack || !amountNum || purposeTooShort) return;

    setSubmitting(true);
    try {
      await fetch('/api/fellowship/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountRequestedCents: Math.round(amountNum * 100),
          category,
          project,
          purpose: trimmedPurpose,
          requestedByDate: requestedBy || null,
          linkedKpiIds: linkedKpis,
        }),
      });

      resetForm();
      setOpenAdd(false);
      mutate();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SurfaceCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
            Grants
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Request and track grant funding from your fellowship budget.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setOpenAdd(true);
            }}
            className="rounded-xl bg-[var(--color-ember)] px-3 py-2 text-sm font-semibold text-warm-white transition hover:bg-[var(--color-bark)]"
          >
            Request grant
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--color-ember)]/20 bg-[var(--color-ember)]/5 px-3 py-2 text-sm text-[var(--color-ember)]">
          Failed to load grants: {String((error as any)?.message ?? '')}
        </div>
      )}

      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full table-fixed text-sm text-center">
          <colgroup>
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
            <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Needed by</th>
                <th className="px-2 py-2">Requested</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Project</th>
                <th className="px-2 py-2">Purpose</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Receipts</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={`skel-${i}`} className="border-b border-[var(--color-border-soft)] last:border-none animate-pulse">
                <td className="px-2 py-3"><div className="mx-auto h-4 w-16 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-4 w-16 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-4 w-14 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-4 w-20 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-4 w-20 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-4 w-32 rounded bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-5 w-16 rounded-full bg-[var(--color-border-soft)]" /></td>
                <td className="px-2 py-3"><div className="mx-auto h-6 w-16 rounded-lg bg-[var(--color-border-soft)]" /></td>
              </tr>
            ))}
            {!isLoading && grants.map((row) => (
              <tr
                  key={row.id}
                  className="border-b border-[var(--color-border-soft)] last:border-none"
                >
                  <td className="px-2 py-3 align-middle">{fmtDate(row.created_at)}</td>
                  <td className="px-2 py-3 align-middle">{fmtDate(row.requested_by_date)}</td>
                  <td className="px-2 py-3 align-middle tabular-nums">
                    {fmtMoney(row.amount_requested_cents)}
                  </td>
                <td className="px-2 py-3 align-middle">
                  {categoryLabels[row.category] || row.category || dash}
                </td>
                <td className="px-2 py-3 align-middle">{row.project || dash}</td>
                <td className="px-2 py-3 align-middle max-w-xs text-left">
                  <span className="line-clamp-2 break-words text-[var(--color-text)]">{row.purpose}</span>
                </td>
                <td className="px-2 py-3 align-middle text-center">
                  <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                    {row.status}
                  </span>
                </td>
                <td className="px-2 py-3 align-middle">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenReceiptsFor(row)}
                      className="rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-strong)] hover:bg-[var(--color-primary)] hover:text-warm-white"
                    >
                      Receipts
                    </button>
                  </div>
                </td>
              </tr>
            ))}
              {!isLoading && !error && grants.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-2 py-6 text-center text-[var(--color-text-muted)]"
                  >
                    No grant requests yet.
                  </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent md:hidden" />
      </div>

      {openAdd && (
        <ModalShell title="Request grant" onClose={() => setOpenAdd(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Grant amount *
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount ($)"
                  type="number"
                  className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Requested by
                </label>
                <input
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  type="date"
                  className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Expense category *
                </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  >
                    <option value="program">Program Expense</option>
                    <option value="restricted">Restricted Grant</option>
                    <option value="personal">Personal/Benefit</option>
                  </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Related project *
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                >
                  <option value="500 Acres">500 Acres</option>
                  <option value="Wander Camp">Wander Camp</option>
                  <option value="Outpost X">Outpost X</option>
                  <option value="General Fellowship">General Fellowship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Purpose description *
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe how you will use these funds and how it ties to your KPIs."
                rows={4}
                className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
              <div
                className={`mt-1 text-[0.7rem] ${
                  purpose.trim().length < 50 ? 'text-[var(--color-ember)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                {purpose.trim().length}/50 minimum characters required.
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Linked KPI(s) (optional)
              </label>
              <select
                multiple
                value={linkedKpis.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((opt) =>
                    Number(opt.value)
                  );
                  setLinkedKpis(selected);
                }}
                className="h-28 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              >
                {kpiOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
                {kpiOptions.length === 0 && <option disabled>No KPIs found</option>}
              </select>
              <p className="mt-1 text-[0.7rem] text-[var(--color-text-muted)]">
                Optional: associate this grant with one or more KPIs.
              </p>
            </div>

            <div className="rounded-xl bg-[var(--color-surface-subtle)] px-3 py-3 text-xs text-[var(--color-text-muted)]">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand and acknowledge that: (1) These funds must be used exclusively for the
                  approved purpose as described in this request; (2) If any funds are misappropriated
                  or used for unapproved purposes, the Foundation will recover those funds; (3) I may
                  be responsible for costs associated with fund recovery; (4) Any disputes regarding
                  fund use will be resolved through the PeaceProvoker process (facilitator + mediator
                  + arbitration) as described at peaceprovoker.com.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAdd(false)}
              className="rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={
                submitting ||
                !ack ||
                Number(amount || 0) <= 0 ||
                purpose.trim().length < 50
              }
              className="rounded-xl bg-[var(--color-ember)] px-3 py-2 text-sm font-semibold text-warm-white transition hover:bg-[var(--color-bark)] disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </ModalShell>
      )}

      {openReceiptsFor && (
        <ReceiptsModal
          grantId={openReceiptsFor.id}
          onClose={() => setOpenReceiptsFor(null)}
        />
      )}
    </SurfaceCard>
  );
}

/* ---------------- Receipts modal (per-grant) ---------------- */
type ReceiptsModalProps = {
  grantId: number;
  onClose: () => void;
};

function ReceiptsModal({ grantId, onClose }: ReceiptsModalProps) {
  const { data, error, mutate } = useSWR<ReceiptRow[]>(
    `/api/fellowship/grants/${grantId}/receipts`,
    fetcher
  );
  const receipts = Array.isArray(data) ? data : [];

  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('program');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fmtMoney = (cents?: number | null) => {
    if (cents == null) return dash;
    const dollars = cents / 100;
    return `$${dollars.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return dash;
    const dt = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(dt.getTime())) return dash;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dt);
  };

  const total = receipts.reduce((sum, r) => sum + (r.amount_cents || 0), 0);

  const resetForm = () => {
    setVendor('');
    setAmount('');
    setDate('');
    setCategory('program');
    setFileUrl('');
  };

  const addReceipt = async () => {
    const amt = Number(amount || 0);
    if (!vendor.trim() || !amt || !date) return;

    setSaving(true);
    try {
      await fetch(`/api/fellowship/grants/${grantId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: vendor.trim(),
          amountCents: Math.round(amt * 100),
          purchaseDate: date,
          category,
          fileUrl: fileUrl || null,
        }),
      });
      resetForm();
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Receipts for Grant ${grantId}`} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-[var(--color-ember)]/20 bg-[var(--color-ember)]/5 px-3 py-2 text-sm text-[var(--color-ember)]">
            Failed to load receipts: {String((error as any)?.message ?? '')}
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 text-sm">
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
            {receipts.length
              ? `${receipts.length} receipt${receipts.length === 1 ? '' : 's'}`
              : 'No receipts yet'}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Total recorded:&nbsp;
            <span className="font-semibold text-[var(--color-text)]">
              {fmtMoney(total)}
            </span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-soft)]">
          <table className="min-w-full table-fixed text-xs">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-2 py-2 text-left">Date</th>
                <th className="px-2 py-2 text-left">Vendor</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-left">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border-soft)] last:border-none"
                >
                  <td className="px-2 py-2">{fmtDate(r.purchase_date)}</td>
                  <td className="px-2 py-2">{r.vendor}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {fmtMoney(r.amount_cents)}
                  </td>
                  <td className="px-2 py-2">{r.category || dash}</td>
                  <td className="px-2 py-2">
                    {r.file_url ? (
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-[var(--color-primary)] underline"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">{dash}</span>
                    )}
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-6 text-center text-[var(--color-text-muted)]"
                  >
                    No receipts have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 rounded-xl bg-[var(--color-surface-subtle)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Add receipt
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Vendor"
              className="col-span-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount ($)"
              type="number"
              className="col-span-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            />
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              className="col-span-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs"
              >
                <option value="program">Program Expense</option>
                <option value="restricted">Restricted Grant</option>
                <option value="personal">Personal/Benefit</option>
              </select>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="Link to photo / PDF (optional)"
              className="col-span-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={addReceipt}
              disabled={saving}
              className="rounded-xl bg-[var(--color-ember)] px-3 py-2 text-xs font-semibold text-warm-white hover:bg-[var(--color-bark)] disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Add receipt'}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/* ---------------- Modal shell ---------------- */
type ModalShellProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4 py-8 md:py-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-[0_24px_48px_-24px_rgba(20,63,42,0.35)]"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center">
          <h4 className="text-lg font-semibold text-[var(--color-text)]">{title}</h4>
        </div>
        {children}
      </div>
      </div>
    );
  }
