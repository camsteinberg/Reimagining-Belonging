// app/realestate/Dashboard.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { SlidersHorizontal } from 'lucide-react';

import SurfaceCard from '@/components/ui/SurfaceCard';

type Props = { username: string; role?: string | null };

type LandRow = {
  entity?: string;              // <-- renamed
  location?: string;
  leaseStatus?: string;
  permits?: string;
  zoning?: string;
  cost?: string;
  acres?: number | null;
  units?: number | null;
  notes?: string;
  lat?: number | null;
  lng?: number | null;
  countyFriendliness?: string;
  purchaseYear?: string;
  purchasePrice?: string;
  permanentStructuresAllowed?: string;
  permitNeeds?: string;
  acreValue?: string;
  landValue?: string;
};

type ProformaRow = {
  scenario: string;
  units: number;
  adr: string;
  occ: string;
  opDays: string;
  rev: string;
  margin: string;
  noi: string;
};
type ProformaValuation = { row: string; values: Record<string, string> };

/** Impact rows now mirror the Impact Score sheet:
 *  Grades | Units - Nesting Units | RVs
 *  We display only Units - Nesting Units and RVs (plus Location).
 */
type ImpactDevRow = {
  location: string;        // Grades
  nestingUnits: number;    // Units - Nesting Units
  rvs: number;             // RVs
  totalUnits: number;      // nestingUnits + rvs (kept for future use)
  careerTrainings?: string;
  socialRepair?: string;
};

const BRAND = {
  base: '#c45d3e',   // ember
  tint: '#f5ede3',   // warm-white
  accent: '#b89f65', // gold
};

const bubbleCls =
  'rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--color-text)]';
const headBar = 'text-lg font-semibold text-[var(--color-text)] border-l-4 pl-2';

const fmt = {
  num: (n?: number | null) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString() : '--'),
  money: (n?: number | null) => (typeof n === 'number' && Number.isFinite(n) ? `$${n.toLocaleString()}` : '--'),
};

export default function RealEstateDashboard({ username, role }: Props) {
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const center = useMemo(() => ({ lat: 43.6635, lng: -116.2626 }), []);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const [selected, setSelected] = useState<LandRow | null>(null);
  const [land, setLand] = useState<LandRow[]>([]);
  const [summary, setSummary] = useState<{
    totalParcels: number;
    leased: number;
    permitsActive: number;
    avgLeaseCost: string | null;
    avgPurchasePrice: string | null;
    acres: number;
    units: number;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [proforma, setProforma] = useState<{ rows: ProformaRow[]; scenarios: string[]; valuation: ProformaValuation[] } | null>(null);

  // UPDATED: Impact state now holds nestingUnits & rvs totals
  const [impactDev, setImpactDev] = useState<{
    rows: ImpactDevRow[];
    totals: { nestingUnits: number; rvs: number; totalUnits: number };
  } | null>(null);

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  // controls
  const [query, setQuery] = useState('');
  const [ownership, setOwnership] = useState<'all' | 'owned' | 'lease'>('all');
  const [permitFilter, setPermitFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [showMap, setShowMap] = useState(false);

  // visible columns
  const [visibleCols] = useState<Record<string, boolean>>({
    location: true,
    leaseStatus: true,
    acres: true,
    units: true,
    countyFriendliness: true,
    purchaseYear: true,
    purchasePrice: true,
    permits: true,
    zoning: false,
    permanentStructuresAllowed: false,
    permitNeeds: false,
    acreValue: false,
    landValue: false,
    cost: false,
    notes: false,
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/realestate-data', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `Fetch failed (${res.status})`);
        if (cancel) return;
        setLand(data.land || []);
        setSummary(data.summary || null);
        setProforma(data.proforma || null);
        setImpactDev(data.impactDev || null);
        const scenarioList = (data.proforma?.scenarios || []).filter(
          (s: string) => s.toLowerCase() !== 'current',
        );
        setSelectedScenario(scenarioList[0] || data.proforma?.scenarios?.[0] || '');
      } catch (e: any) {
        if (!cancel) setErr(e?.message || 'Failed to load real estate data');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // --- Entity display rules ---
  // Keep rows even when location is blank; require an entity; drop "WanderCamps" group header.
  const filteredDisplay = useMemo(() => {
    const q = query.trim().toLowerCase();
    return land
      .filter((r) => {
        const ent = (r.entity || '').trim();
        if (!ent) return false;

        const locLower = (r.location || '').trim().toLowerCase();
        if (locLower === 'wandercamps') return false;

        const matchesQ =
          !q ||
          (r.entity || '').toLowerCase().includes(q) ||
          (r.location || '').toLowerCase().includes(q);

        const own = (r.leaseStatus || '').toLowerCase();
        const matchesOwnership =
          ownership === 'all' ||
          (ownership === 'owned' && own.includes('own')) ||
          (ownership === 'lease' && own.includes('lease'));

        const per = (r.permits || '').toLowerCase();
        const matchesPermit =
          permitFilter === 'all' ||
          (permitFilter === 'yes' && (per.startsWith('y') || per === 'yes')) ||
          (permitFilter === 'no' && (per.startsWith('n') || per === 'no'));

        return matchesQ && matchesOwnership && matchesPermit;
      })
      .sort(
        (a, b) =>
          `${a.entity || ''}`.localeCompare(`${b.entity || ''}`) ||
          `${a.location || ''}`.localeCompare(`${b.location || ''}`)
      );
  }, [land, query, ownership, permitFilter]);

  // Totals for everything currently displayed
  const displayedTotals = useMemo(() => {
    const acres = filteredDisplay.reduce((s, r) => s + (r.acres || 0), 0);
    const units = filteredDisplay.reduce((s, r) => s + (r.units || 0), 0);
    return { acres, units };
  }, [filteredDisplay]);

  // Map markers from displayed rows
  const markers = filteredDisplay.filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number');

  const fitBoundsToMarkers = useCallback(
    (map: google.maps.Map, rows: LandRow[]) => {
      if (!rows.length) return;
      const gmaps = (globalThis as any).google?.maps;
      if (!gmaps) return;

      const coords = rows
        .map((row) =>
          typeof row.lat === 'number' && typeof row.lng === 'number'
            ? { lat: row.lat, lng: row.lng }
            : null,
        )
        .filter((point): point is { lat: number; lng: number } => point !== null);

      if (coords.length === 0) return;
      if (coords.length === 1) {
        map.setCenter(coords[0]);
        map.setZoom(8);
        return;
      }

      const bounds = new gmaps.LatLngBounds();
      coords.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds);
    },
    [],
  );

  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      setMapRef(map);
      fitBoundsToMarkers(map, markers);
    },
    [fitBoundsToMarkers, markers],
  );

  const handleMapUnmount = useCallback(() => {
    setMapRef(null);
  }, []);

  const closeMap = useCallback(() => {
    setShowMap(false);
    setSelected(null);
  }, []);

  useEffect(() => {
    if (!mapRef) return;
    fitBoundsToMarkers(mapRef, markers);
  }, [mapRef, markers, fitBoundsToMarkers]);

  // --------- UI helpers ---------
  const chip = (active: boolean) =>
    `px-3 py-1 rounded-lg text-sm border transition ${
      active
        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] border-[var(--color-primary)] shadow-sm'
        : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary-soft)] border-[var(--color-border-soft)]'
    }`;

  const cards = [
    { title: 'Sites', value: summary?.totalParcels ?? '--' },
    { title: 'Leased', value: summary?.leased ?? '--' },
    { title: summary?.avgLeaseCost ? 'Avg Lease' : 'Avg Purchase', value: summary?.avgLeaseCost || summary?.avgPurchasePrice || '--' },
    { title: 'Total Units', value: summary?.units ?? '--' },
    { title: 'Permits Active', value: summary?.permitsActive ?? '--' },
    { title: 'Total Acres', value: summary?.acres ?? '--' },
  ];

  const landHeaderCells = useMemo(() => {
    const cells: React.ReactNode[] = [
      <th key="entity" className="text-left px-3">Entity</th>,
    ];
    if (visibleCols.location) cells.push(<th key="location" className="text-left px-3">Location</th>);
    if (visibleCols.leaseStatus) cells.push(<th key="leaseStatus" className="text-left px-3">Ownership</th>);
    if (visibleCols.acres) cells.push(<th key="acres" className="text-right px-3">Acres</th>);
    if (visibleCols.units) cells.push(<th key="units" className="text-right px-3">Units</th>);
    if (visibleCols.countyFriendliness) cells.push(<th key="countyFriendliness" className="text-left px-3">County Friendliness</th>);
    if (visibleCols.purchaseYear) cells.push(<th key="purchaseYear" className="text-right px-3">Purchase Year</th>);
    if (visibleCols.purchasePrice) cells.push(<th key="purchasePrice" className="text-right px-3">Purchase Price</th>);
    if (visibleCols.permits) cells.push(<th key="permits" className="text-left px-3">Permits</th>);
    if (visibleCols.zoning) cells.push(<th key="zoning" className="text-left px-3">Zoning</th>);
    if (visibleCols.permanentStructuresAllowed) cells.push(<th key="permanentStructuresAllowed" className="text-left px-3">Perm Structures Allowed</th>);
    if (visibleCols.permitNeeds) cells.push(<th key="permitNeeds" className="text-left px-3">Permit Needs</th>);
    if (visibleCols.acreValue) cells.push(<th key="acreValue" className="text-right px-3">Acre Value</th>);
    if (visibleCols.landValue) cells.push(<th key="landValue" className="text-right px-3">Land Value</th>);
    if (visibleCols.cost) cells.push(<th key="cost" className="text-right px-3">Lease Cost</th>);
    if (visibleCols.notes) cells.push(<th key="notes" className="text-left px-3">Notes</th>);
    return cells;
  }, [visibleCols]);

  const buildLandRowCells = useCallback((row: LandRow) => {
    const leaseStatus = row.leaseStatus || '--';
    const ownershipBadge = (() => {
      const normalized = (row.leaseStatus || '').toLowerCase();
      if (normalized.includes('own')) return 'bg-[#6b8f71]/15 text-[#3d6b4f]';
      if (normalized.includes('lease')) return 'bg-[#3a5a6e]/15 text-[#3a5a6e]';
      return 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]';
    })();

    const cells: React.ReactNode[] = [
      <td key="entity" className="px-3 py-2">{row.entity || '--'}</td>,
    ];

    if (visibleCols.location) cells.push(<td key="location" className="px-3 py-2">{row.location || '--'}</td>);
    if (visibleCols.leaseStatus) {
      cells.push(
        <td key="leaseStatus" className="px-3 py-2">
          <span className={`px-2 py-1 rounded-md text-xs ${ownershipBadge}`}>
            {leaseStatus}
          </span>
        </td>,
      );
    }
    if (visibleCols.acres) cells.push(<td key="acres" className="px-3 py-2 text-right">{fmt.num(row.acres)}</td>);
    if (visibleCols.units) cells.push(<td key="units" className="px-3 py-2 text-right">{fmt.num(row.units)}</td>);
    if (visibleCols.countyFriendliness) cells.push(<td key="countyFriendliness" className="px-3 py-2">{row.countyFriendliness || '--'}</td>);
    if (visibleCols.purchaseYear) cells.push(<td key="purchaseYear" className="px-3 py-2 text-right">{row.purchaseYear || '--'}</td>);
    if (visibleCols.purchasePrice) cells.push(<td key="purchasePrice" className="px-3 py-2 text-right">{row.purchasePrice || '--'}</td>);
    if (visibleCols.permits) cells.push(<td key="permits" className="px-3 py-2">{row.permits || '--'}</td>);
    if (visibleCols.zoning) cells.push(<td key="zoning" className="px-3 py-2">{row.zoning || '--'}</td>);
    if (visibleCols.permanentStructuresAllowed) cells.push(<td key="permanentStructuresAllowed" className="px-3 py-2">{row.permanentStructuresAllowed || '--'}</td>);
    if (visibleCols.permitNeeds) cells.push(<td key="permitNeeds" className="px-3 py-2">{row.permitNeeds || '--'}</td>);
    if (visibleCols.acreValue) cells.push(<td key="acreValue" className="px-3 py-2 text-right">{row.acreValue || '--'}</td>);
    if (visibleCols.landValue) cells.push(<td key="landValue" className="px-3 py-2 text-right">{row.landValue || '--'}</td>);
    if (visibleCols.cost) cells.push(<td key="cost" className="px-3 py-2 text-right">{row.cost || '--'}</td>);
    if (visibleCols.notes) cells.push(<td key="notes" className="px-3 py-2">{row.notes || '--'}</td>);

    return cells;
  }, [visibleCols]);

  const landTotalsCells = useMemo(() => {
    const cells: React.ReactNode[] = [
      <td key="label" className="px-3 py-2 text-left">Total</td>,
    ];
    if (visibleCols.location) cells.push(<td key="location" className="px-3 py-2">--</td>);
    if (visibleCols.leaseStatus) cells.push(<td key="leaseStatus" className="px-3 py-2">--</td>);
    if (visibleCols.acres) cells.push(<td key="acres" className="px-3 py-2 text-right">{fmt.num(displayedTotals.acres)}</td>);
    if (visibleCols.units) cells.push(<td key="units" className="px-3 py-2 text-right">{fmt.num(displayedTotals.units)}</td>);
    if (visibleCols.countyFriendliness) cells.push(<td key="countyFriendliness" className="px-3 py-2">--</td>);
    if (visibleCols.purchaseYear) cells.push(<td key="purchaseYear" className="px-3 py-2 text-right">--</td>);
    if (visibleCols.purchasePrice) cells.push(<td key="purchasePrice" className="px-3 py-2 text-right">--</td>);
    if (visibleCols.permits) cells.push(<td key="permits" className="px-3 py-2">--</td>);
    if (visibleCols.zoning) cells.push(<td key="zoning" className="px-3 py-2">--</td>);
    if (visibleCols.permanentStructuresAllowed) cells.push(<td key="permanentStructuresAllowed" className="px-3 py-2">--</td>);
    if (visibleCols.permitNeeds) cells.push(<td key="permitNeeds" className="px-3 py-2">--</td>);
    if (visibleCols.acreValue) cells.push(<td key="acreValue" className="px-3 py-2 text-right">--</td>);
    if (visibleCols.landValue) cells.push(<td key="landValue" className="px-3 py-2 text-right">--</td>);
    if (visibleCols.cost) cells.push(<td key="cost" className="px-3 py-2 text-right">--</td>);
    if (visibleCols.notes) cells.push(<td key="notes" className="px-3 py-2">--</td>);
    return cells;
  }, [displayedTotals, visibleCols]);

  // ===== Impact (Units - Nesting Units, RVs only) =====
  const impactHeaderCells = useMemo(() => [
    <th key="location" className="px-3 py-2 text-left">Location</th>,
    <th key="nestingUnits" className="px-3 py-2 text-center">Units - Nesting Units</th>,
    <th key="rvs" className="px-3 py-2 text-center">RVs</th>,
  ], []);

  const buildImpactRowCells = useCallback((row: ImpactDevRow) => {
    return [
      <td key="location" className="px-3 py-2 text-left">{row.location}</td>,
      <td key="nestingUnits" className="px-3 py-2 text-center">{fmt.num(row.nestingUnits)}</td>,
      <td key="rvs" className="px-3 py-2 text-center">{fmt.num(row.rvs)}</td>,
    ];
  }, []);

  const impactTotalsCells = useMemo(() => {
    if (!impactDev || impactDev.rows.length === 0) return null;
    const totalNest = impactDev.rows.reduce((s, r) => s + (r.nestingUnits || 0), 0);
    const totalRVs  = impactDev.rows.reduce((s, r) => s + (r.rvs || 0), 0);
    return [
      <td key="label" className="px-3 py-2 text-left font-semibold">Total</td>,
      <td key="nestingUnits" className="px-3 py-2 text-center font-semibold">{fmt.num(totalNest)}</td>,
      <td key="rvs" className="px-3 py-2 text-center font-semibold">{fmt.num(totalRVs)}</td>,
    ];
  }, [impactDev]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-semibold leading-tight text-[var(--color-text)] md:text-4xl">Real Estate</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Site and lease overview - English dataset</p>
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

      {/* Summary Cards */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ title, value }) => (
          <SurfaceCard key={title} variant="muted" padding="sm" className="text-center">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {title}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{String(value)}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* Controls */}
      <SurfaceCard padding="sm" className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entity or location..."
            className="w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)] sm:w-64"
          />

          <div className="flex flex-wrap gap-2">
            <button className={chip(ownership === 'all')} onClick={() => setOwnership('all')}>Ownership: All</button>
            <button className={chip(ownership === 'owned')} onClick={() => setOwnership('owned')}>Owned</button>
            <button className={chip(ownership === 'lease')} onClick={() => setOwnership('lease')}>Lease</button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={chip(permitFilter === 'all')} onClick={() => setPermitFilter('all')}>Permits: All</button>
            <button className={chip(permitFilter === 'yes')} onClick={() => setPermitFilter('yes')}>Yes</button>
            <button className={chip(permitFilter === 'no')} onClick={() => setPermitFilter('no')}>No</button>
          </div>

          <div className="ml-auto flex flex-wrap gap-2">
            <button className={chip(showMap)} onClick={() => setShowMap(true)}>{showMap ? 'Showing Map' : 'Show Map'}</button>
          </div>
        </div>
      </SurfaceCard>

      {/* Detail Table */}
      <SurfaceCard padding="sm" className="mt-6 space-y-4">
        {err && <p className="text-sm text-[#c45d3e]">{err}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr className="h-10">{landHeaderCells}</tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={20} className="py-10 text-center text-[var(--color-text-muted)] italic">Loading...</td>
                </tr>
              ) : filteredDisplay.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-10 text-center text-[var(--color-text-muted)]">No rows</td>
                </tr>
              ) : (
                filteredDisplay.map((r, i) => (
                  <tr
                    key={`${r.entity}-${r.location}-${i}`}
                    className="border-b border-[var(--color-border-soft)] odd:bg-[var(--color-surface)] even:bg-[var(--color-surface-subtle)]"
                  >
                    {buildLandRowCells(r)}
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals (displayed) */}
            {!loading && filteredDisplay.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--color-surface-subtle)] font-semibold text-[var(--color-text)]">
                  {landTotalsCells}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SurfaceCard>

      {/* Proforma Overview */}
      {proforma && (
        <SurfaceCard padding="sm" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={headBar} style={{ borderColor: BRAND.accent }}>Proforma Overview</h3>
            <div className="flex flex-wrap gap-2">
              {(proforma.scenarios || [])
                .filter((s) => s.toLowerCase() !== 'current')
                .map((s) => (
                  <button key={s} className={chip(selectedScenario === s)} onClick={() => setSelectedScenario(s)}>
                    {s}
                  </button>
                ))}
            </div>
          </div>

          {/* Metric bubbles */}
          {(() => {
            const metricKeys: Array<{ key: keyof ProformaRow; label: string }> = [
              { key: 'units', label: 'Units' },
              { key: 'adr', label: 'ADR' },
              { key: 'occ', label: 'OCC' },
              { key: 'opDays', label: 'Op Days' },
              { key: 'rev', label: 'Revenue' },
              { key: 'noi', label: 'NOI' },
            ];

            const renderScenario = (name: string) => {
              const row = proforma.rows.find((r) => r.scenario === name);
              if (!row) return null;
              return (
                <div key={name} className="mt-3 space-y-3">
                  {selectedScenario === 'All' && (
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      {name}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    {metricKeys.map((m) => (
                      <div key={String(m.key)} className={bubbleCls}>
                        <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          {m.label}
                        </div>
                        <div className="mt-0.5 font-semibold text-[var(--color-text)]">{String(row[m.key] ?? '--')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            const names = selectedScenario
              ? [selectedScenario]
              : (proforma.scenarios || []).filter((s) => s.toLowerCase() !== 'current');
            return <>{names.map((n) => renderScenario(n))}</>;
          })()}
        </SurfaceCard>
      )}

      {/* Impact (Units - Nesting Units & RVs only) */}
      {impactDev && (
        <SurfaceCard padding="sm" className="mt-6 space-y-4">
          <h3 className={`${headBar} mb-3`} style={{ borderColor: BRAND.accent }}>Impact</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <tr>{impactHeaderCells}</tr>
              </thead>

              <tbody>
                {impactDev.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[var(--color-text-muted)]">No rows</td>
                  </tr>
                ) : (
                  impactDev.rows.map((r, i) => {
                    return (
                      <tr
                        key={i}
                        className="border-b border-[var(--color-border-soft)] odd:bg-[var(--color-surface)] even:bg-[var(--color-surface-subtle)]"
                      >
                        {buildImpactRowCells(r)}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {impactTotalsCells && (
                <tfoot>
                  <tr className="bg-[var(--color-surface-subtle)] font-medium text-[var(--color-text)]">
                    {impactTotalsCells}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </SurfaceCard>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4" onClick={closeMap}>
          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <SurfaceCard padding="lg" className="space-y-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <h4 className={headBar} style={{ borderColor: BRAND.accent }}>Entity Locations</h4>
                <button
                  type="button"
                  onClick={closeMap}
                  className="rounded-lg border border-[var(--color-border-soft)] px-3 py-1 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
                >
                  Close
                </button>
              </div>
              <div className="h-[70vh] w-full overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
                <div className="h-full w-full">
                  {loadError ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#c45d3e]">
                      Failed to load map. Check your API key / billing.
                    </div>
                  ) : !isLoaded ? (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)] italic">
                      Loading map...
                    </div>
                  ) : markers.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
                      No geocoded locations yet.
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={center}
                      zoom={6}
                      onLoad={handleMapLoad}
                      onUnmount={handleMapUnmount}
                      options={{ fullscreenControl: false, mapTypeControl: false, streetViewControl: false }}
                    >
                      {markers.map((m, i) => (
                        <Marker
                          key={`${m.entity}-${i}`}
                          position={{ lat: m.lat!, lng: m.lng! }}
                          onClick={() => setSelected(m)}
                          icon={{
                            url: (String(m.leaseStatus || '').toLowerCase().includes('own'))
                              ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                              : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                          }}
                        />
                      ))}
                      {selected && (
                        <InfoWindow
                          position={{ lat: selected.lat!, lng: selected.lng! }}
                          onCloseClick={() => setSelected(null)}
                        >
                          <div className="text-sm font-medium text-[var(--color-text)]">
                            {selected.entity || selected.location || 'Entity'} ({selected.leaseStatus || 'N/A'})
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  )}
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </>
  );
}
