'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import SurfaceCard from '@/components/ui/SurfaceCard';
import BudgetChart, { BudgetRow } from './BudgetChart';

type ApiResponse = { headers: string[]; rows: BudgetRow[] };
type Fellow = { id: string; username?: string | null; email?: string | null; name?: string | null };
type KpiRow = {
  id: number;
  user_id?: string | null;
  display_name?: string | null;
  title?: string | null;
  is_done?: boolean | null;
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
  status: string;
  linked_kpi_ids?: number[] | null;
  requested_by_date: string | null;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
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
};
type UIGrant = GrantRow & {
  approvedCents: number;
  remainingCents: number;
  utilization: number;
  overBudget: boolean;
  linkedKpiLabels: string[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
  return json;
};

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value: unknown) => `$${parseNumber(value).toLocaleString()}`;
const normalizeLabel = (value: unknown) =>
  typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

type KpiSummary = { completed: number; pending: number; total: number };
const formatMoneyCents = (cents?: number | null) => {
  if (cents == null) return '-';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildKpiSummary = (kpis?: KpiRow[] | null) => {
  const map = new Map<string, KpiSummary>();
  (kpis || []).forEach((kpi) => {
    const key = normalizeLabel(kpi.display_name) || normalizeLabel(kpi.user_id);
    if (!key) return;
    const bucket = map.get(key) || { completed: 0, pending: 0, total: 0 };
    bucket.total += 1;
    if (kpi.is_done) bucket.completed += 1;
    else bucket.pending += 1;
    map.set(key, bucket);
  });
  return map;
};

export default function BudgetAdmin() {
  const MIN_RECEIPT_FILE_BYTES = 240;
  const MAX_RECEIPT_FILE_BYTES = 10 * 1024 * 1024;
  const { data, error, mutate } = useSWR<ApiResponse>('/api/budget', fetcher);
  const { data: fellowsData } = useSWR<Fellow[]>('/api/admin/fellows', fetcher);
  const { data: kpiData } = useSWR<KpiRow[]>('/api/fellowship/kpis', fetcher);
  const {
    data: grantsData,
    error: grantsError,
    mutate: refreshGrants,
  } = useSWR<GrantRow[]>('/api/fellowship/grants', fetcher);

  const fellowOptions = useMemo(
    () =>
      (fellowsData || []).map((f) => {
        const label =
          (f.name && f.name.trim()) ||
          (f.username && f.username.trim()) ||
          (f.email && f.email.trim()) ||
          f.id;
        return { key: f.id, label };
      }),
    [fellowsData]
  );
  const knownLabels = useMemo(() => new Set(fellowOptions.map((opt) => opt.label)), [fellowOptions]);

  const kpiSummary = useMemo(() => buildKpiSummary(kpiData), [kpiData]);
  const kpiLabelById = useMemo(() => {
    const m = new Map<number, string>();
    (kpiData || []).forEach((k: any) => {
      if (k?.id == null) return;
      const label = (k?.title || k?.display_name || '').trim() || `KPI #${k.id}`;
      m.set(Number(k.id), label);
    });
    return m;
  }, [kpiData]);

  const rows: BudgetRow[] = useMemo(
    () =>
      (data?.rows || []).map((row) => {
        const labelKey = normalizeLabel(row.fellow);
        const summary = labelKey ? kpiSummary.get(labelKey) : undefined;
        return {
          ...row,
          allocated: parseNumber(row.allocated),
          actual: parseNumber(row.actual),
          kpiCompleted: summary?.completed ?? 0,
          kpiPending: summary?.pending ?? 0,
          kpiTotal: summary?.total ?? 0,
        };
      }),
    [data?.rows, kpiSummary]
  );

  const grants: UIGrant[] = useMemo(() => {
    return (grantsData || []).map((g) => {
      const approvedCents = g.amount_approved_cents ?? g.amount_requested_cents ?? 0;
      const remainingCents = approvedCents - (g.amount_spent_cents ?? 0);
      const utilization =
        approvedCents > 0 ? Math.min(Math.max((g.amount_spent_cents ?? 0) / approvedCents, 0), 2) : 0;
      const overBudget = approvedCents > 0 && (g.amount_spent_cents ?? 0) > approvedCents;
      return {
        ...g,
        approvedCents,
        remainingCents,
        utilization,
        overBudget,
        linkedKpiLabels: (g.linked_kpi_ids || []).map(
          (id) => kpiLabelById.get(id) || `KPI #${id}`
        ),
      };
    });
  }, [grantsData, kpiLabelById]);

  const [edit, setEdit] = useState<BudgetRow | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFellowName, setNewFellowName] = useState('');
  const [newAllocated, setNewAllocated] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [grantView, setGrantView] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [grantFellowFilter, setGrantFellowFilter] = useState('');
  const [detailsGrant, setDetailsGrant] = useState<UIGrant | null>(null);
  const {
    data: detailsReceipts,
    error: detailsReceiptsError,
  } = useSWR<ReceiptRow[]>(
    detailsGrant ? `/api/fellowship/grants/${detailsGrant.id}/receipts` : null,
    fetcher
  );
  const receiptsForDetails = Array.isArray(detailsReceipts) ? detailsReceipts : [];
  const [pendingMenuId, setPendingMenuId] = useState<number | null>(null);
  const uploadReceipt = async (g: UIGrant) => {
    try {
      const vendor = window.prompt('Vendor/merchant?')?.trim();
      if (!vendor) return;
      const amountStr = window.prompt('Amount ($)?')?.trim();
      const amountNum = Number(amountStr);
      if (!amountNum || !Number.isFinite(amountNum)) return;
      const date =
        window.prompt('Purchase date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10))?.trim() ||
        new Date().toISOString().slice(0, 10);
      const fileUrl = window.prompt('Receipt URL (public image/PDF URL)?')?.trim();
      if (!fileUrl) return;

      await fetch(`/api/fellowship/grants/${g.id}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor,
          amountCents: Math.round(amountNum * 100),
          purchaseDate: date,
          category: 'program',
          fileUrl,
        }),
      });
      alert('Receipt uploaded.');
    } catch (err) {
      console.error('[admin][uploadReceipt]', err);
      alert('Failed to upload receipt.');
    }
  };
  const [pendingMenuCoords, setPendingMenuCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [grantUpdatingId, setGrantUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadGrant, setUploadGrant] = useState<UIGrant | null>(null);
  const [uploadVendor, setUploadVendor] = useState('');
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileError, setUploadFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const resetUpload = () => {
    setUploadVendor('');
    setUploadAmount('');
    setUploadDate(new Date().toISOString().slice(0, 10));
    setUploadFileUrl('');
    setUploadFileName('');
    setUploadFileError(null);
    setUploading(false);
  };

  const startEdit = (row: BudgetRow) => setEdit({ ...row });
  const cancelEdit = () => setEdit(null);
  const normalizeStatus = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    if (['submitted', 'pending', 'under_review', 'feedback_requested'].includes(s)) return 'pending';
    if (['approved', 'active'].includes(s)) return 'approved';
    if (['closed', 'completed'].includes(s)) return 'closed';
    if (['denied', 'rejected'].includes(s)) return 'denied';
    return s || '-';
  };

  const save = async () => {
    if (!edit) return;
    await fetch('/api/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rowIndex: edit.rowIndex,
        fellow: edit.fellow,
        allocated: parseNumber(edit.allocated),
        actual: parseNumber(edit.actual), // backend will override Actual from DB on GET
      }),
    });
    setEdit(null);
    mutate();
  };

  const addBlank = async (fellowName: string, allocatedValue: number) => {
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fellow: fellowName, allocated: allocatedValue, actual: 0 }),
    });
    if (!res.ok) {
      throw new Error(`Failed to create budget row (HTTP ${res.status})`);
    }
    mutate();
  };

  const remove = async (rowIndex: number) => {
    await fetch('/api/budget', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIndex }),
    });
    mutate();
  };

  const decideGrant = async (
    grant: UIGrant,
    action: 'approve' | 'approve_mod' | 'deny' | 'feedback' | 'review',
    extra?: {
      amountApprovedCents?: number;
      amountRequestedCents?: number;
      denialReason?: string;
      category?: string | null;
      project?: string | null;
      purpose?: string | null;
      requestedByDate?: string | null;
    }
  ) => {
    try {
      setActionError(null);
      setPendingMenuId(null);
      setGrantUpdatingId(grant.id);
      const res = await fetch('/api/fellowship/grants/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grant.id,
          action,
          amountApprovedCents: extra?.amountApprovedCents,
          amountRequestedCents: extra?.amountRequestedCents,
          denialReason: extra?.denialReason,
          category: extra?.category,
          project: extra?.project,
          purpose: extra?.purpose,
          requestedByDate: extra?.requestedByDate,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update grant (HTTP ${res.status})`);
      }
      await refreshGrants?.();
    } catch (err) {
      setActionError((err as Error)?.message || 'Failed to update grant.');
    } finally {
      setGrantUpdatingId(null);
    }
  };

  const handleApproveWithEdit = (grant: UIGrant) => {
    const currentAmount =
      (grant.amount_approved_cents ?? grant.amount_requested_cents ?? 0) / 100;
    const nextAmountInput = window.prompt(
      'Approve with edits: enter the approved amount (USD)',
      currentAmount.toString()
    );
    if (nextAmountInput == null) return;
    const nextAmount = Math.round(Number(nextAmountInput) * 100);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setActionError('Please enter a valid dollar amount to approve.');
      return;
    }
    void decideGrant(grant, 'approve_mod', { amountApprovedCents: nextAmount });
  };

  const handleDeny = (grant: UIGrant) => {
    const reason = window.prompt('Add a short reason for denying this grant');
    if (!reason || !reason.trim()) return;
    void decideGrant(grant, 'deny', { denialReason: reason.trim() });
  };

  const closePendingMenu = () => {
    setPendingMenuId(null);
    setPendingMenuCoords(null);
  };

  const togglePendingMenu = (grantId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (pendingMenuId === grantId) {
      closePendingMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192; // w-48
    const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
    setPendingMenuId(grantId);
    setPendingMenuCoords({
      top: rect.bottom + 8,
      left: Math.max(8, left),
    });
  };

  const openUploadModal = (g: UIGrant) => {
    setUploadGrant(g);
    setUploadVendor('');
    setUploadAmount('');
    setUploadDate(new Date().toISOString().slice(0, 10));
    setUploadFileUrl('');
    setUploadFileName('');
  };

  const submitUpload = async () => {
    if (!uploadGrant) return;
    const vendor = uploadVendor.trim();
    const amt = Number(uploadAmount || 0);
    const date = uploadDate.trim();
    const fileUrl = uploadFileUrl.trim();
    if (!vendor || !amt || !date || !fileUrl) return;
    if (uploadFileError) {
      alert(uploadFileError);
      return;
    }
    setUploading(true);
    try {
      await fetch(`/api/fellowship/grants/${uploadGrant.id}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor,
          amountCents: Math.round(amt * 100),
          purchaseDate: date,
          category: 'program',
          fileUrl,
        }),
      });
      resetUpload();
      setUploadGrant(null);
    } catch (err) {
      console.error('[admin][uploadReceipt]', err);
      alert('Failed to upload receipt.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!pendingMenuId) return;
    const handleClick = () => {
      closePendingMenu();
    };
    const handleKey = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') handleClick();
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [pendingMenuId]);

  const grantViews = [
    { key: 'pending', label: 'Pending approvals' },
    { key: 'approved', label: 'Approved' },
    { key: 'denied', label: 'Denied' },
  ] as const;

  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      const normStatus = normalizeStatus(g.status);
      if (grantView === 'pending' && normStatus !== 'pending') return false;
      if (grantView === 'approved' && normStatus !== 'approved') return false;
      if (grantView === 'denied' && normStatus !== 'denied') return false;

      if (grantFellowFilter && normalizeLabel(g.display_name || g.fellow_id).indexOf(normalizeLabel(grantFellowFilter)) === -1) {
        return false;
      }
      return true;
    });
  }, [grants, grantView, grantFellowFilter]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dt);
  };

  const truncateKpiLabel = (label: string, max = 80) => {
    if (!label) return '';
    return label.length > max ? `${label.slice(0, max - 3)}...` : label;
  };

  return (
    <div className="space-y-6">
      <SurfaceCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
            Budget (all fellows)
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Add row
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text)]">Add budget row</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                aria-label="Close add budget modal"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Fellow</label>
                <input
                  list="fellow-options"
                  className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Start typing a fellow name"
                  value={newFellowName}
                  onChange={(e) => {
                    setNewFellowName(e.target.value);
                    setAddError(null);
                  }}
                />
                <datalist id="fellow-options">
                  {fellowOptions.map((opt) => (
                    <option key={opt.key} value={opt.label} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">Allocated</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="0"
                  value={newAllocated}
                  onChange={(e) => {
                    setNewAllocated(e.target.value);
                    setAddError(null);
                  }}
                />
              </div>

              {addError ? <p className="text-sm text-[#c45d3e]">{addError}</p> : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                  }}
                  className="rounded-lg border border-[var(--color-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={addingRow}
                  onClick={async () => {
                    const fellowName = newFellowName.trim();
                    if (!fellowName) {
                      setAddError('Fellow is required.');
                      return;
                    }
                    setAddingRow(true);
                    try {
                      await addBlank(fellowName, parseNumber(newAllocated));
                      setShowAddModal(false);
                      setNewFellowName('');
                      setNewAllocated('');
                      setAddError(null);
                    } catch (err) {
                      setAddError((err as Error)?.message || 'Failed to add row.');
                    } finally {
                      setAddingRow(false);
                    }
                  }}
                  className={`rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 ${
                    addingRow ? 'opacity-70' : ''
                  }`}
                >
                  {addingRow ? 'Adding…' : 'Add row'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!data && !error && (
        <div className="text-sm text-center text-[var(--color-text-muted)]">Loading budget…</div>
      )}
      {error && (
        <div className="rounded-xl border border-[#c45d3e]/20 bg-[#c45d3e]/5 px-3 py-2 text-sm text-[#c45d3e] text-center">
          Failed to load budget: {String((error as any)?.message ?? '')}
        </div>
      )}

      {rows.length > 0 && <BudgetChart rows={rows} />}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
            <tr>
              <th className="w-2/5 px-1 py-2 text-center">Fellow</th>
              <th className="px-1 py-2 text-center">Allocated</th>
              <th className="px-1 py-2 text-center">Actual</th>
              <th className="w-44 px-1 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const editing = edit?.rowIndex === row.rowIndex;
              const currentFellowValue = editing ? String(edit?.fellow ?? '').trim() : '';
              const hasKnownOption = editing ? knownLabels.has(currentFellowValue) : false;
              return (
                <tr
                  key={row.rowIndex}
                  className="border-b border-[var(--color-border-soft)] last:border-none"
                >
                  <td className="px-1 py-2.5 align-middle text-center">
                    {editing ? (
                      <select
                        className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm"
                        value={currentFellowValue}
                        onChange={(e) => setEdit({ ...edit!, fellow: e.target.value })}
                      >
                        <option value="">Select fellow</option>
                        {!hasKnownOption && currentFellowValue && (
                          <option value={currentFellowValue}>{currentFellowValue}</option>
                        )}
                        {fellowOptions.map((opt) => (
                          <option key={opt.key} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-[var(--color-text)]">
                        {row.fellow || '-'}
                      </span>
                    )}
                  </td>

                  <td className="px-1 py-2.5 text-center align-middle tabular-nums">
                    {editing ? (
                      <input
                        className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm"
                        type="number"
                        value={parseNumber(edit!.allocated)}
                        onChange={(e) =>
                          setEdit({ ...edit!, allocated: parseNumber(e.target.value) })
                        }
                      />
                    ) : (
                      money(row.allocated)
                    )}
                  </td>

                  {/* Actual is read-only (computed from spend) */}
                  <td className="px-1 py-2.5 text-center align-middle tabular-nums">
                    <div className="flex flex-col items-center gap-1">
                      <span>{money(row.actual)}</span>
                    </div>
                  </td>

                  <td className="px-1 py-2.5 text-center">
                    {editing ? (
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={save}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white hover:brightness-95"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-strong)] hover:bg-[var(--color-primary)] hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row.rowIndex)}
                          className="rounded-lg bg-[var(--color-danger)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-90"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-[var(--color-text-muted)]">
                  No rows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
      <SurfaceCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
            Grants
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex overflow-hidden rounded-lg border border-[var(--color-border-soft)]">
              {grantViews.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setGrantView(opt.key)}
                  className={`px-3 py-1 text-xs font-semibold transition ${
                    grantView === opt.key
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <select
            className="w-48 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={grantFellowFilter}
            onChange={(e) => setGrantFellowFilter(e.target.value)}
            aria-label="Filter by fellow"
          >
            <option value="">All fellows</option>
            {fellowOptions.map((opt) => (
              <option key={opt.key} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {!grantsData && !grantsError && (
          <div className="text-sm text-center text-[var(--color-text-muted)]">Loading grants…</div>
        )}
        {grantsError && (
          <div className="rounded-xl border border-[#c45d3e]/20 bg-[#c45d3e]/5 px-3 py-2 text-sm text-[#c45d3e] text-center">
            Failed to load grants: {String((grantsError as any)?.message ?? '')}
          </div>
        )}
        {actionError && (
          <div className="rounded-xl border border-[#c45d3e]/20 bg-[#c45d3e]/5 px-3 py-2 text-xs text-[#c45d3e]">
            {actionError}
          </div>
        )}

        <div className="relative overflow-x-auto overflow-y-visible">
          {grantView === 'pending' ? (
            <table className="w-full table-fixed text-sm">
              <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-2 py-2 text-center">Fellow</th>
                  <th className="px-2 py-2 text-center">Created</th>
                  <th className="px-2 py-2 text-center">Needed by</th>
                  <th className="px-2 py-2 text-center">Requested</th>
                  <th className="px-2 py-2 text-center">Purpose</th>
                  <th className="px-2 py-2 text-center">KPI</th>
                  <th className="px-2 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrants.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-[var(--color-border-soft)] last:border-none"
                  >
                    <td className="px-2 py-3 align-middle text-center font-semibold text-[var(--color-text)]">
                      {g.display_name || g.fellow_id}
                    </td>
                    <td className="px-2 py-3 align-middle text-center text-[var(--color-text)]">
                      {formatDate(g.created_at)}
                    </td>
                    <td className="px-2 py-3 align-middle text-center text-[var(--color-text)]">
                      {formatDate(g.requested_by_date)}
                    </td>
                    <td className="px-2 py-3 align-middle text-center tabular-nums">
                      {formatMoneyCents(g.amount_requested_cents)}
                    </td>
                    <td className="px-2 py-3 align-middle text-center">
                      <span className="line-clamp-2 text-[var(--color-text)]">
                        {g.purpose || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle text-center">
                      {g.linkedKpiLabels && g.linkedKpiLabels.length > 0 ? (
                        <div className="flex flex-col items-center gap-1 text-xs text-[var(--color-text)]">
                          {g.linkedKpiLabels.map((label, idx) => (
                            <span
                              key={`${label}-${idx}`}
                              className="max-w-[14rem] text-center font-semibold leading-snug line-clamp-2"
                            >
                              {truncateKpiLabel(label)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">None</span>
                      )}
                    </td>
                    <td className="px-2 py-3 align-middle text-center">
                      <div className="relative inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decideGrant(g, 'approve')}
                          disabled={grantUpdatingId === g.id}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                          title="Approve"
                        >
                          {grantUpdatingId === g.id ? 'Updating…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePendingMenu(g.id, e);
                          }}
                          className="rounded-lg border border-[var(--color-border-soft)] px-2 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
                          aria-haspopup="menu"
                          aria-expanded={pendingMenuId === g.id}
                          aria-controls={`pending-menu-${g.id}`}
                          title="More actions"
                        >
                          ...
                        </button>
                        {pendingMenuId === g.id && pendingMenuCoords && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={closePendingMenu} />
                            <div
                              id={`pending-menu-${g.id}`}
                              className="fixed z-30 w-48 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-2xl ring-1 ring-black/5"
                              role="menu"
                              style={{ top: pendingMenuCoords.top, left: pendingMenuCoords.left }}
                            >
                              <button
                                type="button"
                                disabled={grantUpdatingId === g.id}
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => handleApproveWithEdit(g)}
                              >
                                Approve w/ edit
                              </button>
                              <button
                                type="button"
                                disabled={grantUpdatingId === g.id}
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => handleDeny(g)}
                              >
                                Deny
                              </button>
                              <button
                                type="button"
                                disabled={grantUpdatingId === g.id}
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => {
                                  setPendingMenuId(null);
                                  setPendingMenuCoords(null);
                                  setDetailsGrant(g);
                                }}
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                disabled={grantUpdatingId === g.id}
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => {
                                  setPendingMenuId(null);
                                  setPendingMenuCoords(null);
                                  openUploadModal(g);
                                }}
                              >
                                Upload receipt
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGrants.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-8 text-center text-[var(--color-text-muted)]"
                    >
                      No pending grants.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-2 py-2 text-center">Fellow</th>
                  <th className="px-2 py-2 text-center">Status</th>
                  <th className="px-2 py-2 text-center">Approved</th>
                  <th className="px-2 py-2 text-center">Disbursed</th>
                  <th className="px-2 py-2 text-center">Spent</th>
                  <th className="px-2 py-2 text-center">Remaining</th>
                  <th className="px-2 py-2 text-center">KPI</th>
                  <th className="px-2 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrants.map((g) => {
                  const remainingCents = g.remainingCents ?? 0;
                  const remainingLabel = formatMoneyCents(remainingCents);
                  const statusLabel = normalizeStatus(g.status);
                  return (
                    <tr
                      key={g.id}
                      className="border-b border-[var(--color-border-soft)] last:border-none"
                    >
                      <td className="px-2 py-3 align-middle text-center">
                        <span className="font-semibold text-[var(--color-text)]">
                          {g.display_name || g.fellow_id}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusLabel === 'pending'
                              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                              : statusLabel === 'approved'
                              ? 'bg-[#6b8f71]/15 text-[#3d6b4f]'
                              : statusLabel === 'closed'
                              ? 'bg-slate-200 text-slate-800'
                              : statusLabel === 'denied'
                              ? 'bg-[#c45d3e]/10 text-[#c45d3e]'
                              : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle text-center tabular-nums">
                        {formatMoneyCents(g.approvedCents)}
                      </td>
                      <td className="px-2 py-3 align-middle text-center tabular-nums">
                        {formatMoneyCents(g.amount_disbursed_cents)}
                      </td>
                      <td className="px-2 py-3 align-middle text-center tabular-nums">
                        {formatMoneyCents(g.amount_spent_cents)}
                      </td>
                      <td
                        className={`px-2 py-3 align-middle text-center tabular-nums ${
                          remainingCents < 0 ? 'text-[var(--color-danger)]' : ''
                        }`}
                      >
                        {remainingLabel}
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        {g.linkedKpiLabels && g.linkedKpiLabels.length > 0 ? (
                          <div className="flex flex-col items-center gap-1 text-xs text-[var(--color-text)]">
                            {g.linkedKpiLabels.map((label, idx) => (
                              <span
                                key={`${label}-${idx}`}
                                className="max-w-[14rem] text-center font-semibold leading-snug line-clamp-2"
                              >
                                {truncateKpiLabel(label)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">None</span>
                        )}
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openUploadModal(g)}
                            className="rounded-lg bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]"
                            title="Upload receipt"
                          >
                            Upload receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailsGrant(g)}
                            className="rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
                            title="View details"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredGrants.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-2 py-8 text-center text-[var(--color-text-muted)]"
                    >
                      No grants match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </SurfaceCard>
      {uploadGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text)]">
                  Upload receipt
                </h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {uploadGrant.display_name || uploadGrant.fellow_id} · Grant #{uploadGrant.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadGrant(null);
                  resetUpload();
                }}
                className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                aria-label="Close upload"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <label className="space-y-1 block">
                <span className="text-[var(--color-text-muted)]">Vendor</span>
                <input
                  className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2"
                  value={uploadVendor}
                  onChange={(e) => setUploadVendor(e.target.value)}
                  placeholder="Merchant"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <span className="text-[var(--color-text-muted)]">Amount ($)</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2"
                    value={uploadAmount}
                    onChange={(e) => setUploadAmount(e.target.value)}
                    min={0}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[var(--color-text-muted)]">Purchase date</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                  />
                </label>
              </div>
              <label className="space-y-1 block">
                <span className="text-[var(--color-text-muted)]">Receipt file (image/PDF)</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[var(--color-primary-strong)]"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setUploadFileUrl('');
                      setUploadFileName('');
                      setUploadFileError(null);
                      return;
                    }
                    if (file.size < MIN_RECEIPT_FILE_BYTES) {
                      setUploadFileError('File is too small (must be at least 240 bytes).');
                      setUploadFileUrl('');
                      setUploadFileName('');
                      return;
                    }
                    if (file.size > MAX_RECEIPT_FILE_BYTES) {
                      setUploadFileError('File is too large (limit is 10 MB).');
                      setUploadFileUrl('');
                      setUploadFileName('');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setUploadFileUrl(String(reader.result || ''));
                      setUploadFileName(file.name);
                      setUploadFileError(null);
                    };
                    reader.onerror = () => {
                      setUploadFileUrl('');
                      setUploadFileName('');
                      setUploadFileError('Could not read file. Please try again.');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {uploadFileError && (
                  <p className="text-xs text-[#c45d3e]">{uploadFileError}</p>
                )}
                {uploadFileName && (
                  <p className="text-xs text-[var(--color-text-muted)]">Selected: {uploadFileName}</p>
                )}
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setUploadGrant(null);
                  resetUpload();
                }}
                className="rounded-lg bg-[var(--color-surface-subtle)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitUpload}
                disabled={
                  uploading ||
                  !uploadVendor.trim() ||
                  !uploadFileUrl.trim() ||
                  !Number(uploadAmount || 0) ||
                  !!uploadFileError
                }
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-70"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
      {detailsGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text)]">Grant details</h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {detailsGrant.display_name || detailsGrant.fellow_id} ·{' '}
                  {normalizeStatus(detailsGrant.status)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsGrant(null)}
                className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Requested
                </div>
                <div className="text-base font-semibold text-[var(--color-text)]">
                  {formatMoneyCents(detailsGrant.amount_requested_cents)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Approved
                </div>
                <div className="text-base font-semibold text-[var(--color-text)]">
                  {formatMoneyCents(detailsGrant.approvedCents)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Disbursed
                </div>
                <div className="text-base font-semibold text-[var(--color-text)]">
                  {formatMoneyCents(detailsGrant.amount_disbursed_cents)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Spent
                </div>
                <div className="text-base font-semibold text-[var(--color-text)]">
                  {formatMoneyCents(detailsGrant.amount_spent_cents)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Created
                </div>
                <div className="text-base text-[var(--color-text)]">
                  {formatDate(detailsGrant.created_at)}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Needed by
                </div>
                <div className="text-base text-[var(--color-text)]">
                  {formatDate(detailsGrant.requested_by_date)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--color-border-soft)] p-4 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Purpose
              </div>
              <p className="mt-2 leading-relaxed text-[var(--color-text)]">
                {detailsGrant.purpose || 'No purpose provided.'}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--color-border-soft)] p-4 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Linked KPIs
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {detailsGrant.linkedKpiLabels?.length ? (
                  detailsGrant.linkedKpiLabels.map((label, idx) => (
                    <span
                      key={`${label}-${idx}`}
                      className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-strong)]"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-[var(--color-text-muted)]">None</span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--color-border-soft)] p-4 text-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Receipts
              </div>
              {detailsReceiptsError && (
                <p className="mt-2 text-xs text-[#c45d3e]">
                  Failed to load receipts: {String((detailsReceiptsError as any)?.message ?? '')}
                </p>
              )}
              {receiptsForDetails.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {receiptsForDetails.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--color-surface-subtle)] px-3 py-2"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                          {r.vendor || 'Receipt'}
                        </span>
                        <span className="text-[0.8rem] text-[var(--color-text-muted)]">
                          {formatDate(r.purchase_date)} · {formatMoneyCents(r.amount_cents)}
                        </span>
                      </div>
                      {r.file_url ? (
                        <a
                          href={r.file_url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[var(--color-primary)] underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">No file</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[var(--color-text-muted)]">
                  {detailsReceiptsError
                    ? 'No receipts available.'
                    : 'Loading receipts or none uploaded yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
