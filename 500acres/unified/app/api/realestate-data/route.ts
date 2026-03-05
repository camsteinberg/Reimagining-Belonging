// app/api/realestate-data/route.ts
import { google, sheets_v4 } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =======================
   Types
======================= */

type LandRow = {
  entity?: string;
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

type ImpactRowAPI = {
  location: string;       // "Grades"
  nestingUnits: number;   // "Units - Nesting Units"
  rvs: number;            // "RVs"
  totalUnits: number;     // nestingUnits + rvs
  careerTrainings?: string;
  socialRepair?: string;
};

type Summary = {
  totalParcels: number;
  leased: number;
  permitsActive: number;
  avgLeaseCost: string | null;
  avgPurchasePrice: string | null;
  acres: number;
  units: number;
};

type APIResponse = {
  land: LandRow[];
  summary: Summary;
  proforma: { rows: ProformaRow[]; scenarios: string[]; valuation: ProformaValuation[] };
  impactDev: {
    rows: ImpactRowAPI[];
    totals: { nestingUnits: number; rvs: number; totalUnits: number };
  };
};

/* =======================
   Constants & Helpers
======================= */

const GEO_OVERRIDES: Record<string, { lat: number; lng: number }> = {
  'Grand Canyon 500 LLC': { lat: 35.7426691, lng: -112.0921648 },
  'Olympic 500 LLC': { lat: 48.1024891, lng: -123.506531 },
  'Yellowstone 500 LLC': { lat: 44.423807, lng: -111.371422 },
  'Bryce 500 LLC': { lat: 37.5669286, lng: -112.0538 },
  'Boise 500 LLC': { lat: 43.6166163, lng: -116.200886 },
  'Outpost 500 LLC': { lat: 37.0475, lng: -112.5263 },
  'Puerto Rico 500 LLC': { lat: 18.220833, lng: -66.590149 },
  'Idaho OZ LLC': { lat: 43.5407, lng: -116.5635 },
  'GC OZ LLC': { lat: 35.7426691, lng: -112.0921648 },
  'Olympic OZ LLC': { lat: 48.118146, lng: -123.430741 },
  'Hawaii 500 LLC': { lat: 19.896766, lng: -155.582782 },
};

const norm = (v: unknown): string => String(v ?? '').trim();

const toNum = (val: unknown): number | null => {
  if (val == null) return null;
  const n = Number(String(val).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const toInt = (v: unknown): number => (toNum(v) ?? 0);

const isLLC = (s: string): boolean => /\bllc\b/i.test(s);

const isAggregateWord = (s: string): boolean => {
  const v = s.toLowerCase();
  return (
    v === '' ||
    v === '-' || v === '--' ||
    v === 'website' ||
    /^total(\b| )/.test(v) ||
    /subtotal|sum\b/.test(v) ||
    /asset value/.test(v) ||
    /opportunity zone/.test(v) ||
    /% of oz/.test(v)
  );
};

const textAt = (row: string[], idx: number): string => (idx >= 0 && idx < row.length ? norm(row[idx]) : '');

/** Canonicalize labels for robust header matching (handles em/en dashes & spacing). */
const canon = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[\u2012\u2013\u2014\u2212\-]+/g, '-')  // normalize all dashes to "-"
    .replace(/[^\p{L}\p{N}\- ]+/gu, '')              // keep letters/numbers/space/dash
    .replace(/\s+/g, ' ')
    .trim();

/** Coerce Google Sheets values to a rectangular array of strings */
const coerceValues = (values: (string | number | null | undefined)[][]): string[][] =>
  values.map((row) => row.map((c) => norm(c)));

/** Try multiple tab names; return A1:Z999 values as string[][] or [] */
async function readSheetBlock(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabCandidates: string[],
): Promise<string[][]> {
  for (const name of tabCandidates) {
    try {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${name}'!A1:Z999`,
      });
      const raw = resp.data.values as (string | number | null | undefined)[][] | undefined;
      const values = raw ? coerceValues(raw) : [];
      if (values.length > 1) return values;
    } catch {
      // try next candidate
    }
  }
  return [];
}

/* =======================
   Handler
======================= */

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sheetId = process.env.BARNDOS_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const missing = [
    !sheetId && 'BARNDOS_SHEET_ID',
    !email && 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    !key && 'GOOGLE_PRIVATE_KEY',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing Google credentials: ${missing.join(', ')}` }, { status: 500 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: email as string, private_key: key as string },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    /* =======================
       PRIMARY: Locations/Units/Acres
    ======================= */
    const locVals = await readSheetBlock(sheets, sheetId as string, [
      'Locations/Unit/Acres Summary',
      'Locations_Unit_Acres Summary',
      'Locations - Unit - Acres',
    ]);

    if (locVals.length < 2) {
      const empty: APIResponse = {
        land: [],
        summary: {
          totalParcels: 0,
          leased: 0,
          permitsActive: 0,
          avgLeaseCost: null,
          avgPurchasePrice: null,
          acres: 0,
          units: 0,
        },
        proforma: { rows: [], scenarios: [], valuation: [] },
        impactDev: { rows: [], totals: { nestingUnits: 0, rvs: 0, totalUnits: 0 } },
      };
      return NextResponse.json(empty);
    }

    const header = locVals[0] as string[];
    const headerNorm = header.map((h: string) => norm(h).toLowerCase());
    const bodyRows = locVals.slice(1) as string[][];

    const findIdx = (re: RegExp): number => headerNorm.findIndex((h: string) => re.test(h));

    // Prefer explicit "Entities" header; fallback to column B (index 1)
    const iEntitiesByHeader = headerNorm.findIndex((h) => /^entities$/.test(h));
    const iEntity = iEntitiesByHeader >= 0 ? iEntitiesByHeader : (headerNorm.length > 1 ? 1 : -1);

    const iLocation = findIdx(/address|location|city|state/);
    const iLease = findIdx(/owned\/?lease|lease.*status|status|owned/);
    const iPermits = findIdx(/permit(?!.*need)/);
    const iZoning = findIdx(/zoning/);
    const iCost = findIdx(/(^|[^a-z])lease.*cost|(^|[^a-z])rent($|[^a-z])/);
    const iAcres = findIdx(/^acres?$/);
    const iUnits = findIdx(/^units?(?:\s*\(.*\))?$/);
    const iLat = findIdx(/lat|latitude/);
    const iLng = findIdx(/lng|long|longitude/);
    const iNotes = findIdx(/note|comment|desc/);
    const iFriendliness = findIdx(/county.*friend|friendliness|friendlieness/);
    const iPurchaseYear = findIdx(/purchase.*year/);
    const iPurchasePrice = findIdx(/purchase.*price/);
    const iPermStructures = findIdx(/allows.*permanent.*structure/);
    const iPermitNeeds = findIdx(/needs?.*building.*permit|need.*permit/);
    const iAcreValue = findIdx(/acre .*value/);
    const iLandValue = findIdx(/land .*value/);

    // Only keep true entity rows (Entities has "LLC"); allow blank/-- location; drop aggregates
    const detailRows: string[][] = bodyRows.filter((row: string[]) => {
      if (!row || row.every((c: string) => norm(c) === '')) return false;

      const ent = textAt(row, iEntity);
      if (isAggregateWord(ent)) return false;
      if (!isLLC(ent)) return false;

      const loc = textAt(row, iLocation);
      if (isAggregateWord(loc)) return true;               // allow empty/-- location
      if (/^\s*\d{1,3}\s*%$/.test(loc)) return false;      // reject bare percentages as "locations"

      return true;
    });

    // Map to LandRow
    const landRowsRaw: LandRow[] = detailRows.map((r: string[]): LandRow => ({
      entity: textAt(r, iEntity) || undefined,
      location: textAt(r, iLocation) || undefined,
      leaseStatus: textAt(r, iLease) || undefined,
      permits: textAt(r, iPermits) || undefined,
      zoning: textAt(r, iZoning) || undefined,
      cost: textAt(r, iCost) || undefined,
      acres: iAcres >= 0 ? toNum(r[iAcres]) : null,
      units: iUnits >= 0 ? toNum(r[iUnits]) : null,
      notes: textAt(r, iNotes) || undefined,
      lat: iLat >= 0 ? toNum(r[iLat]) : null,
      lng: iLng >= 0 ? toNum(r[iLng]) : null,
      countyFriendliness: textAt(r, iFriendliness) || undefined,
      purchaseYear: textAt(r, iPurchaseYear) || undefined,
      purchasePrice: textAt(r, iPurchasePrice) || undefined,
      permanentStructuresAllowed: textAt(r, iPermStructures) || undefined,
      permitNeeds: textAt(r, iPermitNeeds) || undefined,
      acreValue: textAt(r, iAcreValue) || undefined,
      landValue: textAt(r, iLandValue) || undefined,
    }));

    // Deduplicate by entity (merge first non-empty fields)
    const byEntity = new Map<string, LandRow>();
    for (const row of landRowsRaw) {
      const key = (row.entity ?? '').trim();
      if (!key) continue;
      if (!byEntity.has(key)) {
        byEntity.set(key, row);
        continue;
      }
      const prev = byEntity.get(key)!;
      byEntity.set(key, {
        ...prev,
        location: prev.location || row.location,
        leaseStatus: prev.leaseStatus || row.leaseStatus,
        permits: prev.permits || row.permits,
        zoning: prev.zoning || row.zoning,
        cost: prev.cost || row.cost,
        acres: (prev.acres ?? null) ?? row.acres ?? null,
        units: (prev.units ?? null) ?? row.units ?? null,
        notes: prev.notes || row.notes,
        lat: typeof prev.lat === 'number' && Number.isFinite(prev.lat) ? prev.lat : (row.lat ?? null),
        lng: typeof prev.lng === 'number' && Number.isFinite(prev.lng) ? prev.lng : (row.lng ?? null),
        countyFriendliness: prev.countyFriendliness || row.countyFriendliness,
        purchaseYear: prev.purchaseYear || row.purchaseYear,
        purchasePrice: prev.purchasePrice || row.purchasePrice,
        permanentStructuresAllowed: prev.permanentStructuresAllowed || row.permanentStructuresAllowed,
        permitNeeds: prev.permitNeeds || row.permitNeeds,
        acreValue: prev.acreValue || row.acreValue,
        landValue: prev.landValue || row.landValue,
      });
    }

    // Apply geocode overrides
    const land: LandRow[] = Array.from(byEntity.values()).map((row: LandRow): LandRow => {
      const keyEnt = norm(row.entity);
      const override = GEO_OVERRIDES[keyEnt];
      if (!override) return row;
      const lat = typeof row.lat === 'number' && Number.isFinite(row.lat) ? row.lat : override.lat;
      const lng = typeof row.lng === 'number' && Number.isFinite(row.lng) ? row.lng : override.lng;
      return { ...row, lat, lng };
    });

    // Summary
    const summary: Summary = {
      totalParcels: land.length,
      leased: land.filter((r) => String(r.leaseStatus || '').toLowerCase().includes('lease')).length,
      permitsActive: land.filter((r) => String(r.permits || '').toLowerCase().startsWith('y')).length,
      avgLeaseCost: (() => {
        const nums = land.map((r) => toNum(r.cost)).filter((n): n is number => n !== null && Number.isFinite(n));
        return nums.length ? `$${Math.round(nums.reduce((a, b) => a + b, 0) / nums.length).toLocaleString()}/mo` : null;
      })(),
      avgPurchasePrice: (() => {
        const nums = land.map((r) => toNum(r.purchasePrice)).filter((n): n is number => n !== null && Number.isFinite(n));
        return nums.length ? `$${Math.round(nums.reduce((a, b) => a + b, 0) / nums.length).toLocaleString()}` : null;
      })(),
      acres: land.reduce((s, r) => s + (r.acres || 0), 0),
      units: land.reduce((s, r) => s + (r.units || 0), 0),
    };

    /* =======================
       PROFORMA SCENARIOS
    ======================= */
    const proformaVals = await readSheetBlock(sheets, sheetId as string, [
      'Proforma Scenarios',
      'Proforma Scenarios(Josh)',
    ]);

    let proforma: APIResponse['proforma'] = { rows: [], scenarios: [], valuation: [] };

    if (proformaVals.length > 1) {
      const h = proformaVals[0].map((s: string) => norm(s).toLowerCase());
      const idx = (re: RegExp): number => h.findIndex((x: string) => re.test(x));

      const iScenario = idx(/^scenario$/);
      const iUnits2 = idx(/^units?$/);
      const iADR = idx(/^adr$/);
      const iOCC = idx(/^occ|occupancy/);
      const iDays = idx(/operational.*days|op.*days/);
      const iRev = idx(/^rev|revenue$/);
      const iMargin = idx(/margin/);
      const iNOI = idx(/noi/);

      const body = proformaVals.slice(1).filter((r: string[]) => r.some((c: string) => norm(c) !== ''));
      const rows: ProformaRow[] = body
        .filter((r: string[]) => iScenario >= 0 && norm(r[iScenario]) !== '')
        .map((r: string[]): ProformaRow => ({
          scenario: norm(r[iScenario]),
          units: iUnits2 >= 0 ? toInt(r[iUnits2]) : 0,
          adr: iADR >= 0 ? norm(r[iADR]) : '',
          occ: iOCC >= 0 ? norm(r[iOCC]) : '',
          opDays: iDays >= 0 ? norm(r[iDays]) : '',
          rev: iRev >= 0 ? norm(r[iRev]) : '',
          margin: iMargin >= 0 ? norm(r[iMargin]) : '',
          noi: iNOI >= 0 ? norm(r[iNOI]) : '',
        }))
        .filter((row) => !/outpost/i.test(row.scenario || '')); // Drop Outpost scenarios from the overview

      // Optional valuation block on the right
      const headerRowIndex = proformaVals.findIndex(
        (row: string[]) =>
          row &&
          row.some((c: string) => norm(c).toLowerCase() === 'scenario') &&
          row.some((c: string) => /conservative|base|aggressive/i.test(norm(c))),
      );

      let valuation: ProformaValuation[] = [];
      if (headerRowIndex >= 0) {
        const vh = (proformaVals[headerRowIndex] || []).map((x: string) => norm(x));
        const scenarioCols = vh
          .map((name: string, idxCol: number) => ({ name, idxCol }))
          .filter((c) => c.name && c.name.toLowerCase() !== 'scenario');

        const vRows = proformaVals.slice(headerRowIndex + 1).filter((r: string[]) => r && r[0]);
        valuation = vRows
          .filter((r: string[]) => norm(r[0]) !== '')
          .map((r: string[]): ProformaValuation => {
            const rowName = norm(r[0]);
            const values: Record<string, string> = {};
            scenarioCols.forEach((c) => { values[c.name] = norm(r[c.idxCol] ?? ''); });
            return { row: rowName, values };
          });
      }

      proforma = {
        rows,
        scenarios: Array.from(new Set(rows.map((r) => r.scenario).filter(Boolean))),
        valuation,
      };
    }

    /* =======================
       IMPACT (Impact Score: Grades | Units - Nesting Units | RVs)
       Robust header detection
    ======================= */
    let impactDev: APIResponse['impactDev'] = {
      rows: [],
      totals: { nestingUnits: 0, rvs: 0, totalUnits: 0 },
    };

    const impactVals = await readSheetBlock(sheets, sheetId as string, [
      'Impact Score',
      'Impact Development', // fallback
    ]);

    if (impactVals.length > 1) {
      // Find the header row (sheet may have a title row above)
      const headerRowIndex = impactVals.findIndex((row) => {
        const c = row.map((s) => canon(norm(s)));
        return (
          c.includes('grades') &&
          (c.includes('units - nesting units') || c.includes('units nesting units')) &&
          c.includes('rvs')
        );
      });

      if (headerRowIndex >= 0) {
        const headerImpact = impactVals[headerRowIndex].map((s) => norm(s));
        const headerC = headerImpact.map((s) => canon(s));

        const idxOf = (labelCanon: string): number => headerC.findIndex((h) => h === labelCanon);

        const iGrades = idxOf('grades');
        const iNestUnits =
          idxOf('units - nesting units') !== -1
            ? idxOf('units - nesting units')
            : idxOf('units nesting units');
        const iRVs = idxOf('rvs');
        const iCareer = idxOf('career trainings');
        const iSocial = idxOf('social repair');

        if (iGrades >= 0 && iNestUnits >= 0 && iRVs >= 0) {
          const body = impactVals.slice(headerRowIndex + 1) as string[][];

          const rows: ImpactRowAPI[] = body
            .filter((r) => r && r.some((c) => norm(c) !== ''))
            .filter((r) => {
              const label = norm(r[iGrades]);
              if (!label) return false;
              if (canon(label) === 'grades') return false;
              if (/^total\b/i.test(label)) return false;
              return true;
            })
            .map((r): ImpactRowAPI => {
              const location = norm(r[iGrades]);
              const nestingUnits = toInt(r[iNestUnits]);
              const rvs = toInt(r[iRVs]);
              const totalUnits = nestingUnits + rvs;

              return {
                location,
                nestingUnits,
                rvs,
                totalUnits,
                careerTrainings: iCareer >= 0 ? norm(r[iCareer]) : undefined,
                socialRepair: iSocial >= 0 ? norm(r[iSocial]) : undefined,
              };
            });

          const totals = rows.reduce(
            (a, r) => ({
              nestingUnits: a.nestingUnits + r.nestingUnits,
              rvs: a.rvs + r.rvs,
              totalUnits: a.totalUnits + r.totalUnits,
            }),
            { nestingUnits: 0, rvs: 0, totalUnits: 0 },
          );

          impactDev = { rows, totals };
        }
      }
    }

    const payload: APIResponse = {
      land,
      summary,
      proforma,
      impactDev,
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = (err as Error)?.message ?? 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('realestate-data error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch real estate data', land: [], summary: null, proforma: null, impactDev: { rows: [], totals: { nestingUnits: 0, rvs: 0, totalUnits: 0 } } },
      { status: 500 },
    );
  }
}
