// app/till/TillDashboard.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, BarChart3, DollarSign } from 'lucide-react';
import BarndobucksDashboard from '../barndobucks/Dashboard';
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SurfaceCard from '@/components/ui/SurfaceCard';

type Props = { username: string; role?: string | null };

type TableRow = (string | number | null)[];

type ProfitLossMonthly = { month: string; revenue: number; expenses: number; net: number };
type CashflowMonthly = { month: string; operating: number; investing: number; financing: number };
type Variance = { revenueMoM?: number; expensesMoM?: number; netMoM?: number };

type TillData = {
  asOf?: string;
  cards?: {
    assets?: number;
    liabilities?: number;
    netAssets?: number;
    revenueYTD?: number;
    expensesYTD?: number;
    netIncomeYTD?: number;
    netCashOps?: number;
    accumulatedDep?: number;
  };
  is?: {
    rows?: TableRow[];
    monthly?: ProfitLossMonthly[];
    variance?: Variance;
  };
  cfs?: {
    rows?: TableRow[];
    monthly?: CashflowMonthly[];
    latest?: { operating?: number; investing?: number; financing?: number };
  };
  isDetail?: {
    rows?: TableRow[];
    byCategory?: { category: string; amount: number }[];
    byPeriod?: { month: string; categories: { category: string; amount: number }[] }[];
  };
  bs?: { rows?: TableRow[] };
};

const placeholder = '—';

const fmtMoney = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return placeholder;
  }
  const rounded = Math.round(value);
  return `${rounded < 0 ? '-$' : '$'}${Math.abs(rounded).toLocaleString()}`;
};

const deltaTone = (value?: number) => (typeof value === 'number' && value < 0 ? 'text-[#c45d3e]' : 'text-[#3d6b4f]');

export default function TillDashboard({ username, role }: Props) {
  const [data, setData] = useState<TillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpensePeriod, setSelectedExpensePeriod] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/till-data-xlsx', { cache: 'no-store' });
        const payload = (await res.json().catch(() => null)) as TillData | { error?: string } | null;
        if (!res.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload && payload.error
              ? String(payload.error)
              : `Fetch failed (${res.status})`;
          throw new Error(message);
        }
        if (!cancel) setData(payload as TillData);
      } catch (err) {
        if (!cancel) setError(err instanceof Error ? err.message : 'Failed to load financials');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const kpi = data?.cards;
  const monthly = data?.is?.monthly ?? [];
  const variance = data?.is?.variance ?? {};
  const cashflowMonthly = data?.cfs?.monthly ?? [];

  const expensePeriods = data?.isDetail?.byPeriod ?? [];

  useEffect(() => {
    if (!expensePeriods.length) {
      setSelectedExpensePeriod(null);
      return;
    }
    setSelectedExpensePeriod((prev) => {
      if (prev && expensePeriods.some((p) => p.month === prev)) return prev;
      return expensePeriods[expensePeriods.length - 1]?.month ?? null;
    });
  }, [expensePeriods]);

  const currentExpensePeriod = useMemo(() => {
    if (!expensePeriods.length) return null;
    const found = expensePeriods.find((p) => p.month === selectedExpensePeriod);
    return found ?? expensePeriods[expensePeriods.length - 1];
  }, [expensePeriods, selectedExpensePeriod]);

  const topExpenses = useMemo(
    () => currentExpensePeriod?.categories?.slice(0, 10) ?? [],
    [currentExpensePeriod]
  );

  const kpiCards = [
    { title: 'Total assets', value: fmtMoney(kpi?.assets), icon: DollarSign },
    { title: 'Total liabilities', value: fmtMoney(kpi?.liabilities), icon: ArrowDownCircle },
    { title: 'Net assets', value: fmtMoney(kpi?.netAssets), icon: BarChart3 },
    { title: 'Revenue (YTD)', value: fmtMoney(kpi?.revenueYTD), icon: ArrowUpCircle },
    { title: 'Expenses (YTD)', value: fmtMoney(kpi?.expensesYTD), icon: ArrowDownCircle },
    { title: 'Net income (YTD)', value: fmtMoney(kpi?.netIncomeYTD), icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 text-[var(--color-text)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">The Till</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {data?.asOf ? (
              <>
                  <span className="font-medium text-[var(--color-text)]">{data.asOf}</span>
              </>
            ) : (
              <>As of {placeholder}</>
            )}
          </p>
        </div>
        <SurfaceCard
          variant="muted"
          padding="sm"
          className="inline-flex w-auto flex-col items-center gap-1 text-center"
        >
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            Signed in
          </p>
          <p className="text-base font-semibold text-[var(--color-text)]">{username}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{role ?? 'Member'}</p>
        </SurfaceCard>
      </div>

      {error && (
        <div className="rounded-3xl border border-[#c45d3e]/20 bg-[#c45d3e]/5 px-4 py-3 text-sm text-[#c45d3e]">
          Failed to load financials: {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(({ title, value, icon: Icon }) => (
          <SurfaceCard key={title} variant="muted" padding="sm" className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {title}
            </h3>
            <p className="text-2xl font-semibold text-[var(--color-text)]">{loading ? placeholder : value}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* Income vs expenses */}
      <SurfaceCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Income vs expenses (monthly)</h3>
          {monthly.length >= 2 && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-muted)]">MoM change</p>
              <div className="flex flex-wrap justify-end gap-4 text-sm text-[var(--color-text-muted)]">
                <span>
                  Revenue Δ:{' '}
                  <span className={`${deltaTone(variance.revenueMoM)} font-semibold`}>
                    {fmtMoney(variance.revenueMoM)}
                  </span>
                </span>
                <span>
                  Expenses Δ:{' '}
                  <span className={`${deltaTone(-1 * (variance.expensesMoM ?? 0))} font-semibold`}>
                    {fmtMoney(variance.expensesMoM)}
                  </span>
                </span>
                <span>
                  Net Δ:{' '}
                  <span className={`${deltaTone(variance.netMoM)} font-semibold`}>
                    {fmtMoney(variance.netMoM)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
        {monthly.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-muted)]">
            No monthly P&L data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,37,32,0.08)" />
              <XAxis dataKey="month" stroke="rgba(42,37,32,0.45)" />
              <YAxis stroke="rgba(42,37,32,0.45)" />
              <RTooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6b8f71" strokeWidth={3} dot />
              <Line type="monotone" dataKey="expenses" stroke="#c45d3e" strokeWidth={3} dot />
              <Line type="monotone" dataKey="net" stroke="#3d6b4f" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SurfaceCard>

      {/* Cashflows */}
      <SurfaceCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Cashflows</h3>
          <span className="text-sm text-[var(--color-text-muted)]">
            Net ops cash (latest):{' '}
            <span className="font-semibold text-[var(--color-text)]">{fmtMoney(data?.cards?.netCashOps)}</span>
          </span>
        </div>
        {cashflowMonthly.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-[var(--color-text-muted)]">
            No monthly cashflow data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashflowMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,37,32,0.08)" />
              <XAxis dataKey="month" stroke="rgba(42,37,32,0.45)" />
              <YAxis stroke="rgba(42,37,32,0.45)" />
              <RTooltip />
              <Legend />
              <Area type="monotone" dataKey="operating" stroke="#6b8f71" fill="rgba(107,143,113,0.35)" />
              <Area type="monotone" dataKey="investing" stroke="#b89f65" fill="rgba(184,159,101,0.25)" />
              <Area type="monotone" dataKey="financing" stroke="#c45d3e" fill="rgba(196,93,62,0.25)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SurfaceCard>

      {/* Expense composition */}
      <SurfaceCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Expense composition</h3>
          {expensePeriods.length > 0 && (
            <label className="text-sm text-[var(--color-text-muted)]">
              Quarter:&nbsp;
              <select
                className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm text-[var(--color-text)] focus:border-[var(--color-primary-strong)] focus:outline-none"
                value={currentExpensePeriod?.month ?? ''}
                onChange={(e) => setSelectedExpensePeriod(e.target.value)}
              >
                {expensePeriods.map((period) => (
                  <option key={period.month} value={period.month} className="text-charcoal">
                    {period.month}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!topExpenses.length ? (
          <div className="flex h-56 items-center justify-center text-sm text-[var(--color-text-muted)]">
            No expense categories
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <RBarChart data={topExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,37,32,0.08)" />
              <XAxis dataKey="category" stroke="rgba(42,37,32,0.45)" />
              <YAxis stroke="rgba(42,37,32,0.45)" />
              <RTooltip />
              <Bar dataKey="amount" fill="#6b8f71" />
            </RBarChart>
          </ResponsiveContainer>
        )}
      </SurfaceCard>

      {/* Fellowship Grants (embedded) */}
      <div className="pt-2">
        <BarndobucksDashboard username={username} role={role} embedded hideProjectTotals />
      </div>

    </div>
  );
}
