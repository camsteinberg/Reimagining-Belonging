'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import SurfaceCard from '@/components/ui/SurfaceCard';
import BudgetAdmin from '@/components/fellowship/BudgetAdmin';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Fellow = { id: string; username?: string | null; email?: string | null; name: string };

export default function AdminDashboard() {
  const { data: fellows } = useSWR<Fellow[]>('/api/admin/fellows', fetcher);
  const [selected, setSelected] = useState<string>(''); // '' = All

  const kpisKey = useMemo(
    () => '/api/fellowship/kpis' + (selected ? `?userId=${selected}` : ''),
    [selected]
  );

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    (fellows || []).forEach((f) => m.set(f.id, f.name || f.username || f.email || f.id));
    return m;
  }, [fellows]);

  const [kpiEditId, setKpiEditId] = useState<number | null>(null);
  const [kpiTitle, setKpiTitle] = useState('');
  const [kpiObj, setKpiObj] = useState('');
  const [kpiTogglingId, setKpiTogglingId] = useState<number | null>(null);

  // Modals (Admin)
  const [openKpi, setOpenKpi] = useState(false);
  const defaultUserId = selected || (fellows?.[0]?.id ?? '');

  const { data: kpis, mutate: mKpi } = useSWR(kpisKey, fetcher);

  return (
    <div className="space-y-6 text-[var(--color-text)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold text-[var(--color-text)]">Fellowship Admin</h2>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span>Dataset: English</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            title="Filter by Fellow"
          >
            <option value="">All Fellows</option>
            {(fellows || []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || f.username || f.email || f.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget */}
      <BudgetAdmin />

      {/* KPIs */}
      <SurfaceCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <span className="h-6 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden />
            KPIs
          </h3>
          <button
            type="button"
            onClick={() => setOpenKpi(true)}
            className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-warm-white transition hover:brightness-95"
          >
            {selected ? `Add to ${nameById.get(selected)}` : 'Add'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
              <tr>
                <th className="w-[34%] px-2 py-2 text-left">Goal</th>
                <th className="w-[38%] px-2 py-2 text-left">Objective</th>
                <th className="w-[14%] px-2 py-2 text-center">User</th>
                <th className="w-[10%] px-2 py-2 text-center">Status</th>
                <th className="w-48 px-2 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(kpis || []).map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border-soft)] last:border-none"
                >
                  <td className="px-2 py-3 align-top">
                    {kpiEditId === r.id ? (
                      <input
                        className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        value={kpiTitle}
                        onChange={(e) => setKpiTitle(e.target.value)}
                      />
                    ) : (
                      <span className="font-medium text-[var(--color-text)]">
                        {r.title}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 align-top">
                    {kpiEditId === r.id ? (
                      <input
                        className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        value={kpiObj}
                        onChange={(e) => setKpiObj(e.target.value)}
                      />
                    ) : (
                      <span className="text-[var(--color-text)]">{r.objective}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center text-[var(--color-text)]">
                    {r.display_name || nameById.get(r.user_id) || r.user_id}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        r.is_done
                          ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                          : 'bg-[color-mix(in_srgb,var(--color-danger)_16%,_transparent)] text-[var(--color-danger)]'
                      }`}
                    >
                      {r.is_done ? 'Completed' : 'Open'}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    {kpiEditId === r.id ? (
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/fellowship/kpis', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: r.id,
                                title: kpiTitle,
                                objective: kpiObj,
                                isDone: r.is_done,
                              }),
                            });
                            setKpiEditId(null);
                            mKpi();
                          }}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-warm-white transition hover:brightness-95"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setKpiEditId(null)}
                          className="rounded-lg bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setKpiEditId(r.id);
                            setKpiTitle(r.title);
                            setKpiObj(r.objective);
                          }}
                          className="rounded-lg bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)] hover:text-warm-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={kpiTogglingId === r.id}
                          onClick={async () => {
                            setKpiTogglingId(r.id);
                            try {
                              const res = await fetch('/api/fellowship/kpis', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: r.id,
                                  title: r.title,
                                  objective: r.objective,
                                  isDone: !r.is_done,
                                }),
                              });
                              if (!res.ok) {
                                throw new Error('Failed to update KPI status');
                              }
                              mKpi();
                            } catch (err) {
                              console.error('[admin][kpi][toggle]', err);
                            } finally {
                              setKpiTogglingId(null);
                            }
                          }}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            r.is_done
                              ? 'bg-[var(--color-surface-subtle)] text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]'
                              : 'bg-[var(--color-primary)] text-warm-white hover:brightness-95'
                          } ${kpiTogglingId === r.id ? 'opacity-70' : ''}`}
                        >
                          {r.is_done ? 'Mark open' : 'Mark complete'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/fellowship/kpis?id=${r.id}`, {
                              method: 'DELETE',
                            });
                            mKpi();
                          }}
                          className="rounded-lg bg-[var(--color-danger)] px-3 py-2 text-xs font-semibold text-warm-white transition hover:brightness-90"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(!kpis || kpis.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    No KPIs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {/* --- Add KPI Modal --- */}
      {openKpi && (
        <AddKpiModal
          fellows={fellows || []}
          defaultUserId={defaultUserId}
          onClose={() => setOpenKpi(false)}
          onAdded={() => {
            setOpenKpi(false);
            mKpi();
          }}
        />
      )}
    </div>
  );
}

/* ====================== Modals ====================== */

function ModalShell({
  title,
  children,
  onClose,
  onPrimary,
  primaryLabel,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onPrimary: () => void;
  primaryLabel: string;
}) {
                  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text)] shadow-[var(--surface-card-shadow)]">
        <h4 className="mb-4 text-lg font-semibold text-center text-[var(--color-text)]">
          {title}
        </h4>
        <div className="grid grid-cols-2 gap-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-warm-white transition hover:brightness-95"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddKpiModal({
  fellows,
  defaultUserId,
  onClose,
  onAdded,
}: {
  fellows: Fellow[];
  defaultUserId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [title, setTitle] = React.useState('');
  const [objective, setObjective] = React.useState('');
  const [userId, setUserId] = React.useState(defaultUserId);

  const doAdd = async () => {
    if (!title || !objective) return;
    await fetch('/api/fellowship/kpis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        objective: objective.trim(),
        userId: userId || undefined,
      }),
    });
    onAdded();
  };

                  return (
    <ModalShell title="Add KPI" onClose={onClose} onPrimary={doAdd} primaryLabel="Add">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Goal"
        className="col-span-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
      <input
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="Objective"
        className="col-span-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="col-span-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        title="Assign to Fellow"
      >
        {(fellows || []).map((f) => (
          <option key={f.id} value={f.id}>
            {f.name || f.username || f.email || f.id}
          </option>
        ))}
      </select>
    </ModalShell>
  );
}
