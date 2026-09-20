import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DataRow, QueryResponse } from '../lib/types';
import {
  chronological,
  fullDate,
  metricLabel,
  seriesColor,
  shortDate,
  trendAxisLabel,
} from '../lib/format';

interface Props {
  response: QueryResponse;
  /** 'season' for trend_line (x=SEASON), 'game' for time_series (x=GAME_DATE) */
  mode: 'season' | 'game';
}

export default function TrendOrTimeChart({ response, mode }: Props) {
  const { data, viz_hint, spec } = response;
  const xKey = mode === 'season' ? 'SEASON' : 'GAME_DATE';
  type ChartRow = DataRow & { __xLabel: string; __full: string };
  const rows: ChartRow[] = chronological(data, xKey).map((r) => ({
    ...r,
    __xLabel:
      mode === 'season' ? String(r.SEASON ?? '') : shortDate(r.GAME_DATE),
    __full: mode === 'season' ? String(r.SEASON ?? '') : fullDate(r.GAME_DATE),
  }));

  const yKeys = viz_hint.y_keys.length > 0 ? viz_hint.y_keys : ['PTS'];
  // Multi-metric overlays on one axis are unreadable when magnitudes differ
  // (e.g. PTS ~2000 totals vs 3PM ~300) — default to the first metric with a
  // selector, same pattern as ComparisonChart. "All" restores the overlay.
  const [selected, setSelected] = useState<string>(yKeys[0]);
  const activeMetric = yKeys.includes(selected) ? selected : yKeys[0];
  const [showAll, setShowAll] = useState(false);
  const activeKeys = showAll ? yKeys : [activeMetric];

  const yLabel =
    mode === 'season'
      ? trendAxisLabel(activeKeys, spec.per_mode)
      : activeKeys.map(metricLabel).join(' + ');

  const highlight = spec.highlight_season
    ? rows.find((r) => String(r.SEASON) === spec.highlight_season)
    : undefined;
  const highlightMetric = activeKeys[0];

  return (
    <div>
      {spec.highlight_note && (
        <div className="highlight">{spec.highlight_note}</div>
      )}
      {yKeys.length > 1 && (
        <div className="compare-controls">
          <select
            className="metric-select"
            value={showAll ? '__all' : activeMetric}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__all') {
                setShowAll(true);
              } else {
                setShowAll(false);
                setSelected(v);
              }
            }}
            aria-label="Metric"
          >
            {yKeys.map((m) => (
              <option key={m} value={m}>
                {metricLabel(m)}
              </option>
            ))}
            <option value="__all">All metrics</option>
          </select>
        </div>
      )}
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={rows} margin={{ top: 12, right: 20, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="__xLabel"
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
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                fill: '#9ca3af',
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#111111',
                fontSize: 13,
              }}
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.__full ?? '')
              }
            />
            <Legend wrapperStyle={{ color: '#6b7280', fontSize: 13 }} />
            {activeKeys.map((k) => {
              const i = yKeys.indexOf(k);
              return (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                name={metricLabel(k)}
                stroke={seriesColor(i)}
                strokeWidth={2}
                dot={(props: Record<string, unknown>) => {
                  const payload = props.payload as Record<string, unknown> | undefined;
                  const isHl =
                    !!spec.highlight_season &&
                    String(payload?.SEASON ?? '') === spec.highlight_season &&
                    k === highlightMetric;
                  if (isHl) return <circle cx={props.cx as number} cy={props.cy as number} r={5} fill="#7c3aed" stroke="#ffffff" strokeWidth={2} />;
                  return <circle cx={props.cx as number} cy={props.cy as number} r={2.5} fill={seriesColor(i)} strokeWidth={0} />;
                }}
                activeDot={{ r: 4 }}
              />
              );
            })}
            {highlight && highlightMetric && typeof highlight[highlightMetric] === 'number' && (
              <ReferenceDot
                x={highlight.__xLabel as string}
                y={highlight[highlightMetric] as number}
                r={9}
                fill="none"
                stroke="#7c3aed"
                strokeDasharray="3 2"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        {rows.length} {mode === 'season' ? 'seasons' : 'games'} ·{' '}
        {mode === 'game' ? 'oldest → newest' : spec.per_mode === 'Totals' ? 'season totals' : 'per-game averages'}
      </div>
    </div>
  );
}
