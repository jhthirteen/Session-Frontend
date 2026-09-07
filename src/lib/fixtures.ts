import type { QueryResponse } from './types';

/** Live backend payloads from HANDOFF §3 — used for dev preview when backend is down. */

export const FIXTURE_SINGLE_STAT: QueryResponse = {
  answer_text:
    'Jalen Brunson averaged 26.0 points per game in the 2025-26 regular season.',
  spec: {
    intent: 'player_season_avg',
    players: ['Jalen Brunson'],
    teams: [],
    season: '2025-26',
    metrics: ['PTS'],
    last_n: null,
    top_n: null,
    per_mode: 'PerGame',
    seasons: [],
    highlight_season: null,
    highlight_note: null,
    raw_query: 'how many points did jalen brunson average last year',
  },
  data: [
    {
      PLAYER_NAME: 'Jalen Brunson',
      SEASON: '2025-26',
      GP: 74,
      PTS: 26.0,
      AST: 6.8,
      TEAM_ABBREVIATION: 'NYK',
    },
  ],
  viz_hint: {
    type: 'single_stat',
    title: 'Jalen Brunson PTS 2025-26',
    x_key: null,
    y_keys: ['PTS'],
  },
  debug: [
    {
      tool: 'get_player_season_avg',
      args: { player: 'Jalen Brunson', season: '2025-26' },
      result_summary: '1 row, PTS 26.0',
    },
  ],
};

export const FIXTURE_COMPARISON: QueryResponse = {
  answer_text:
    'In 2024-25, Jalen Brunson averaged 26.0 points per game vs 18.6 for Tyrese Haliburton.',
  spec: {
    intent: 'compare_players',
    players: ['Jalen Brunson', 'Tyrese Haliburton'],
    teams: [],
    season: '2024-25',
    metrics: ['PTS', 'AST'],
    last_n: null,
    top_n: null,
    per_mode: 'PerGame',
    seasons: [],
    highlight_season: null,
    highlight_note: null,
    raw_query: 'compare jalen brunson vs tyrese haliburton in 2024-25',
  },
  data: [
    { PLAYER_NAME: 'Jalen Brunson', PTS: 26.0, AST: 7.3 },
    { PLAYER_NAME: 'Tyrese Haliburton', PTS: 18.6, AST: 11.2 },
  ],
  viz_hint: {
    type: 'comparison_bars',
    title: 'Brunson vs Haliburton 2024-25',
    x_key: 'PLAYER_NAME',
    y_keys: ['PTS', 'AST'],
  },
  debug: [],
};

export const FIXTURE_TREND: QueryResponse = {
  answer_text:
    "Brunson's best scoring season was 2023-24 at 28.7 points per game, with the largest jump (+7.7) in 2022-23.",
  spec: {
    intent: 'player_career_trend',
    players: ['Jalen Brunson'],
    teams: [],
    season: '2025-26',
    metrics: ['PTS'],
    last_n: null,
    top_n: null,
    per_mode: 'PerGame',
    seasons: ['2018-19', '2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26'],
    highlight_season: '2022-23',
    highlight_note: 'largest PTS jump: +7.7 (2022-23)',
    raw_query: "what is brunson's highest points per game season of his career?",
  },
  data: [
    { SEASON: '2018-19', PTS: 7.8, TEAM_ABBREVIATION: 'DAL' },
    { SEASON: '2019-20', PTS: 11.9, TEAM_ABBREVIATION: 'DAL' },
    { SEASON: '2020-21', PTS: 12.6, TEAM_ABBREVIATION: 'DAL' },
    { SEASON: '2021-22', PTS: 16.3, TEAM_ABBREVIATION: 'DAL' },
    { SEASON: '2022-23', PTS: 24.0, TEAM_ABBREVIATION: 'NYK' },
    { SEASON: '2023-24', PTS: 28.7, TEAM_ABBREVIATION: 'NYK' },
    { SEASON: '2024-25', PTS: 26.0, TEAM_ABBREVIATION: 'NYK' },
    { SEASON: '2025-26', PTS: 26.0, TEAM_ABBREVIATION: 'NYK' },
  ],
  viz_hint: {
    type: 'trend_line',
    title: 'Jalen Brunson PTS per game by season 2018-19 to 2025-26',
    x_key: 'SEASON',
    y_keys: ['PTS'],
  },
  debug: [],
};

export const EXAMPLE_QUERIES = [
  'how many points did jalen brunson average last year',
  'jalen brunson last 5 games points',
  'compare jalen brunson vs tyrese haliburton in 2024-25',
  "what is brunson's highest points per game season of his career?",
  'what was the celtics record last season',
  'compare jayson tatum vs jaylen brown points per game throughout their careers',
  'celtics vs lakers record last season',
  'who led the nba in assists in the 2024-25 season?',
  'who were the top 10 scorers in the nba in 2024-25?',
  'how many ppg did mickey mouse average',
];

/** Two entities over time: union seasons, Brown-only 2016-17 exercises the gap UI. */
export const FIXTURE_MULTI_TREND: QueryResponse = {
  answer_text:
    'PTS trends for Jayson Tatum vs Jaylen Brown cover 2016-17 to 2024-25 (9 seasons, 2 compared).',
  spec: {
    intent: 'compare_trends',
    players: ['Jayson Tatum', 'Jaylen Brown'],
    teams: [],
    season: '2024-25',
    metrics: ['PTS'],
    last_n: null,
    top_n: null,
    per_mode: 'PerGame',
    seasons: ['2016-17', '2017-18', '2018-19', '2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25'],
    highlight_season: null,
    highlight_note: null,
    raw_query: 'compare jayson tatum vs jaylen brown points per game throughout their careers',
  },
  data: [
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2016-17', PTS: 6.6, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2017-18', PTS: 13.9, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2017-18', PTS: 14.5, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2018-19', PTS: 15.7, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2018-19', PTS: 13.0, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2019-20', PTS: 23.4, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2019-20', PTS: 20.3, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2020-21', PTS: 26.4, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2020-21', PTS: 24.7, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2021-22', PTS: 26.9, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2021-22', PTS: 23.6, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2022-23', PTS: 30.1, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2022-23', PTS: 26.6, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2023-24', PTS: 26.9, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2023-24', PTS: 23.0, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jayson Tatum', SEASON: '2024-25', PTS: 26.8, TEAM_ABBREVIATION: 'BOS' },
    { PLAYER_NAME: 'Jaylen Brown', SEASON: '2024-25', PTS: 22.2, TEAM_ABBREVIATION: 'BOS' },
  ],
  viz_hint: {
    type: 'multi_trend',
    title: 'Jayson Tatum, Jaylen Brown PTS per game by season 2016-17 to 2024-25',
    x_key: 'SEASON',
    y_keys: ['PTS'],
    series_key: 'PLAYER_NAME',
  },
  debug: [],
};

export const FIXTURE_TEAM_COMPARE: QueryResponse = {
  answer_text:
    'Boston Celtics finished 56-26 (2024-25); Los Angeles Lakers finished 47-35 (2024-25).',
  spec: {
    intent: 'compare_teams',
    players: [],
    teams: ['Boston Celtics', 'Los Angeles Lakers'],
    season: '2024-25',
    metrics: ['W', 'L', 'W_PCT'],
    last_n: null,
    top_n: null,
    per_mode: 'PerGame',
    seasons: [],
    highlight_season: null,
    highlight_note: null,
    raw_query: 'celtics vs lakers record last season',
  },
  data: [
    { TEAM_NAME: 'Boston Celtics', SEASON: '2024-25', W: 56, L: 26, W_PCT: 0.683 },
    { TEAM_NAME: 'Los Angeles Lakers', SEASON: '2024-25', W: 47, L: 35, W_PCT: 0.573 },
  ],
  viz_hint: {
    type: 'comparison_bars',
    title: 'Boston Celtics vs Los Angeles Lakers 2024-25 (W/L/W_PCT)',
    x_key: 'TEAM_NAME',
    y_keys: ['W', 'L'],
    series_key: 'TEAM_NAME',
  },
  debug: [],
};

/** Real 2024-25 AST leaders (live backend run) — backend-offline preview. */
export const FIXTURE_LEADERBOARD: QueryResponse = {
  answer_text:
    'Trae Young led the NBA in AST (11.6 per game) in 2024-25 — top 5 shown.',
  spec: {
    intent: 'league_leaders',
    players: ['Trae Young', 'Nikola Jokić', 'Tyrese Haliburton', 'Cade Cunningham', 'James Harden'],
    teams: [],
    season: '2024-25',
    metrics: ['AST'],
    last_n: null,
    top_n: 5,
    per_mode: 'PerGame',
    seasons: [],
    highlight_season: null,
    highlight_note: null,
    raw_query: 'who led the nba in assists in the 2024-25 season?',
  },
  data: [
    { RANK: 1, PLAYER_NAME: 'Trae Young', TEAM_ABBREVIATION: 'ATL', SEASON: '2024-25', GP: 76, AST: 11.6, PER_MODE: 'PerGame' },
    { RANK: 2, PLAYER_NAME: 'Nikola Jokić', TEAM_ABBREVIATION: 'DEN', SEASON: '2024-25', GP: 70, AST: 10.2, PER_MODE: 'PerGame' },
    { RANK: 3, PLAYER_NAME: 'Tyrese Haliburton', TEAM_ABBREVIATION: 'IND', SEASON: '2024-25', GP: 73, AST: 9.2, PER_MODE: 'PerGame' },
    { RANK: 4, PLAYER_NAME: 'Cade Cunningham', TEAM_ABBREVIATION: 'DET', SEASON: '2024-25', GP: 70, AST: 9.1, PER_MODE: 'PerGame' },
    { RANK: 5, PLAYER_NAME: 'James Harden', TEAM_ABBREVIATION: 'LAC', SEASON: '2024-25', GP: 79, AST: 8.7, PER_MODE: 'PerGame' },
  ],
  viz_hint: {
    type: 'leaderboard',
    title: '2024-25 NBA AST leaders (per game, top 5)',
    x_key: 'PLAYER_NAME',
    y_keys: ['AST'],
    series_key: 'PLAYER_NAME',
  },
  debug: [
    {
      tool: 'get_league_leaders',
      args: { stat_category: 'AST', season: '2024-25', top_n: 5, per_mode: 'PerGame' },
      result_summary: '5 rows',
    },
  ],
};
