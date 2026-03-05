// app/barndobucks/Dashboard.tsx
'use client';

import React, { ReactNode, useMemo } from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';

type ExpectedRow = { case: string; capex: number | null; betaCF: number | null; er: number | null };
type OutcomeRow = {
  case: string;
  units: number | null;
  terminalValue: number | null;
  npv: number | null;
  irr: number | null;
  npvExTv: number | null;
  irr2: number | null;
  eR: number | null;
  roiFcf: number | null;
  roa: number | null;
};
type ProjectSummaryRow = { project: string; npv: number | null; irr: number | null };

type ApiData = {
  ok?: boolean;
  expectedReturn?: ExpectedRow[];
  comprehensiveOutcomes?: OutcomeRow[];
  projectSummary?: ProjectSummaryRow[];
  error?: string;
};

type Props = {
  username: string;
  role?: string | null;
  embedded?: boolean;
  hideProjectTotals?: boolean;
};

const dash = '—';

const formatMoney = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? `$${Math.round(value).toLocaleString()}` : dash;

const formatUnits = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : dash;

const formatPercent = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : dash;

function useBucksData(apiPath: string) {
  const [state, setState] = React.useState<{ data: ApiData; loading: boolean; error: string | null }>({
    data: {},
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(apiPath, { cache: 'no-store', signal: controller.signal });
        const body = (await res.json().catch(() => ({}))) as ApiData;
        if (!res.ok || body.ok === false) {
          throw new Error(body.error || `Fetch failed (${res.status})`);
        }
        setState({ data: body, loading: false, error: null });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to load BarndoBucks data';
        setState({ data: {}, loading: false, error: message });
      }
    })();
    return () => {
      controller.abort();
    };
  }, [apiPath]);

  return state;
}

type Column<T> = {
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
};

function DataSection<T>({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
}) {
  return (
    <SurfaceCard className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      {rows.length === 0 ? (
        <div className="text-sm text-[var(--color-text-muted)]">No data available yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
              <tr>
                {columns.map((column, idx) => (
                  <th
                    key={idx}
                    className={`px-2 py-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-[var(--color-border-soft)] last:border-none odd:bg-[var(--color-surface)] even:bg-[var(--color-surface-subtle)]"
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-2 py-3 align-top ${
                        column.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}

export default function BarndobucksDashboard({ username, role, embedded, hideProjectTotals }: Props) {
  const { data, loading, error } = useBucksData('/api/bucks-data?which=acres');

  const projectRows = useMemo(() => {
    const rows = data.projectSummary ?? [];
    return rows.length > 0 ? rows.slice(1) : rows;
  }, [data.projectSummary]);
  const expectedRows = useMemo(() => {
    const rows = data.expectedReturn ?? [];
    return rows.length > 0 ? rows.slice(1) : rows;
  }, [data.expectedReturn]);
  const outcomeRows = useMemo(() => {
    const rows = data.comprehensiveOutcomes ?? [];
    return rows.length > 0 ? rows.slice(1) : rows;
  }, [data.comprehensiveOutcomes]);

  return (
    <div className={`${embedded ? 'space-y-4' : 'space-y-6'} text-[var(--color-text)]`}>
      {error ? (
        <SurfaceCard variant="muted">
          <p className="text-sm text-[#c45d3e]">Failed to load BarndoBucks data: {error}</p>
        </SurfaceCard>
      ) : null}

      {loading ? (
        <SurfaceCard variant="muted">
          <p className="text-sm text-[var(--color-text-muted)]">Loading BarndoBucks metrics…</p>
        </SurfaceCard>
      ) : null}

      {!loading && (
        <>
          {!hideProjectTotals && (
            <DataSection<ProjectSummaryRow>
              title="Project NPV & IRR"
              rows={projectRows}
              columns={[
                {
                  header: 'Project',
                  render: (row) => <span className="font-medium text-[var(--color-text)]">{row.project}</span>,
                },
                { header: 'NPV', align: 'right', render: (row) => formatMoney(row.npv) },
                { header: 'IRR', align: 'right', render: (row) => formatPercent(row.irr) },
              ]}
            />
          )}

          <DataSection<ExpectedRow>
            title="Expected Rate of Return"
            rows={expectedRows}
            columns={[
              {
                header: 'Case',
                render: (row) => <span className="font-medium text-[var(--color-text)]">{row.case}</span>,
              },
              { header: 'CapEx', align: 'right', render: (row) => formatMoney(row.capex) },
              { header: 'Beta CF', align: 'right', render: (row) => formatMoney(row.betaCF) },
              { header: 'Expected Return', align: 'right', render: (row) => formatPercent(row.er) },
            ]}
          />

          <DataSection<OutcomeRow>
            title="500 Acres Comprehensive Outcomes"
            rows={outcomeRows}
            columns={[
              {
                header: 'Case',
                render: (row) => <span className="font-medium text-[var(--color-text)]">{row.case}</span>,
              },
              { header: 'Units', align: 'right', render: (row) => formatUnits(row.units) },
              { header: 'Terminal Value', align: 'right', render: (row) => formatMoney(row.terminalValue) },
              { header: 'NPV', align: 'right', render: (row) => formatMoney(row.npv) },
              { header: 'IRR', align: 'right', render: (row) => formatPercent(row.irr) },
              { header: 'NPV ex. Terminal', align: 'right', render: (row) => formatMoney(row.npvExTv) },
              { header: 'Secondary IRR', align: 'right', render: (row) => formatPercent(row.irr2) },
              { header: 'E[R]', align: 'right', render: (row) => formatPercent(row.eR) },
              { header: 'ROI (FCF)', align: 'right', render: (row) => formatPercent(row.roiFcf) },
              { header: 'ROA', align: 'right', render: (row) => formatPercent(row.roa) },
            ]}
          />
        </>
      )}
    </div>
  );
}
