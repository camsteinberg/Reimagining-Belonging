// app/buzz/Dashboard.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Smile, TrendingUp, ThumbsUp, Users } from 'lucide-react';
import SurfaceCard from '@/components/ui/SurfaceCard';

type Entry = { timestamp: string; score: number; comment: string };
type Monthly = { month: string; score: number };
type Props = { username: string; role?: string | null };

export default function AcreBuzzDashboard({ username, role }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [months, setMonths] = useState<Monthly[]>([]);
  const [stats, setStats] = useState({ avg: 0, total: 0, promoters: 0, buzz: 'N/A' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/buzz', { cache: 'no-store' });
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          /* ignore bad JSON */
        }
        if (!res.ok) throw new Error(data?.error || `Fetch failed (${res.status})`);

        const rows: Entry[] = data.rows ?? [];
        const monthly: Monthly[] = data.monthly ?? [];
        if (cancel) return;

        setEntries(rows);
        setMonths([...monthly].sort((a, b) => a.month.localeCompare(b.month)));

        const scores = rows.map((r) => Number(r.score) || 0);
        const total = scores.length;
        const avg = total ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
        const promoters = scores.filter((s) => s >= 9).length;
        const buzz = avg >= 8 ? 'High' : avg >= 5 ? 'Medium' : 'Low';
        setStats({ avg, total, promoters, buzz });
      } catch (e: any) {
        if (!cancel) {
          setErr(e?.message || 'Failed to load Acre Buzz data');
          setEntries([]);
          setMonths([]);
          setStats({ avg: 0, total: 0, promoters: 0, buzz: 'N/A' });
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        icon: ThumbsUp,
        tone: 'accent',
        title: 'Avg NPS score',
        value: stats.avg.toString(),
      },
      {
        icon: Users,
        tone: 'primary',
        title: 'Total respondents',
        value: stats.total.toString(),
      },
      {
        icon: Smile,
        tone: 'sunny',
        title: 'Promoters',
        value: stats.promoters.toString(),
      },
      {
        icon: TrendingUp,
        tone: 'neutral',
        title: 'Buzz factor',
        value: stats.buzz,
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6 text-[var(--color-text)] transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Acre Buzz</h2>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ icon: Icon, tone, title, value }) => {
          const toneClass =
            tone === 'primary'
              ? 'bg-[color-mix(in_srgb,var(--color-primary)_16%,_transparent)] text-[var(--color-primary-strong)]'
              : tone === 'sunny'
              ? 'bg-[rgba(250,204,21,0.18)] text-[var(--color-primary-strong)]'
              : tone === 'neutral'
              ? 'bg-[rgba(110,224,166,0.16)] text-[var(--color-primary-strong)]'
              : 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]';

          return (
            <SurfaceCard key={title} variant="muted" padding="sm" className="text-center">
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{title}</h3>
              <p className="text-3xl font-semibold text-[var(--color-text)]">{loading ? '—' : value}</p>
            </SurfaceCard>
          );
        })}
      </div>

      {/* Monthly NPS */}
      <SurfaceCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Monthly NPS trend</h3>
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--color-primary-strong)]">
            {loading ? 'Updating…' : `${months.length} months`}
          </span>
        </div>
        {err && <p className="text-sm text-[var(--color-danger)]">{err}</p>}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="text-left text-[var(--color-text-muted)]">
              <tr className="border-b border-[var(--color-border-soft)]">
                <th className="px-2 py-2 font-semibold">Month</th>
                <th className="px-2 py-2 text-right font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-2 py-6 text-center text-[var(--color-text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : months.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-2 py-6 text-center text-[var(--color-text-muted)]">
                    No monthly data yet.
                  </td>
                </tr>
              ) : (
                months.map((m, i) => (
                  <tr key={`${m.month}-${i}`} className="border-b border-[var(--color-border-soft)] last:border-none">
                    <td className="px-2 py-3 font-medium">{m.month}</td>
                    <td className="px-2 py-3 text-right text-base font-semibold text-[var(--color-text)]">{m.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {/* Feedback Table */}
      <SurfaceCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Visitor feedback</h3>
          <span className="rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
            {loading ? 'Syncing…' : `${entries.length} responses`}
          </span>
        </div>
        {err && <p className="text-sm text-[var(--color-danger)]">{err}</p>}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Timestamp</th>
                <th className="px-3 py-2 text-center font-semibold">Score</th>
                <th className="px-3 py-2 text-left font-semibold">Comment</th>
              </tr>
            </thead>
            <tbody className="text-left">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-10 text-center text-[var(--color-text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-10 text-center text-[var(--color-text-muted)]">
                    No feedback yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <tr key={`${entry.timestamp}-${i}`} className="border-b border-[var(--color-border-soft)] last:border-none">
                    <td className="px-3 py-3 align-top text-[var(--color-text-muted)]">{entry.timestamp}</td>
                    <td className="px-3 py-3 text-center text-base font-semibold text-[var(--color-text)]">{entry.score}</td>
                    <td className="px-3 py-3 text-[var(--color-text)]">{entry.comment}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
