import type { QueryResponse } from '../lib/types';
import { formatStat, metricLabel } from '../lib/format';

export function StatCard({ response }: { response: QueryResponse }) {
  const { data, viz_hint, spec } = response;
  const row = data[0] ?? {};
  const name =
    (row.PLAYER_NAME as string) ?? spec.players[0] ?? 'Player';
  const season = (row.SEASON as string) ?? spec.season ?? '';
  const team = row.TEAM_ABBREVIATION as string | undefined;

  return (
    <div className="stat-grid">
      {viz_hint.y_keys.map((k) => (
        <div className="big-stat" key={k}>
          <div className="big-stat-label">
            {name} · {metricLabel(k)} {season}
          </div>
          <div className="big-stat-value">
            {formatStat(k, (row[k] as number | string | null) ?? null)}
            <span className="big-stat-suffix">
              {k.endsWith('_PCT') || k === 'W_PCT' ? '' : k === 'MIN' ? ' min' : k === 'PTS' || k === 'AST' || k === 'REB' ? ' / game' : ''}
            </span>
          </div>
          <div className="big-stat-meta">
            {team && <span className="pill">{team}</span>}
            {row.GP != null && <span>GP {String(row.GP)}</span>}
            {spec.season && <span>{spec.season}</span>}
          </div>
        </div>
      ))}
      {/* Secondary context stats on the row (AST etc.) when only PTS was asked */}
      {viz_hint.y_keys.length === 1 && row.AST != null && (
        <div className="stat-foot">
          Also on the row:{' '}
          {Object.entries(row)
            .filter(([k]) => !['PLAYER_NAME', 'SEASON', 'TEAM_ABBREVIATION', viz_hint.y_keys[0]].includes(k))
            .slice(0, 6)
            .map(([k, v]) => `${k} ${formatStat(k, v as number | string | null)}`)
            .join(' · ')}
        </div>
      )}
    </div>
  );
}

export function TeamStatCard({ response }: { response: QueryResponse }) {
  const { data, spec } = response;
  const row = data[0] ?? {};
  const teamName = spec.teams[0] ?? (row.TEAM_ABBREVIATION as string) ?? 'Team';
  const w = row.W as number | null;
  const l = row.L as number | null;
  const pct = row.W_PCT as number | null;

  return (
    <div className="team-card">
      <div className="team-card-head">
        <div className="team-card-name">{teamName}</div>
        <div className="team-card-season">{spec.season ?? (row.SEASON as string) ?? ''}</div>
      </div>
      <div className="team-card-record">
        {w ?? '—'}–{l ?? '—'}
      </div>
      <div className="team-card-sub">
        {pct != null ? `${(pct * 100).toFixed(1)}% win rate` : 'win% unavailable'}
        {typeof w === 'number' && typeof l === 'number' && w + l > 0 && (
          <> · {w + l} games</>
        )}
      </div>
      <div className="team-card-extra">
        {Object.entries(row)
          .filter(([k]) => !['W', 'L', 'W_PCT', 'TEAM_ABBREVIATION', 'SEASON'].includes(k))
          .slice(0, 8)
          .map(([k, v]) => (
            <span key={k} className="mini-stat">
              <b>{formatStat(k, v as number | string | null)}</b> {metricLabel(k)}
            </span>
          ))}
      </div>
    </div>
  );
}
