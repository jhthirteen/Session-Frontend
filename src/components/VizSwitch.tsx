import type { QueryResponse } from '../lib/types';
import { detectSeriesKey } from '../lib/pivot';
import ComparisonBars from './ComparisonBars';
import ComparisonChart from './ComparisonChart';
import DataTable from './DataTable';
import Leaderboard from './Leaderboard';
import { StatCard, TeamStatCard } from './StatCards';
import TrendOrTimeChart from './TrendOrTimeChart';

export default function VizSwitch({ response }: { response: QueryResponse }) {
  const { viz_hint, spec, data } = response;

  // needs_clarification: render prompt text, never an empty chart.
  if (spec.intent === 'needs_clarification' || data.length === 0) {
    return (
      <div className="clarify">
        <div className="clarify-title">Need a little more detail</div>
        <p>{response.answer_text}</p>
        <p className="muted">
          Try a full name ("Jalen Brunson"), a team ("Boston Celtics"), and an
          optional season ("in 2024-25").
        </p>
      </div>
    );
  }

  // Any payload whose rows split into 2+ series along an axis OTHER than the
  // x-axis gets the multi-series view — regardless of viz type. This upgrades
  // legacy single-trend payloads whose rows secretly contain two players'
  // histories (no backend change needed). Snapshot compares (series == x,
  // e.g. x=PLAYER_NAME) stay as grouped bars.
  const seriesKey = detectSeriesKey(response);
  const multiSeries =
    viz_hint.type === 'multi_trend' ||
    (seriesKey !== null && seriesKey !== viz_hint.x_key);

  switch (viz_hint.type) {
    case 'single_stat':
      return <StatCard response={response} />;
    case 'team_stat_card':
      return <TeamStatCard response={response} />;
    case 'multi_trend':
      return <ComparisonChart response={response} />;
    case 'comparison_bars':
      return <ComparisonBars response={response} />;
    case 'leaderboard':
      return <Leaderboard response={response} />;
    case 'time_series':
      return multiSeries ? (
        <ComparisonChart response={response} />
      ) : (
        <div className="split">
          <TrendOrTimeChart response={response} mode="game" />
          <DataTable response={response} />
        </div>
      );
    case 'trend_line':
      return multiSeries ? (
        <ComparisonChart response={response} />
      ) : (
        <TrendOrTimeChart response={response} mode="season" />
      );
    case 'game_log_table':
      return <DataTable response={response} />;
    default:
      // Forward-compatible fallback for unknown future viz types.
      return <DataTable response={response} />;
  }
}
