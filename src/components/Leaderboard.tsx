import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QueryResponse } from '../lib/types';
import { formatStat, metricLabel, seriesColor, trendAxisLabel } from '../lib/format';

/**
 * Ranked leaderboard: one stat, one season, top N players. Horizontal bars
 * sorted by RANK (best on top), #1 highlighted in brand purple with a Leader
 * badge. A vertical layout reads as a ranking — N names on a vertical bar
 * chart's x-axis would be unreadable.
 */
export default function Leaderboard({ response }: { response: QueryResponse }) {
  const { data, viz_hint, spec } = response;
  const metric = viz_hint.y_keys.length > 0 ? viz_hint.y_keys[0] : 'PTS';
  const rows = [...data]
    .filter((r) => typeof r.error !== 'string')
    .sort((a, b) => Number(a.RANK ?? 999) - Number(b.RANK ?? 999));
  const errors = data.filter((r) => typeof r.error === 'string');
  const leader = rows[0];
  const yLabel = trendAxisLabel([metric], spec.per_mode);

  return (
    <div>
      {leader && (
        <div className="leader-banner">
          <span className="leader-badge">Leader</span>
          <b>{String(leader.PLAYER_NAME ?? 'Unknown')}</b>
          <span className="muted">
            {' '}{formatStat(metric, leader[metric] as number | string | null)}{' '}
            {metricLabel(metric)} {spec.per_mode === 'Totals' ? 'total' : 'per game'}
            {typeof leader.GP === 'number' ? ` · ${leader.GP} games` : ''}
          </span>
        </div>
      )}
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 52 + 60)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              label={{ value: yLabel, position: 'insideBottom', offset: -2, fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="PLAYER_NAME"
              tick={{ fill: '#111111', fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              width={150}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#111111',
                fontSize: 13,
              }}
              formatter={(value, _name, props) => {
                const p = props?.payload as Record<string, unknown> | undefined;
                const team = p?.TEAM_ABBREVIATION ? ` (${p.TEAM_ABBREVIATION})` : '';
                const gp = typeof p?.GP === 'number' ? ` · ${p.GP} GP` : '';
                return [
                  `${typeof value === 'number' ? formatStat(metric, value) : '—'}${team}${gp}`,
                  `Rank ${String(p?.RANK ?? '—')}`,
                ];
              }}
            />
            <Bar dataKey={metric} radius={[0, 4, 4, 0]} maxBarSize={26}>
              {rows.map((r, i) => (
                <Cell key={String(r.PLAYER_NAME ?? i)} fill={seriesColor(i === 0 ? 0 : 1)} />
              ))}
              <LabelList
                dataKey={metric}
                position="right"
                formatter={(v: unknown) => (typeof v === 'number' ? formatStat(metric, v) : '—')}
                style={{ fill: '#6b7280', fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        {rows.length} ranked · {String(spec.season ?? '')}{' '}
        {spec.per_mode === 'Totals' ? 'season totals' : 'per-game averages'}
      </div>
      {errors.length > 0 && (
        <div className="note">
          {errors.map((r, i) => (
            <div key={i}>Note — {String(r.PLAYER_NAME ?? 'Unknown')}: {String(r.error)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
