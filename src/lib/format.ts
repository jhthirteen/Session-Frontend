/** Shared formatting / parsing helpers. Backend gotchas live here. */

/** Parse "Apr 11, 2025" or "APR 13, 2025" (team logs shout). Case-insensitive. */
export function parseGameDate(raw: unknown): number {
  if (typeof raw !== 'string') return NaN;
  const normalized = raw
    .toLowerCase()
    .replace(/\b([a-z]{3})\b/, (m) => m.charAt(0).toUpperCase() + m.slice(1));
  const t = Date.parse(normalized);
  if (!Number.isNaN(t)) return t;
  return Date.parse(raw);
}

export function shortDate(raw: unknown): string {
  const t = parseGameDate(raw);
  if (Number.isNaN(t)) return String(raw ?? '—');
  return new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function fullDate(raw: unknown): string {
  const t = parseGameDate(raw);
  if (Number.isNaN(t)) return String(raw ?? '—');
  return new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Sort most-recent-first API rows into chronological order for charts. */
export function chronological<T extends Record<string, unknown>>(
  rows: T[],
  xKey: string | null,
): T[] {
  if (!xKey) return [...rows];
  return [...rows].sort((a, b) => {
    const av = a[xKey];
    const bv = b[xKey];
    if (xKey === 'GAME_DATE') {
      const at = parseGameDate(av);
      const bt = parseGameDate(bv);
      if (Number.isNaN(at) || Number.isNaN(bt))
        return String(av ?? '').localeCompare(String(bv ?? ''));
      return at - bt;
    }
    // SEASON "YYYY-YY" sorts lexicographically = chronologically
    return String(av ?? '').localeCompare(String(bv ?? ''));
  });
}

const METRIC_LABELS: Record<string, string> = {
  PTS: 'Points',
  AST: 'Assists',
  REB: 'Rebounds',
  STL: 'Steals',
  BLK: 'Blocks',
  MIN: 'Minutes',
  FG_PCT: 'FG%',
  FG3M: '3PM',
  FG3_PCT: '3P%',
  FT_PCT: 'FT%',
  W: 'Wins',
  L: 'Losses',
  W_PCT: 'Win%',
  GP: 'Games',
  SEASON: 'Season',
  GAME_DATE: 'Game',
  PLAYER_NAME: 'Player',
  TEAM_ABBREVIATION: 'Team',
  MATCHUP: 'Matchup',
  WL: 'W/L',
};

export function metricLabel(key: string): string {
  return METRIC_LABELS[key] ?? key;
}

/** 28.7 -> "28.7", 0.567 -> "56.7%" for PCT keys, 26 -> "26". */
export function formatStat(key: string, value: number | string | null): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (key.endsWith('_PCT')) return `${(value * 100).toFixed(1)}%`;
  if (key === 'W_PCT') return `${(value * 100).toFixed(1)}%`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Axis label respects spec.per_mode: per-game vs totals. */
export function trendAxisLabel(
  metrics: string[],
  perMode: 'PerGame' | 'Totals',
): string {
  const base = metrics.map(metricLabel).join(' + ') || 'Stat';
  return perMode === 'Totals' ? `${base} (totals)` : `${base} (per game)`;
}

const PALETTE = [
  '#7c3aed',
  '#111111',
  '#a78bfa',
  '#6d28d9',
  '#c4b5fd',
  '#9ca3af',
];

export function seriesColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}
