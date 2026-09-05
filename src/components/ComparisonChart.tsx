import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatStat, metricLabel, seriesColor, trendAxisLabel } from '../lib/format';
import {
  detectSeriesKey,
  seriesNames,
  summarizeWide,
  toWideRows,
  type SeriesKey,
} from '../lib/pivot';
import type { QueryResponse } from '../lib/types';

type View = 'lines' | 'bars' | 'table';
const VIEW_STORAGE_KEY = 'nba-hub-compare-view';

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  color: '#111111',
  fontSize: 13,
} as const;

/**
 * General multi-thing comparison chart. Handles every "compare multiple
 * things sharing an axis" shape: players/teams over seasons, entities over
 * recent games, season-vs-season — anything with a series discriminator.
 * Single-series payloads never reach here (VizSwitch routes those away).
 */
export default function ComparisonChart({ response }: { response: QueryResponse }) {
  const { data, viz_hint, spec } = response;
  const seriesKey: SeriesKey = detectSeriesKey(response) ?? 'PLAYER_NAME';
  const xKey = viz_hint.x_key ?? 'SEASON';

  const entities = useMemo(
    () => seriesNames(data, seriesKey),
    [data, seriesKey],
  );
  const metrics = viz_hint.y_keys.length > 0 ? viz_hint.y_keys : ['PTS'];

  const [view, setView] = useState<View>(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      return saved === 'bars' || saved === 'table' ? saved : 'lines';
    } catch {
      return 'lines';
    }
  });
  const [metric, setMetric] = useState(metrics[0]);
  const [hidden, setHidden] = useState<string[]>([]);

  const visible = entities.filter((e) => !hidden.includes(e));
  const wide = useMemo(
    () => toWideRows(data, xKey, seriesKey, metric, entities),
    [data, xKey, seriesKey, metric, entities],
  );
  const summary = useMemo(() => summarizeWide(wide, entities), [wide, entities]);
  const errors = useMemo(
    () => data.filter((r) => typeof r.error === 'string'),
    [data],
  );
  const gapCount = wide.filter((r) =>
    entities.some((e) => r[e] === null),
  ).length;

  const yLabel =
    xKey === 'SEASON'
      ? trendAxisLabel([metric], spec.per_mode)
      : metricLabel(metric);

  const pickView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const toggleEntity = (e: string) =>
    setHidden((h) => (h.includes(e) ? h.filter((x) => x !== e) : [...h, e]));

  return (
    <div>
      <div className="compare-controls">
        <div className="segment" role="tablist" aria-label="View">
          {(['lines', 'bars', 'table'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={`segment-btn${view === v ? ' active' : ''}`}
              onClick={() => pickView(v)}
            >
              {v === 'lines' ? 'Lines' : v === 'bars' ? 'Bars' : 'Table'}
            </button>
          ))}
        </div>
        {metrics.length > 1 && (
          <select
            className="metric-select"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            aria-label="Metric"
          >
            {metrics.map((m) => (
              <option key={m} value={m}>
                {metricLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="legend-row">
        {entities.map((e, i) => (
          <button
            key={e}
            type="button"
            className={`legend-chip${hidden.includes(e) ? ' off' : ''}`}
            onClick={() => toggleEntity(e)}
            title={hidden.includes(e) ? `Show ${e}` : `Hide ${e}`}
          >
            <span
              className="legend-swatch"
              style={{ background: seriesColor(i) }}
            />
            {e}
          </button>
        ))}
      </div>

      {view !== 'table' ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={340}>
            {view === 'lines' ? (
              <LineChart data={wide} margin={{ top: 12, right: 20, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="x"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.full ?? '')
                  }
                  formatter={(value) =>
                    typeof value === 'number' ? formatStat(metric, value) : '—'
                  }
                />
                <Legend wrapperStyle={{ color: '#6b7280', fontSize: 13 }} />
                {visible.map((e) => (
                  <Line
                    key={e}
                    type="monotone"
                    dataKey={e}
                    name={e}
                    stroke={seriesColor(entities.indexOf(e))}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: seriesColor(entities.indexOf(e)), strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={wide} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="x"
                  tick={{ fill: '#111111', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.full ?? '')
                  }
                  formatter={(value) =>
                    typeof value === 'number' ? formatStat(metric, value) : '—'
                  }
                />
                <Legend wrapperStyle={{ color: '#6b7280', fontSize: 13 }} />
                {visible.map((e) => (
                  <Bar
                    key={e}
                    dataKey={e}
                    name={e}
                    fill={seriesColor(entities.indexOf(e))}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>{xKey === 'SEASON' ? 'Season' : xKey === 'GAME_DATE' ? 'Game' : 'Group'}</th>
                {entities.map((e) => (
                  <th key={e}>{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wide.map((r) => (
                <tr key={r.full}>
                  <td>{r.full}</td>
                  {entities.map((e) => (
                    <td key={e}>
                      {typeof r[e] === 'number'
                        ? formatStat(metric, r[e] as number)
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="summary-strip">
        {summary.map((s, i) => (
          <div key={s.name} className="summary-item">
            <span className="legend-swatch" style={{ background: seriesColor(i) }} />
            <b>{s.name}</b>
            <span className="muted">
              avg {s.avg !== null ? formatStat(metric, Math.round(s.avg * 10) / 10) : '—'}
              {s.peak !== null && (
                <> · peak {formatStat(metric, s.peak)} ({s.peakX})</>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="chart-foot">
        {entities.length} compared · {wide.length}{' '}
        {xKey === 'SEASON' ? 'seasons' : xKey === 'GAME_DATE' ? 'games' : 'groups'}
        {xKey === 'SEASON' && spec.per_mode === 'Totals' ? ' · season totals' : ''}
        {xKey === 'SEASON' && spec.per_mode !== 'Totals' ? ' · per-game averages' : ''}
        {gapCount > 0 && ` · ${gapCount} ${gapCount === 1 ? 'point' : 'points'} missing for at least one (unequal coverage)`}
      </div>
      {errors.length > 0 && (
        <div className="note">
          {errors
            .filter((r) => typeof r.error === 'string')
            .slice(0, 5)
            .map((r, i) => (
              <div key={i}>
                Note — {String(r[seriesKey] ?? r.PLAYER_NAME ?? r.TEAM_NAME ?? 'Unknown')}:{' '}
                {String(r.error)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
