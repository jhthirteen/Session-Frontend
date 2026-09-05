import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QueryResponse } from '../lib/types';
import { metricLabel, seriesColor } from '../lib/format';

export default function ComparisonBars({ response }: { response: QueryResponse }) {
  const { data, viz_hint } = response;
  // Generalized: x_key says what's being compared (players, teams, seasons).
  const xKey = viz_hint.x_key ?? 'PLAYER_NAME';
  const errors = data.filter((r) => typeof r.error === 'string');

  return (
    <div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#111111', fontSize: 13 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#111111',
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ color: '#6b7280', fontSize: 13 }} />
            {viz_hint.y_keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={metricLabel(k)}
                fill={seriesColor(i)}
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {errors.length > 0 && (
        <div className="note">
          {errors.map((r, i) => (
            <div key={i}>
              Note — {String(r[xKey] ?? r.PLAYER_NAME ?? r.TEAM_NAME ?? 'Unknown')}:{' '}
              {String(r.error)} Showing available entries only.
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
