export type Intent =
  | 'player_season_avg'
  | 'player_game_logs'
  | 'team_stats'
  | 'team_game_logs'
  | 'compare_players'
  | 'compare_teams'
  | 'compare_trends'
  | 'player_career_trend'
  | 'team_history_trend'
  | 'needs_clarification';

export type VizType =
  | 'single_stat'
  | 'comparison_bars'
  | 'time_series'
  | 'game_log_table'
  | 'team_stat_card'
  | 'trend_line'
  | 'multi_trend';

export type MetricKey =
  | 'PTS'
  | 'AST'
  | 'REB'
  | 'STL'
  | 'BLK'
  | 'MIN'
  | 'FG_PCT'
  | 'FG3M'
  | 'FG3_PCT'
  | 'FT_PCT'
  | 'W'
  | 'L'
  | 'W_PCT';

export interface QuerySpec {
  intent: Intent;
  players: string[];
  teams: string[];
  season: string | null;
  metrics: MetricKey[];
  last_n: number | null;
  per_mode: 'PerGame' | 'Totals';
  seasons: string[];
  highlight_season: string | null;
  highlight_note: string | null;
  raw_query?: string | null;
}

export interface VizHint {
  type: VizType;
  title: string;
  x_key: string | null;
  y_keys: string[];
  /** Compare discriminator: 'PLAYER_NAME' / 'TEAM_NAME' / 'SEASON'. Null = single series. */
  series_key?: string | null;
}

export interface ToolCallTrace {
  tool: string;
  args: Record<string, unknown>;
  result_summary: string | null;
}

export type DataRow = Record<string, number | string | null> & {
  error?: string;
};

export interface QueryResponse {
  answer_text: string;
  spec: QuerySpec;
  data: DataRow[];
  viz_hint: VizHint;
  debug: ToolCallTrace[];
}

export type ApiError = {
  status: number;
  message: string;
};
