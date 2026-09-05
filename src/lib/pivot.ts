import type { DataRow, QueryResponse } from './types';
import { chronological, fullDate, parseGameDate, shortDate } from './format';

export type SeriesKey = 'PLAYER_NAME' | 'TEAM_NAME' | 'SEASON';

const MAX_SERIES = 5;

function distinct(values: unknown[]): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => typeof v === 'string' && v !== '')),
  );
}

/**
 * Which key splits rows into comparable series, if any.
 * Prefers the backend's explicit `series_key`; otherwise infers from the data
 * so legacy payloads (e.g. two concatenated career trends) still upgrade to a
 * multi-series view instead of collapsing into one line. Null = single series.
 */
export function detectSeriesKey(response: QueryResponse): SeriesKey | null {
  const hinted = response.viz_hint.series_key;
  const xKey = response.viz_hint.x_key;
  if (hinted === 'PLAYER_NAME' || hinted === 'TEAM_NAME' || hinted === 'SEASON') {
    // A series equal to the x-axis is a snapshot (grouped bars), not a
    // multi-series view — treat as single series.
    if (hinted === xKey) return null;
    const vals = distinct(response.data.map((r) => r[hinted]));
    return vals.length >= 2 ? hinted : null;
  }
  // Never split on the x-axis itself.
  const candidates: SeriesKey[] = ['PLAYER_NAME', 'TEAM_NAME'].filter(
    (k) => k !== xKey,
  ) as SeriesKey[];
  for (const k of candidates) {
    if (distinct(response.data.map((r) => r[k])).length >= 2) return k;
  }
  return null;
}

/** Entity names for a series key, capped for readability. */
export function seriesNames(data: DataRow[], seriesKey: SeriesKey): string[] {
  return distinct(data.map((r) => r[seriesKey])).slice(0, MAX_SERIES);
}

export interface WideRow {
  x: string;
  full: string;
  [series: string]: string | number | null;
}

function xLabel(xKey: string, value: unknown): { short: string; full: string } {
  if (xKey === 'GAME_DATE')
    return { short: shortDate(value), full: fullDate(value) };
  const s = String(value ?? '');
  return { short: s, full: s };
}

/**
 * Pivot long rows into wide chart rows: one row per x value, one column per
 * series. Uses the UNION of x values; missing entity/x combos are null so
 * lines break (never interpolated) and bars simply skip.
 */
export function toWideRows(
  data: DataRow[],
  xKey: string,
  seriesKey: SeriesKey,
  metric: string,
  entities: string[],
): WideRow[] {
  const xVals = Array.from(
    new Set(
      data.map((r) => r[xKey]).filter((v) => v !== null && v !== undefined),
    ),
  );
  const sorted =
    xKey === 'GAME_DATE'
      ? xVals.sort((a, b) => parseGameDate(a) - parseGameDate(b))
      : [...xVals].sort((a, b) => String(a).localeCompare(String(b)));

  const lookup = new Map<string, DataRow[]>();
  for (const r of data) {
    const k = `${String(r[xKey])}|||${String(r[seriesKey])}`;
    const arr = lookup.get(k) ?? [];
    arr.push(r);
    lookup.set(k, arr);
  }

  return sorted.map((x) => {
    const { short, full } = xLabel(xKey, x);
    const row: WideRow = { x: short, full };
    for (const e of entities) {
      const matches = lookup.get(`${String(x)}|||${e}`) ?? [];
      const numeric = matches.find(
        (m) => typeof m[metric] === 'number' && !m.error,
      );
      row[e] = (numeric?.[metric] as number | null) ?? null;
    }
    return row;
  });
}

export interface SeriesSummary {
  name: string;
  avg: number | null;
  peak: number | null;
  peakX: string | null;
  n: number;
}

/** Per-series average + peak over the pivoted rows (client-side summary strip). */
export function summarizeWide(rows: WideRow[], entities: string[]): SeriesSummary[] {
  return entities.map((e) => {
    let sum = 0;
    let n = 0;
    let peak: number | null = null;
    let peakX: string | null = null;
    for (const r of rows) {
      const v = r[e];
      if (typeof v !== 'number') continue;
      sum += v;
      n += 1;
      if (peak === null || v > peak) {
        peak = v;
        peakX = r.full;
      }
    }
    return { name: e, avg: n > 0 ? sum / n : null, peak, peakX, n };
  });
}

/** Chronological long rows for single-series charts (existing behavior). */
export function longRows<T extends DataRow>(data: T[], xKey: string | null): T[] {
  return chronological(data, xKey);
}
