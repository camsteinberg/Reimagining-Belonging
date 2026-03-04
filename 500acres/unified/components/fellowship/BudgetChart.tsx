'use client';

import type { ComponentProps } from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type BudgetRow = {
  rowIndex: number;
  fellow: string;
  allocated: number | null;
  actual: number | null;
  kpiCompleted?: number | null;
  kpiPending?: number | null;
  kpiTotal?: number | null;
};

const dash = '—';
const fmtMoney = (value: unknown) => `$${Number(value ?? 0).toLocaleString()}`;

// Palette tuned to the app's green-focused theme
const ALLOCATED = 'var(--color-danger)';
const KPI_COMPLETED = '#48c58a';
const KPI_PENDING = '#b7e4cc';
const AXIS = 'rgba(20,63,42,0.58)';
const LABEL = 'rgba(20,63,42,0.82)';
type Summary = { completed: number; pending: number; total: number };
type RectangleShapeProps = ComponentProps<typeof Rectangle> & {
  payload?: Record<string, unknown>;
};

const KPI_OUTSTANDING_RADIUS_WITH_COMPLETED: [number, number, number, number] = [0, 0, 6, 6];
const KPI_OUTSTANDING_RADIUS_SOLO: [number, number, number, number] = [6, 6, 6, 6];
const KPI_COMPLETED_RADIUS_WITH_OUTSTANDING: [number, number, number, number] = [6, 6, 0, 0];
const KPI_COMPLETED_RADIUS_SOLO: [number, number, number, number] = [6, 6, 6, 6];

function makeSummaryTick(summaryByName: Record<string, Summary>) {
  return function SummaryTick(props: any) {
    const { x, y, payload } = props;
    const name = String(payload?.value ?? dash);
    const summary = summaryByName[name] || { completed: 0, pending: 0, total: 0 };
    const { completed, total } = summary;
    const message =
      total > 0 ? `KPIs: ${completed}/${total}` : 'No KPI records';

    return (
      <g transform={`translate(${x},${y})`}>
        <text dy={14} textAnchor="middle" fill={LABEL} fontSize={12}>
          {name}
        </text>
        <text dy={32} textAnchor="middle" fill={LABEL} fontSize={11}>
          {message}
        </text>
      </g>
    );
  };
}

export default function BudgetChart({ rows }: { rows: BudgetRow[] }) {
  const data = (rows || [])
    .filter((row) => row && (row.fellow || row.allocated || row.actual))
    .map((row) => {
      const allocated = Number(row.allocated ?? 0);
      const completedCount = Math.max(Number(row.kpiCompleted ?? 0), 0);
      const pendingCount = Math.max(
        Number(row.kpiPending ?? (Number(row.kpiTotal ?? 0) - Number(row.kpiCompleted ?? 0))),
        0
      );
      const total = Math.max(Number(row.kpiTotal ?? 0) || completedCount + pendingCount, 0);
      const completedRatio = total > 0 ? completedCount / total : 0;
      const pendingRatio = total > 0 ? pendingCount / total : 0;

      return {
        name: row.fellow || dash,
        Allocated: allocated,
        kpiCompletedCount: completedCount,
        kpiPendingCount: pendingCount,
        kpiTotal: total,
        'KPIs Completed': completedRatio,
        'KPIs Outstanding': pendingRatio,
      };
    });

  const summaryByName: Record<string, Summary> = {};
  for (const d of data) {
    const completed = Number(d.kpiCompletedCount ?? 0);
    const pending = Number(d.kpiPendingCount ?? 0);
    summaryByName[d.name] = {
      completed,
      pending,
      total: completed + pending,
    };
  }
  const SummaryTick = makeSummaryTick(summaryByName);

  const labelFormatter: any = (v: number) => fmtMoney(v);
  const kpiCompletedLabelFormatter: any = (_: number, entry: any) => {
    const payload = entry?.payload ?? {};
    const count = Number(payload.kpiCompletedCount ?? 0);
    return count > 0 ? `${count}` : '';
  };
  const kpiOutstandingLabelFormatter: any = (_: number, entry: any) => {
    const payload = entry?.payload ?? {};
    const count = Number(payload.kpiPendingCount ?? 0);
    return count > 0 ? `${count}` : '';
  };
  const tooltipFormatter: any = (val: number, key: string, entry: any) => {
    const payload = entry?.payload ?? {};
    if (key === 'Allocated') return [fmtMoney(val), key];
    if (key === 'KPIs Completed') {
      const count = Number(payload.kpiCompletedCount ?? 0);
      return [`${count} KPI${count === 1 ? '' : 's'}`, key];
    }
    if (key === 'KPIs Outstanding') {
      const count = Number(payload.kpiPendingCount ?? 0);
      return [`${count} KPI${count === 1 ? '' : 's'}`, key];
    }
    return [String(val), key];
  };

  const renderKpiOutstanding = (rawProps: unknown) => {
    const { payload = {}, ...rest } = (rawProps ?? {}) as RectangleShapeProps;
    const hasCompleted = Number(payload['KPIs Completed'] ?? 0) > 0;
    const radius = hasCompleted
      ? KPI_OUTSTANDING_RADIUS_WITH_COMPLETED
      : KPI_OUTSTANDING_RADIUS_SOLO;
    return <Rectangle {...rest} radius={radius} />;
  };

  const renderKpiCompleted = (rawProps: unknown) => {
    const { payload = {}, ...rest } = (rawProps ?? {}) as RectangleShapeProps;
    const hasOutstanding = Number(payload['KPIs Outstanding'] ?? 0) > 0;
    const radius = hasOutstanding
      ? KPI_COMPLETED_RADIUS_WITH_OUTSTANDING
      : KPI_COMPLETED_RADIUS_SOLO;
    return <Rectangle {...rest} radius={radius} />;
  };

  return (
    <div className="h-[380px] w-full max-w-5xl mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 56, right: 36, left: 0, bottom: 52 }}>
          <CartesianGrid vertical={false} stroke="rgba(20,63,42,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={<SummaryTick />} interval={0} />
          <YAxis
            yAxisId="money"
            tickFormatter={(v: number) => fmtMoney(v)}
            stroke={AXIS}
            width={72}
          />
          <YAxis
            yAxisId="kpi"
            orientation="right"
            stroke={AXIS}
            domain={[0, 1]}
            tickFormatter={(v: number) =>
              Number.isFinite(v) ? `${Math.round(v * 100)}%` : ''
            }
            width={56}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={52}
            wrapperStyle={{ color: 'var(--color-text)', fontSize: 12 }}
          />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-soft)',
              color: 'var(--color-text)',
              borderRadius: 12,
            }}
          />
          <Bar yAxisId="money" dataKey="Allocated" fill={ALLOCATED} radius={[6, 6, 0, 0]}>
            <LabelList dataKey="Allocated" position="top" formatter={labelFormatter} offset={12} />
          </Bar>
          <Bar
            yAxisId="kpi"
            dataKey="KPIs Outstanding"
            stackId="kpi"
            fill={KPI_PENDING}
            shape={renderKpiOutstanding}
          >
            <LabelList
              dataKey="KPIs Outstanding"
              position="top"
              formatter={kpiOutstandingLabelFormatter}
              offset={10}
            />
          </Bar>
          <Bar
            yAxisId="kpi"
            dataKey="KPIs Completed"
            stackId="kpi"
            fill={KPI_COMPLETED}
            shape={renderKpiCompleted}
          >
            <LabelList
              dataKey="KPIs Completed"
              position="top"
              formatter={kpiCompletedLabelFormatter}
              offset={10}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
