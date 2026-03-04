// app/governance/Dashboard.tsx
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Users, LifeBuoy, BookOpenText, MessagesSquare,
  Plus, Pencil, Save, X, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import SurfaceCard from '@/components/ui/SurfaceCard';

/* ----------------- Types ----------------- */
type ConflictRow = {
  rowNumber: number;
  date: string;
  name: string;
  type: string;
  details: string;
  solution: string;
  status: string; // 'Open' | 'Resolved' | ''
};
type ConflictsPayload = {
  sheetTitle: string;
  rows: ConflictRow[];
};

type TopQRow = { rowNumber: number; values: string[] };
type TopQPayload = {
  sheetTitle: string;
  header: string[];
  answerColIndex: number; // -1 if not found
  statusColIndex: number; // -1 if not found
  rows: TopQRow[];
};

type DirectoryRow = {
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
};
type DirectoryPayload = {
  sheetTitle: string;
  rows: DirectoryRow[];
};

type Props = {
  username: string;
  role?: string | null;
};

/* ----------------- Constants ----------------- */
const TOPQ_STATUS_OPTS = ['Unanswered', 'Needs Forum', 'Answered'] as const;
const CONFLICT_STATUS_OPTS = ['Open', 'Resolved'] as const;
const CONFLICT_TRUNCATE_LEN = 180;
const DIRECTORY_SHEETS = ['Employee', 'Board', 'Mentor', 'Fellow'] as const;

// Governance “Module” options + color scheme (matches your screenshot)
const MODULE_OPTIONS = [
  'Fellowship Grants', 'R&D', 'Governance', 'Outpost', 'Nesting', 'Real Estate', 'Till'
] as const;

// turn headers into case-insensitive exact match
function ciEq(a?: string, b?: string) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function normalizeTopQLabel(label?: string) {
  return (label || '').trim().toLowerCase().replace(/\?/g, '').trim();
}

function isTopQHiddenColumn(label?: string) {
  const v = normalizeTopQLabel(label);
  return v === 'notified';
}

function isTopQHiddenColumnInTable(label?: string) {
  const v = normalizeTopQLabel(label);
  return v === 'in sparky' || v === 'insparky' || v === 'in-sparky' || v === 'notified';
}

/** Status-like pill styling for the Module select */
const MODULE_THEMES: Record<string, { bg: string; fg: string; border: string }> = {
  'fellowship grants': { bg: '#DCFCE7', fg: '#166534', border: '#BBF7D0' },
  'r&d': { bg: '#DBEAFE', fg: '#1D4ED8', border: '#BFDBFE' },
  governance: { bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A' },
  outpost: { bg: '#FECACA', fg: '#B91C1C', border: '#FCA5A5' },
  nesting: { bg: '#DBEAFE', fg: '#0F172A', border: '#93C5FD' },
  'real estate': { bg: '#EDE9FE', fg: '#5B21B6', border: '#DDD6FE' },
  till: { bg: '#DCFCE7', fg: '#166534', border: '#BBF7D0' },
};

const LEAD_COLORS = ['#DCFCE7', '#FCE7F3', '#E0F2FE', '#FFF7CE', '#F5E8FF', '#FFE4E6'];

const STAT_TONE_CLASSES = {
  primary: 'bg-[color-mix(in_srgb,var(--color-primary)_16%,_transparent)] text-[var(--color-primary-strong)]',
  accent: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]',
  sunny: 'bg-[rgba(250,204,21,0.18)] text-[var(--color-primary-strong)]',
  neutral: 'bg-[rgba(110,224,166,0.16)] text-[var(--color-primary-strong)]',
} as const;
type StatTone = keyof typeof STAT_TONE_CLASSES;

function moduleSelectClass() {
  return 'w-full min-w-0 rounded-xl px-2.5 py-2 text-xs font-semibold border transition text-[var(--color-text)]';
}
function moduleSelectStyle(value?: string): CSSProperties {
  const key = (value || '').trim().toLowerCase();
  const theme = MODULE_THEMES[key];
  if (!theme) {
    return {
      backgroundColor: 'var(--color-surface-subtle)',
      borderColor: 'var(--color-border-soft)',
      color: 'var(--color-text)',
    };
  }
  return { backgroundColor: theme.bg, borderColor: theme.border, color: theme.fg };
}

function stringColor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return LEAD_COLORS[Math.abs(hash) % LEAD_COLORS.length];
}

function leadSelectStyle(value?: string): CSSProperties {
  if (!value) {
    return {
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border-soft)',
      color: 'var(--color-text)',
    };
  }
  const bg = stringColor(value);
  return { backgroundColor: bg, borderColor: bg, color: '#0F172A' };
}

function statusSelectClass(status: string) {
  if (status === 'Answered') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (status === 'Needs Forum') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-[var(--color-surface-subtle)] text-[var(--color-text)] border border-[var(--color-border-soft)]';
}

/* ----------------- Component ----------------- */
export default function GovernanceDashboard({ username, role }: Props) {
  // Global UI state
  const [search, setSearch] = useState('');

  // Data state
  const [conflictsData, setConflictsData] = useState<ConflictsPayload | null>(null);
  const [directory, setDirectory] = useState<DirectoryPayload | null>(null);
  const [topq, setTopq] = useState<TopQPayload | null>(null);
  const [topqSheets, setTopqSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [directorySheet, setDirectorySheet] = useState<typeof DIRECTORY_SHEETS[number]>(DIRECTORY_SHEETS[0]);

  // TopQ controls
  const [sortLatestFirst, setSortLatestFirst] = useState(true);
  const DEFAULT_VISIBLE_COUNT = 8;
  const GROW_BY = 8;
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const [topqDetailsRow, setTopqDetailsRow] = useState<TopQRow | null>(null);
  const [confDetailsRow, setConfDetailsRow] = useState<ConflictRow | null>(null);

  // TopQ inline edit state
  const [topqEditingAnswerAbsIdx, setTopqEditingAnswerAbsIdx] = useState<number | null>(null);
  const [topqEditedAnswer, setTopqEditedAnswer] = useState('');
  const [topqSavingStatusAbsIdx, setTopqSavingStatusAbsIdx] = useState<number | null>(null);

  // Conflicts inline edit state
  const [confEditingSolutionAbsIdx, setConfEditingSolutionAbsIdx] = useState<number | null>(null);
  const [confEditedSolution, setConfEditedSolution] = useState('');
  const [confSavingStatusAbsIdx, setConfSavingStatusAbsIdx] = useState<number | null>(null);

  // Add-row modal
  const [showAddTopQ, setShowAddTopQ] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newModule, setNewModule] = useState<typeof MODULE_OPTIONS[number]>('Fellowship Grants');
  const [newLead, setNewLead] = useState<string>('');
  const [adding, setAdding] = useState(false);

  // UX
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ---------- initial fetch: conflicts, sheet titles ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [confRes, sheetsRes] = await Promise.all([
          fetch('/api/governance?type=conflicts', { cache: 'no-store' }),
          fetch('/api/governance?type=topq_sheets', { cache: 'no-store' }),
        ]);

        const asJson = async (res: Response) => {
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Non-JSON from API (${res.status}): ${text.slice(0, 120)}…`);
          }
          return res.json();
        };

        const [confData, sheetsData] = await Promise.all([
          asJson(confRes),
          asJson(sheetsRes),
        ]);

        if (!confRes.ok) throw new Error(confData?.error || 'Failed to load conflicts');
        if (!sheetsRes.ok) throw new Error(sheetsData?.error || 'Failed to load sheet list');

        setConflictsData(confData as ConflictsPayload);
        const titles = Array.isArray(sheetsData) ? (sheetsData as string[]) : [];
        setTopqSheets(titles);
        setSelectedSheet(titles[0] || null);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load governance data');
        setConflictsData({ sheetTitle: 'Conflict Resolution Responses', rows: [] });
        setTopqSheets([]);
      }
    })();
  }, []);

  /* ---------- fetch directory when tab changes ---------- */
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`/api/governance?type=directory&sheet=${encodeURIComponent(directorySheet)}`, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Non-JSON from API (${res.status}): ${text.slice(0, 120)}ƒ?İ`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load directory');
        if (!canceled) setDirectory(data as DirectoryPayload);
      } catch (e: any) {
        if (!canceled) {
          setErr(e?.message || 'Failed to load directory');
          setDirectory({ sheetTitle: directorySheet, rows: [] });
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [directorySheet]);

  /* ---------- fetch topq when selected sheet changes ---------- */
  useEffect(() => {
    if (!selectedSheet) return;
    (async () => {
      try {
        setVisibleCount(DEFAULT_VISIBLE_COUNT);
        setTopqEditingAnswerAbsIdx(null);
        setTopqEditedAnswer('');
        setTopqDetailsRow(null);
        const res = await fetch(`/api/governance?type=topq&sheet=${encodeURIComponent(selectedSheet)}`, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Non-JSON from API (${res.status}): ${text.slice(0, 120)}…`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load Top Questions');
        setTopq(data as TopQPayload);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load Top Questions');
        setTopq({ sheetTitle: selectedSheet, header: [], answerColIndex: -1, statusColIndex: -1, rows: [] });
      }
    })();
  }, [selectedSheet]);

  /* ---------- TopQ filtering/paging ---------- */
  const filteredTopRows = useMemo(() => {
    if (!topq) return [];
    const term = search.toLowerCase();
    const base = topq.rows.filter((r) => r.values.join(' | ').toLowerCase().includes(term));
    return sortLatestFirst ? [...base].reverse() : base; // latest last → reverse to show newest first
  }, [topq, search, sortLatestFirst]);
  const pagedTopRows = useMemo(() => filteredTopRows.slice(0, visibleCount), [filteredTopRows, visibleCount]);

  // Exact column indices (avoid accidental matches)
  const moduleColIdx = useMemo(() => {
    if (!topq?.header) return -1;
    return topq.header.findIndex(h => ciEq(h, 'Module'));
  }, [topq]);

  const leadColIdx = useMemo(() => {
    if (!topq?.header) return -1;
    return topq.header.findIndex(h => ciEq(h, 'Lead'));
  }, [topq]);

  // Which columns are long text? (for layout)
  const longTextColIdx = useMemo(() => {
    if (!topq?.header) return new Set<number>();
    const s = new Set<number>();
    topq.header.forEach((h, i) => {
      const v = (h || '').toLowerCase();
      if (v.includes('question') || v.includes('sparky') || v === 'answer') s.add(i);
    });
    return s;
  }, [topq]);

  const topqColumnWidthClass = (idx: number) => {
    const isWide = longTextColIdx.has(idx);
    return isWide
      ? 'min-w-[240px] sm:min-w-[280px] lg:min-w-[340px] max-w-[620px]'
      : 'min-w-[110px] max-w-[180px]';
  };

  const visibleTopqHeaderCount = useMemo(() => {
    if (!topq?.header) return 0;
    return topq.header.filter(h => !isTopQHiddenColumnInTable(h)).length;
  }, [topq]);

  // Unique Lead choices: split multi-names into single names
  const leadChoices = useMemo(() => {
    if (!topq || leadColIdx < 0) return [] as string[];
    const set = new Set<string>();
    const DELIMS = /,|\/|&| and /i;
    topq.rows.forEach(r => {
      const raw = (r.values[leadColIdx] || '').trim();
      if (!raw) return;
      raw.split(DELIMS)
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(name => { if (name.length <= 40) set.add(name); });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [topq, leadColIdx]);

  /* ---------- TopQ writes ---------- */
  async function saveTopQAnswer(absIdx: number) {
    if (!topq) return;
    if (topq.answerColIndex < 0) {
      setToast('No "Answer" column in sheet header.');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const row = topq.rows[absIdx];
    const res = await fetch('/api/governance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'topq',
        sheetTitle: topq.sheetTitle,
        rowNumber: row.rowNumber,
        answer: topqEditedAnswer,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setToast(json?.error || 'Failed to update answer');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    // optimistic
    setTopq(prev => {
      if (!prev) return prev;
      const copy = { ...prev, rows: prev.rows.map((r, i) => {
        if (i !== absIdx) return r;
        const vals = [...r.values];
        vals[prev.answerColIndex] = topqEditedAnswer;
        return { ...r, values: vals };
      }) };
      return copy;
    });
    setTopqEditingAnswerAbsIdx(null);
    setTopqEditedAnswer('');
    setToast('Answer saved ✅');
    setTimeout(() => setToast(null), 1500);
  }

  async function updateTopQStatus(absIdx: number, nextStatus: string) {
    if (!topq) return;
    const row = topq.rows[absIdx];
    setTopqSavingStatusAbsIdx(absIdx);
    const res = await fetch('/api/governance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'topq',
        sheetTitle: topq.sheetTitle,
        rowNumber: row.rowNumber,
        status: nextStatus,
      }),
    });
    const json = await res.json();
    setTopqSavingStatusAbsIdx(null);
    if (!res.ok) {
      setToast(json?.error || 'Failed to update status');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    // optimistic
    setTopq(prev => {
      if (!prev) return prev;
      let statusIdx = prev.statusColIndex;
      if (statusIdx < 0) statusIdx = prev.header.length; // provisional
      const header = prev.statusColIndex < 0 ? [...prev.header, 'Status'] : prev.header;
      const rows = prev.rows.map((r, i) => {
        if (i !== absIdx) return r;
        const vals = [...r.values];
        if (vals.length <= statusIdx) {
          vals.length = statusIdx + 1;
          for (let k = 0; k < vals.length; k++) if (typeof vals[k] === 'undefined') vals[k] = '';
        }
        vals[statusIdx] = nextStatus;
        return { ...r, values: vals };
      });
      return { ...prev, header, statusColIndex: statusIdx, rows };
    });
  }

  async function updateTopQModule(absIdx: number, nextModule: string) {
    if (!topq) return;
    const row = topq.rows[absIdx];
    const res = await fetch('/api/governance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'topq',
        sheetTitle: topq.sheetTitle,
        rowNumber: row.rowNumber,
        module: nextModule,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setToast(json?.error || 'Failed to update module');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    // optimistic
    setTopq(prev => {
      if (!prev) return prev;
      const idx = moduleColIdx >= 0 ? moduleColIdx : prev.header.length;
      const header = moduleColIdx < 0 ? [...prev.header, 'Module'] : prev.header;
      const rows = prev.rows.map((r, i) => {
        if (i !== absIdx) return r;
        const vals = [...r.values];
        if (vals.length <= idx) vals.length = idx + 1;
        vals[idx] = nextModule;
        return { ...r, values: vals };
      });
      return { ...prev, header, rows };
    });
  }

  async function updateTopQLead(absIdx: number, nextLead: string) {
    if (!topq) return;
    const row = topq.rows[absIdx];
    const res = await fetch('/api/governance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'topq',
        sheetTitle: topq.sheetTitle,
        rowNumber: row.rowNumber,
        lead: nextLead,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setToast(json?.error || 'Failed to update lead');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    // optimistic
    setTopq(prev => {
      if (!prev) return prev;
      const idx = leadColIdx >= 0 ? leadColIdx : prev.header.length;
      const header = leadColIdx < 0 ? [...prev.header, 'Lead'] : prev.header;
      const rows = prev.rows.map((r, i) => {
        if (i !== absIdx) return r;
        const vals = [...r.values];
        if (vals.length <= idx) vals.length = idx + 1;
        vals[idx] = nextLead;
        return { ...r, values: vals };
      });
      return { ...prev, header, rows };
    });
  }

  async function addTopQRow() {
    if (!topq || !selectedSheet) return;
    if (!newQText.trim()) {
      setToast('Please enter a question');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setAdding(true);
    const res = await fetch('/api/governance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'topq_add',
        sheetTitle: selectedSheet,
        question: newQText,
        module: newModule,
        lead: newLead || '',
      }),
    });
    const json = await res.json();
    setAdding(false);
    if (!res.ok) {
      setToast(json?.error || 'Failed to add row');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    // optimistic: append locally
    setTopq(prev => {
      if (!prev) return prev;
      let header = [...prev.header];

      const ensureIndex = (label: string) => {
        let i = header.findIndex(h => ciEq(h, label));
        if (i < 0) {
          header = [...header, label];
          i = header.length - 1;
        }
        return i;
      };

      const qIdx = header.findIndex(h => (h || '').toLowerCase().includes('question'));
      const aIdx = ensureIndex('Answer');
      const sIdx = ensureIndex('Status');
      const mIdx = ensureIndex('Module');
      const lIdx = ensureIndex('Lead');
      const dIdx = ensureIndex('Date Added');

      const vals = Array.from({ length: header.length }, () => '');
      if (qIdx >= 0) vals[qIdx] = newQText;
      vals[aIdx] = '';
      vals[sIdx] = 'Unanswered';
      vals[mIdx] = newModule;
      vals[lIdx] = newLead || '';
      vals[dIdx] = new Date().toISOString().split('T')[0];

      const rows = [...prev.rows, { rowNumber: (json.rowNumber ?? prev.rows.length + 2), values: vals }];
      return { ...prev, header, rows };
    });

    setShowAddTopQ(false);
    setNewQText('');
  }

  /* ---------- Stats ---------- */
  function countUnansweredTopQ(payload: TopQPayload | null): number {
    if (!payload) return 0;
    const sIdx = payload.statusColIndex;
    if (sIdx < 0) {
      const aIdx = payload.answerColIndex;
      if (aIdx < 0) return payload.rows.length;
      return payload.rows.reduce((acc, r) => acc + ((r.values[aIdx] || '').trim() ? 0 : 1), 0);
    }
    return payload.rows.reduce((acc, r) => {
      const st = (r.values[sIdx] || 'Unanswered').trim() || 'Unanswered';
      return acc + (st === 'Unanswered' ? 1 : 0);
    }, 0);
  }
  function countOpenConflicts(payload: ConflictsPayload | null): number {
    if (!payload) return 0;
    return payload.rows.reduce((acc, r) => acc + ((r.status || 'Open') === 'Resolved' ? 0 : 1), 0);
  }

  const headlineStats = useMemo(() => {
    const activeRequests = countUnansweredTopQ(topq) + countOpenConflicts(conflictsData);
    return [
      {
        icon: MessagesSquare,
        tone: 'accent' as StatTone,
        title: 'Top Questions',
        value: topq?.rows.length ?? 0,
      },
      {
        icon: LifeBuoy,
        tone: 'neutral' as StatTone,
        title: 'Active Requests',
        value: activeRequests,
      },
      {
        icon: Users,
        tone: 'primary' as StatTone,
        title: 'Directory',
        value: directory?.rows.length ?? 0,
      },
      {
        icon: BookOpenText,
        tone: 'neutral' as StatTone,
        title: 'Sheet',
        value: topq?.sheetTitle || '—',
      },
    ];
  }, [topq, conflictsData, directory?.rows.length]);

  /* ----------------- render ----------------- */
  return (
    <div className="space-y-6 text-[var(--color-text)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Governance</h2>
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {headlineStats.map(({ icon: Icon, title, value, tone }) => {
          const rawValue =
            value === null || value === undefined || value === ''
              ? '—'
              : typeof value === 'number'
                ? value.toLocaleString()
                : value;
          const isLongValue = typeof rawValue === 'string' && rawValue.length > 16;
          const valueClass = isLongValue ? 'text-base' : 'text-2xl';
          return (
            <SurfaceCard key={title} variant="muted" padding="sm" className="text-center">
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${STAT_TONE_CLASSES[tone]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {title}
              </h3>
              <p className={`${valueClass} font-semibold text-[var(--color-text)]`}>{rawValue}</p>
            </SurfaceCard>
          );
        })}
      </div>

      

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Top Questions */}
      <SurfaceCard className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Top Questions
            {topq?.sheetTitle ? <span className="ml-2 text-sm text-[var(--color-text-muted)]">({topq.sheetTitle})</span> : null}
          </h3>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={selectedSheet ?? ''}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)] sm:w-auto"
            disabled={topqSheets.length === 0}
          >
            {topqSheets.length === 0 ? (
              <option value="">No sheets</option>
            ) : (
              topqSheets.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => setSortLatestFirst((v) => !v)}
            className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
            title="Toggle Latest -> Oldest"
          >
            {sortLatestFirst ? 'Latest -> Oldest' : 'Oldest -> Latest'}
          </button>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rows..."
              className="h-10 w-full min-w-0 flex-1 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />

            <button
              onClick={() => {
                setShowAddTopQ(true);
                setNewModule('Fellowship Grants');
                setNewLead(leadChoices[0] || '');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add question
            </button>
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-xs sm:text-sm">
            <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
              <tr>
                {topq?.header?.map((h, i) => (
                  isTopQHiddenColumnInTable(h) ? null : (
                    <th key={i} className={`px-2 py-2 text-center ${topqColumnWidthClass(i)}`}>
                      {h || `Col ${i + 1}`}
                    </th>
                  )
                ))}
                <th className="w-[220px] px-2 py-2 text-center sm:w-[260px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topq && pagedTopRows.map((row) => {
                const absIdx = topq.rows.findIndex((r) => r.rowNumber === row.rowNumber);
                const aIdx = topq.answerColIndex;
                const sIdx = topq.statusColIndex;
                const mIdx = moduleColIdx;
                const lIdx = leadColIdx;

                const answerValue = aIdx >= 0 ? row.values[aIdx] : '';
                const statusValue = sIdx >= 0 ? (row.values[sIdx] || 'Unanswered') : 'Unanswered';
                const isEditing = topqEditingAnswerAbsIdx === absIdx;

                return (
                  <tr key={`${row.rowNumber}-${topq.sheetTitle}`} className="border-b align-top">
                    {row.values.map((val, vi) => {
                      if (isTopQHiddenColumnInTable(topq?.header?.[vi])) return null;
                      const isAnswerCell = vi === aIdx;
                      const isStatusCell = vi === sIdx;
                      const isModuleCell = vi === mIdx;
                      const isLeadCell = vi === lIdx;
                      const isLongText = longTextColIdx.has(vi);

                      if (isStatusCell) {
                        return (
                          <td key={vi} className={`px-2 py-3 text-center ${topqColumnWidthClass(vi)}`}>
                            <div className="inline-flex items-center gap-2">
                              <select
                                value={statusValue}
                                onChange={(e) => updateTopQStatus(absIdx, e.target.value)}
                                className={`w-full min-w-0 px-2.5 py-2 rounded-xl text-xs font-semibold ${statusSelectClass(statusValue)}`}
                              >
                                {TOPQ_STATUS_OPTS.map(op => <option key={op} value={op}>{op}</option>)}
                              </select>
                              {topqSavingStatusAbsIdx === absIdx && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />}
                            </div>
                          </td>
                        );
                      }

                      if (isModuleCell) {
                        const v = row.values[mIdx] || '';
                        return (
                          <td key={vi} className={`px-2 py-3 text-center ${topqColumnWidthClass(vi)}`}>
                            <select
                              value={v}
                              onChange={(e) => updateTopQModule(absIdx, e.target.value)}
                              className={moduleSelectClass()}
                              style={moduleSelectStyle(v)}
                            >
                              <option value="" disabled>Select module…</option>
                              {MODULE_OPTIONS.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                          </td>
                        );
                      }

                      if (isLeadCell) {
                        const v = row.values[lIdx] || '';
                        return (
                          <td key={vi} className={`px-2 py-3 text-center ${topqColumnWidthClass(vi)}`}>
                            <select
                              value={v}
                              onChange={(e) => updateTopQLead(absIdx, e.target.value)}
                              className="w-full min-w-0 rounded-xl border px-2.5 py-2 text-xs font-semibold transition"
                              style={leadSelectStyle(v)}
                            >
                              {v && !leadChoices.includes(v) && <option value={v}>{v}</option>}
                              <option value="">—</option>
                              {leadChoices.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                          </td>
                        );
                      }

                      if (isAnswerCell && isEditing) {
                        return (
                          <td key={vi} className={`px-2 py-3 text-center ${topqColumnWidthClass(vi)}`}>
                            <textarea
                              value={topqEditedAnswer}
                              onChange={(e) => setTopqEditedAnswer(e.target.value)}
                              rows={2}
                              className="w-full border rounded p-2"
                              placeholder="Type answer…"
                            />
                          </td>
                        );
                      }

                      return (
                        <td key={vi} className={`px-2 py-3 text-center ${topqColumnWidthClass(vi)} ${isLongText ? 'align-top' : ''}`}>
                          <div
                            className={`whitespace-pre-wrap break-words text-center text-[var(--color-text)] ${isLongText ? 'line-clamp-3 leading-relaxed' : ''}`}
                          >
                            {val || <span className="italic text-[var(--color-text-muted)]">—</span>}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {aIdx >= 0 ? (
                          isEditing ? (
                            <>
                              <button
                                onClick={() => saveTopQAnswer(absIdx)}
                                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95"
                              >
                                <Save className="w-4 h-4" /> Save
                              </button>
                              <button
                                onClick={() => { setTopqEditingAnswerAbsIdx(null); setTopqEditedAnswer(''); }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-primary-soft)]"
                              >
                                <X className="w-4 h-4" /> Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setTopqEditingAnswerAbsIdx(absIdx); setTopqEditedAnswer(answerValue || ''); }}
                              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)] hover:text-white"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] italic">No “Answer” column</span>
                        )}
                        <button
                          onClick={() => setTopqDetailsRow(row)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {topq && pagedTopRows.length === 0 && (
                <tr><td colSpan={visibleTopqHeaderCount + 1} className="py-8 text-center text-[var(--color-text-muted)]">No rows found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {topqDetailsRow && topq ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-[var(--surface-card-shadow)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-[var(--color-text)]">Question details</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Sheet: {topq.sheetTitle} - Row {topqDetailsRow.rowNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTopqDetailsRow(null)}
                  className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                  aria-label="Close details"
                >
                  x
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topq.header.map((label, idx) => {
                  if (isTopQHiddenColumn(label)) return null;
                  const latest =
                    topq.rows.find((r) => r.rowNumber === topqDetailsRow.rowNumber)?.values[idx] ??
                    topqDetailsRow.values[idx] ??
                    '';
                  return (
                    <div
                      key={`${topqDetailsRow.rowNumber}-${idx}`}
                      className="rounded-xl border border-[var(--color-border-soft)] p-3"
                    >
                      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        {label || `Column ${idx + 1}`}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                        {latest || <span className="italic text-[var(--color-text-muted)]">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Collapsible controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-[var(--color-text-muted)]">
            Showing {Math.min(visibleCount, filteredTopRows.length)} of {filteredTopRows.length}
          </div>
          <div className="flex gap-2">
            {visibleCount < filteredTopRows.length && (
              <button
                onClick={() => setVisibleCount((c) => c + GROW_BY)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
              >
                Show more <ChevronDown className="w-4 h-4" />
              </button>
            )}
            {visibleCount < filteredTopRows.length && (
              <button
                onClick={() => setVisibleCount(filteredTopRows.length)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
              >
                Show all
              </button>
            )}
            {visibleCount > GROW_BY && (
              <button
                onClick={() => setVisibleCount(GROW_BY)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
              >
                Collapse <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </SurfaceCard>

      {/* Add Question Modal */}
      {showAddTopQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-[0_24px_48px_-24px_rgba(20,63,42,0.35)]">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[var(--color-text)]">Add Question</h4>
              <button
                onClick={() => setShowAddTopQ(false)}
                className="rounded-full bg-[var(--color-surface-subtle)] p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-sm font-medium text-[var(--color-text)]">Question</label>
            <textarea
              className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)]"
              rows={3}
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              placeholder="Type the question…"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">Module</label>
                <select
                  className="w-full rounded-xl border p-2 text-sm font-semibold transition"
                  style={moduleSelectStyle(newModule)}
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value as any)}
                >
                  {MODULE_OPTIONS.map(op => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)]">Lead</label>
                <select
                  className="w-full rounded-xl border p-2 text-sm font-semibold transition"
                  style={leadSelectStyle(newLead)}
                  value={newLead}
                  onChange={(e) => setNewLead(e.target.value)}
                >
                  <option value="">—</option>
                  {leadChoices.map(op => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddTopQ(false)}
                className="rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-primary-soft)]"
              >
                Cancel
              </button>
              <button
                onClick={addTopQRow}
                disabled={adding}
                className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution */}
      <SurfaceCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Conflict Resolution</h3>
          <a
            href="https://forms.gle/3RVpCGgZWckYWaTb8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)] hover:text-white"
          >
            <Plus className="h-4 w-4" /> Submit conflict
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm text-center">
            <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-2 pb-3 pt-1">Name</th>
                <th className="px-2 pb-3 pt-1">Date</th>
                <th className="px-2 pb-3 pt-1">Category</th>
                <th className="px-2 pb-3 pt-1">Describe issue or conflict</th>
                <th className="min-w-[280px] px-2 pb-3 pt-1">Solution (E)</th>
                <th className="w-28 px-2 pb-3 pt-1">Status (F)</th>
                <th className="w-[200px] px-2 pb-3 pt-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conflictsData?.rows.map((row, i) => {
                const isEditing = confEditingSolutionAbsIdx === i;
                const detailsText = row.details || '';
                const solutionText = row.solution || '';
                const clampDetails = detailsText.length > CONFLICT_TRUNCATE_LEN;
                const clampSolution = solutionText.length > CONFLICT_TRUNCATE_LEN;
                return (
                  <tr key={row.rowNumber} className="border-b align-middle">
                    <td className="px-2 py-3 text-[var(--color-text)]">{row.name}</td>
                    <td className="px-2 py-3 text-[var(--color-text-muted)]">{row.date}</td>
                    <td className="px-2 py-3 text-[var(--color-text)]">{row.type}</td>
                    <td className="px-2 py-3 align-middle">
                      <div className={`mx-auto max-w-[42ch] whitespace-pre-wrap break-words text-center text-[var(--color-text)] ${clampDetails ? 'line-clamp-3 leading-relaxed' : ''}`}>
                        {row.details || <span className="italic text-[var(--color-text-muted)]">—</span>}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {isEditing ? (
                        <textarea
                          value={confEditedSolution}
                          onChange={(e) => setConfEditedSolution(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-2 text-center text-sm"
                          placeholder="Type solution…"
                        />
                      ) : (
                        <div className={`mx-auto max-w-[56ch] whitespace-pre-wrap break-words text-center text-[var(--color-text)] ${clampSolution ? 'line-clamp-3 leading-relaxed' : ''}`}>
                          {row.solution || <span className="italic text-[var(--color-text-muted)]">—</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={row.status || 'Open'}
                          onChange={async (e) => {
                            const next = e.target.value;
                            setConfSavingStatusAbsIdx(i);
                            const res = await fetch('/api/governance', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                kind: 'conflict',
                                rowNumber: row.rowNumber,
                                status: next,
                              }),
                            });
                            const json = await res.json();
                            setConfSavingStatusAbsIdx(null);
                            if (!res.ok) {
                              setToast(json?.error || 'Failed to update status');
                              setTimeout(() => setToast(null), 2500);
                              return;
                            }
                            setConflictsData(prev => {
                              if (!prev) return prev;
                              const copy = { ...prev, rows: prev.rows.map((r, idx) => idx === i ? { ...r, status: next } : r) };
                              return copy;
                            });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold min-w-[120px] ${statusSelectClass(row.status || 'Open')}`}
                        >
                          {CONFLICT_STATUS_OPTS.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                        {confSavingStatusAbsIdx === i && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={async () => {
                              const res = await fetch('/api/governance', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  kind: 'conflict',
                                  rowNumber: row.rowNumber,
                                  solution: confEditedSolution,
                                }),
                              });
                              const json = await res.json();
                              if (!res.ok) {
                                setToast(json?.error || 'Failed to save solution');
                                setTimeout(() => setToast(null), 2500);
                                return;
                              }
                              setConflictsData(prev => {
                                if (!prev) return prev;
                                const copy = { ...prev, rows: prev.rows.map((r, idx) => idx === i ? { ...r, solution: confEditedSolution } : r) };
                                return copy;
                              });
                              setConfEditingSolutionAbsIdx(null);
                              setConfEditedSolution('');
                              setToast('Solution saved ✅');
                              setTimeout(() => setToast(null), 1500);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95"
                          >
                            <Save className="w-4 h-4" /> Save
                          </button>
                          <button
                            onClick={() => { setConfEditingSolutionAbsIdx(null); setConfEditedSolution(''); }}
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-primary-soft)]"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => { setConfEditingSolutionAbsIdx(i); setConfEditedSolution(row.solution || ''); }}
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)] hover:text-white"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => setConfDetailsRow(row)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
                          >
                            Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!conflictsData || conflictsData.rows.length === 0) && (
                <tr><td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">No conflicts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {confDetailsRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-[var(--surface-card-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text)]">Conflict details</h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Row {confDetailsRow.rowNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfDetailsRow(null)}
                className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                aria-label="Close details"
              >
                x
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Name</div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                  {confDetailsRow.name || <span className="italic text-[var(--color-text-muted)]">-</span>}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Date</div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                  {confDetailsRow.date || <span className="italic text-[var(--color-text-muted)]">-</span>}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Category</div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                  {confDetailsRow.type || <span className="italic text-[var(--color-text-muted)]">-</span>}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Status</div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                  {confDetailsRow.status || <span className="italic text-[var(--color-text-muted)]">-</span>}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3 sm:col-span-2">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Details</div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                  {confDetailsRow.details || <span className="italic text-[var(--color-text-muted)]">-</span>}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] p-3 sm:col-span-2">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Solution</div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]">
                  {confDetailsRow.solution || <span className="italic text-[var(--color-text-muted)]">-</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Directory */}
      <SurfaceCard className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Directory</h3>
        <div className="flex flex-wrap gap-2">
          {DIRECTORY_SHEETS.map((sheet) => (
            <button
              key={sheet}
              onClick={() => setDirectorySheet(sheet)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                directorySheet === sheet
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-subtle)] text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]'
              }`}
            >
              {sheet}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm text-center">
            <thead className="border-b border-[var(--color-border-soft)] text-[var(--color-text-muted)]">
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Location</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {(directory?.rows ?? []).map((row, i) => (
                <tr key={i} className="border-b border-[var(--color-border-soft)] h-16">
                  <td className="text-[var(--color-text)]">{row.name}</td>
                  <td className="text-[var(--color-text-muted)]">{row.role}</td>
                  <td className="text-[var(--color-text)]">{row.location}</td>
                  <td className="text-[var(--color-text)]">{row.email}</td>
                  <td className="text-[var(--color-text)]">{row.phone}</td>
                </tr>
              ))}
              {(directory?.rows.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">
                    No directory entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
