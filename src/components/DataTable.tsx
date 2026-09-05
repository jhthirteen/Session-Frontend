import type { QueryResponse } from '../lib/types';
import { formatStat, fullDate, metricLabel } from '../lib/format';

export default function DataTable({ response }: { response: QueryResponse }) {
  const { data } = response;
  if (data.length === 0) return <div className="muted">No rows returned.</div>;
  const cols = Array.from(
    new Set(data.flatMap((r) => Object.keys(r)).filter((k) => k !== '__xLabel' && k !== '__full')),
  );
  const pretty = (k: string) => metricLabel(k);

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{pretty(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={row.error ? 'row-error' : ''}>
              {cols.map((c) => (
                <td key={c}>
                  {c === 'GAME_DATE'
                    ? fullDate(row[c])
                    : typeof row[c] === 'number'
                      ? formatStat(c, row[c] as number)
                      : String(row[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="chart-foot">{data.length} rows</div>
    </div>
  );
}
