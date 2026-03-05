'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Users,
  Clock,
  ArrowUpRight,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import SurfaceCard from '@/components/ui/SurfaceCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Period = '7d' | '30d' | '90d';

type ReportData = {
  period: string;
  totalPageviews: number;
  uniqueVisitors: number;
  avgDurationMs: number | null;
  bounceRate: number;
  topPages: { path: string; views: number }[];
  referrers: { source: string; count: number }[];
  devices: { device_type: string; count: number }[];
  dailyViews: { date: string; views: number }[];
  geography: { country: string; count: number }[];
};

type RealtimeData = {
  activeVisitors: number;
  currentPages: { sessionId: string; path: string }[];
};

/* ------------------------------------------------------------------ */
/*  Palette constants (Campfire)                                       */
/* ------------------------------------------------------------------ */

const EMBER = '#c45d3e';
const GOLD = '#b89f65';
const FOREST = '#3d6b4f';
const SAGE = '#6b8f71';
const CREAM = '#e8e0d0';

/* ------------------------------------------------------------------ */
/*  Helper: format duration                                            */
/* ------------------------------------------------------------------ */

function fmtDuration(ms: number | null): string {
  if (ms === null || ms === 0) return '0m 0s';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

/* ------------------------------------------------------------------ */
/*  Helper: format date for axis labels                                */
/* ------------------------------------------------------------------ */

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [report, setReport] = useState<ReportData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- fetch report ---------- */

  const fetchReport = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/report?period=${p}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed to load analytics (${res.status})`);
      }
      const data: ReportData = await res.json();
      setReport(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(period);
  }, [period, fetchReport]);

  /* ---------- fetch realtime ---------- */

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/realtime', { cache: 'no-store' });
      if (!res.ok) return;
      const data: RealtimeData = await res.json();
      setRealtime(data);
    } catch {
      /* silently ignore realtime fetch errors */
    }
  }, []);

  useEffect(() => {
    fetchRealtime();
    const iv = setInterval(fetchRealtime, 30_000);
    return () => clearInterval(iv);
  }, [fetchRealtime]);

  /* ---------- sort state for top pages ---------- */

  const [pageSort, setPageSort] = useState<'views' | 'path'>('views');
  const [pageSortDir, setPageSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedPages = useMemo(() => {
    if (!report?.topPages) return [];
    const pages = [...report.topPages];
    pages.sort((a, b) => {
      const mul = pageSortDir === 'asc' ? 1 : -1;
      if (pageSort === 'views') return (a.views - b.views) * mul;
      return a.path.localeCompare(b.path) * mul;
    });
    return pages;
  }, [report?.topPages, pageSort, pageSortDir]);

  function togglePageSort(col: 'views' | 'path') {
    if (pageSort === col) {
      setPageSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setPageSort(col);
      setPageSortDir(col === 'views' ? 'desc' : 'asc');
    }
  }

  /* ---------- device breakdown max ---------- */

  const deviceMax = useMemo(() => {
    if (!report?.devices?.length) return 1;
    return Math.max(...report.devices.map((d) => Number(d.count)));
  }, [report?.devices]);

  const deviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone className="h-4 w-4" />;
    if (type === 'Tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const deviceColor = (type: string) => {
    if (type === 'Mobile') return GOLD;
    if (type === 'Tablet') return SAGE;
    return EMBER;
  };

  /* ---------- summary cards ---------- */

  const summaryCards = useMemo(
    () => [
      {
        icon: Eye,
        label: 'Total Pageviews',
        value: report?.totalPageviews?.toLocaleString() ?? '0',
        color: EMBER,
      },
      {
        icon: Users,
        label: 'Unique Visitors',
        value: report?.uniqueVisitors?.toLocaleString() ?? '0',
        color: FOREST,
      },
      {
        icon: Clock,
        label: 'Avg Session Duration',
        value: fmtDuration(report?.avgDurationMs ?? null),
        color: GOLD,
      },
      {
        icon: ArrowUpRight,
        label: 'Bounce Rate',
        value: `${report?.bounceRate ?? 0}%`,
        color: SAGE,
      },
    ],
    [report],
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 text-[var(--color-text)] transition-colors duration-300">
      {/* ---- Header + period selector ---- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
          Analytics
        </h2>
        <div className="flex items-center gap-1 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-1">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200"
              style={
                period === p
                  ? { backgroundColor: EMBER, color: '#fff' }
                  : { color: 'var(--color-text-muted)' }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Error ---- */}
      {error && (
        <SurfaceCard variant="muted" padding="sm">
          <p className="text-sm font-medium" style={{ color: EMBER }}>
            {error}
          </p>
        </SurfaceCard>
      )}

      {/* ---- Loading skeleton ---- */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SurfaceCard key={i} variant="muted" padding="sm" className="animate-pulse text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[var(--color-border-soft)]" />
              <div className="mx-auto mb-2 h-3 w-20 rounded bg-[var(--color-border-soft)]" />
              <div className="mx-auto h-8 w-16 rounded bg-[var(--color-border-soft)]" />
            </SurfaceCard>
          ))}
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!loading && !error && report && report.totalPageviews === 0 && (
        <SurfaceCard padding="lg" className="text-center">
          <Activity className="mx-auto mb-3 h-10 w-10" style={{ color: GOLD }} />
          <p className="font-serif text-lg font-semibold">No analytics data yet</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Once visitors start arriving, you&apos;ll see pageviews, sessions, and more here.
          </p>
        </SurfaceCard>
      )}

      {/* ---- Summary stat cards ---- */}
      {!loading && report && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ icon: Icon, label, value, color }) => (
              <SurfaceCard key={label} variant="muted" padding="sm" className="text-center">
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {label}
                </h3>
                <p className="font-sans text-3xl font-semibold text-[var(--color-text)]">
                  {value}
                </p>
              </SurfaceCard>
            ))}
          </div>

          {/* ---- Daily Pageviews Chart ---- */}
          {report.dailyViews.length > 0 && (
            <SurfaceCard padding="lg" className="space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[var(--color-text)]">
                Daily Pageviews
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.dailyViews} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="emberGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EMBER} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={CREAM} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-soft)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtDate}
                      tick={{ fill: 'var(--color-text-muted, #8a837a)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: 'var(--color-text-muted, #8a837a)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface, #f5f1ea)',
                        border: '1px solid var(--color-border-soft, #e8e0d0)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(42,37,32,0.12)',
                        fontSize: 13,
                      }}
                      labelFormatter={fmtDate}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke={EMBER}
                      strokeWidth={2.5}
                      fill="url(#emberGradient)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: EMBER,
                        stroke: '#fff',
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>
          )}

          {/* ---- Top Pages + Referrers ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top Pages */}
            <SurfaceCard padding="lg" className="space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[var(--color-text)]">
                Top Pages
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[var(--color-text-muted)]">
                    <tr className="border-b border-[var(--color-border-soft)]">
                      <th
                        className="cursor-pointer px-2 py-2 font-semibold select-none"
                        onClick={() => togglePageSort('path')}
                      >
                        Page{' '}
                        {pageSort === 'path' && (
                          <span className="text-xs">{pageSortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                        )}
                      </th>
                      <th
                        className="cursor-pointer px-2 py-2 text-right font-semibold select-none"
                        onClick={() => togglePageSort('views')}
                      >
                        Views{' '}
                        {pageSort === 'views' && (
                          <span className="text-xs">{pageSortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPages.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-2 py-6 text-center text-[var(--color-text-muted)]"
                        >
                          No page data yet.
                        </td>
                      </tr>
                    ) : (
                      sortedPages.map((p, i) => (
                        <tr
                          key={`${p.path}-${i}`}
                          className="border-b border-[var(--color-border-soft)] last:border-none"
                        >
                          <td className="px-2 py-2.5 font-medium">{p.path}</td>
                          <td className="px-2 py-2.5 text-right font-sans font-semibold">
                            {Number(p.views).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>

            {/* Referral Sources */}
            <SurfaceCard padding="lg" className="space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[var(--color-text)]">
                Referral Sources
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[var(--color-text-muted)]">
                    <tr className="border-b border-[var(--color-border-soft)]">
                      <th className="px-2 py-2 font-semibold">Source</th>
                      <th className="px-2 py-2 text-right font-semibold">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!report.referrers?.length ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-2 py-6 text-center text-[var(--color-text-muted)]"
                        >
                          No referral data yet.
                        </td>
                      </tr>
                    ) : (
                      report.referrers.map((r, i) => (
                        <tr
                          key={`${r.source}-${i}`}
                          className="border-b border-[var(--color-border-soft)] last:border-none"
                        >
                          <td className="px-2 py-2.5 font-medium">{r.source}</td>
                          <td className="px-2 py-2.5 text-right font-sans font-semibold">
                            {Number(r.count).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </div>

          {/* ---- Devices + Geography ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Device breakdown */}
            <SurfaceCard padding="lg" className="space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[var(--color-text)]">
                Device Breakdown
              </h3>
              {!report.devices?.length ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
                  No device data yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.devices.map((d) => {
                    const pct = deviceMax > 0 ? (Number(d.count) / deviceMax) * 100 : 0;
                    const barColor = deviceColor(d.device_type);
                    return (
                      <div key={d.device_type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium" style={{ color: barColor }}>
                            {deviceIcon(d.device_type)}
                            {d.device_type}
                          </span>
                          <span className="font-sans font-semibold text-[var(--color-text)]">
                            {Number(d.count).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full"
                          style={{ backgroundColor: `${barColor}15` }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SurfaceCard>

            {/* Geography */}
            <SurfaceCard padding="lg" className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" style={{ color: FOREST }} />
                <h3 className="font-serif text-lg font-semibold text-[var(--color-text)]">
                  Geography
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[var(--color-text-muted)]">
                    <tr className="border-b border-[var(--color-border-soft)]">
                      <th className="px-2 py-2 font-semibold">Country</th>
                      <th className="px-2 py-2 text-right font-semibold">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!report.geography?.length ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-2 py-6 text-center text-[var(--color-text-muted)]"
                        >
                          No geography data yet.
                        </td>
                      </tr>
                    ) : (
                      report.geography.map((g, i) => (
                        <tr
                          key={`${g.country}-${i}`}
                          className="border-b border-[var(--color-border-soft)] last:border-none"
                        >
                          <td className="px-2 py-2.5 font-medium">{g.country}</td>
                          <td className="px-2 py-2.5 text-right font-sans font-semibold">
                            {Number(g.count).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </div>

          {/* ---- Real-time section ---- */}
          <SurfaceCard padding="lg" className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: FOREST }}
                />
                <span
                  className="relative inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: FOREST }}
                />
              </span>
              <h3 className="font-serif text-lg font-semibold text-[var(--color-text)]">
                Real-Time
              </h3>
              <span className="text-sm text-[var(--color-text-muted)]">
                Updated every 30s
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-sans text-4xl font-bold" style={{ color: FOREST }}>
                {realtime?.activeVisitors ?? 0}
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">
                {(realtime?.activeVisitors ?? 0) === 1 ? 'visitor' : 'visitors'} online now
              </span>
            </div>

            {realtime && realtime.currentPages.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Currently viewing
                </p>
                <ul className="space-y-1">
                  {realtime.currentPages.map((cp) => (
                    <li
                      key={cp.sessionId}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm
                        bg-[var(--color-surface-subtle)]"
                    >
                      <Activity className="h-3.5 w-3.5 flex-shrink-0" style={{ color: SAGE }} />
                      <span className="font-medium">{cp.path}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                No active sessions right now.
              </p>
            )}
          </SurfaceCard>
        </>
      )}
    </div>
  );
}
