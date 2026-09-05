# Session-Frontend Handoff — NBA-Hub NLP Visualizer UI

> Write this file for a fresh opencode session opened in this repo
> (`Session-Frontend`). It has everything the new session needs: what the
> backend already does, the exact API contract, and what to build.

## 1. State of the world

- **Backend repo** (`../Session-Backend`, Python/FastAPI) is DONE and live-tested.
  It exposes one thing you care about: `POST /api/nlp/query` which takes a
  natural-language question and returns chart-ready JSON. You do NOT need to
  touch the backend for V1 of the UI (one optional tweak is noted in §6).
- **This repo** is a fresh Vite + React 19 + TypeScript + recharts scaffold
  (`npm create vite@latest . -- --template react-ts`, plus `npm install recharts`).
  Nothing custom has been built yet — `src/` is stock Vite template.
- Backend and frontend are separate repos by design, connected over HTTP + CORS.

## 2. How to run both sides locally

Terminal 1 — backend (from `../Session-Backend`):
```bash
.venv/bin/uvicorn src.data_tooling.api:app --reload --port 8000
# needs GROQ_API_KEY in env (already configured in that shell before)
```

Terminal 2 — frontend (here):
```bash
npm run dev   # Vite default http://localhost:5173
```

Backend CORS already allows `http://localhost:5173` and `http://localhost:3000`
(see `frontend_origins()` in `../Session-Backend/src/data_tooling/api.py`,
overridable via `FRONTEND_ORIGINS` env var, comma-separated — that is the
one-var change needed at deploy time).

Create `.env.local` here (Vite convention, new session: create this file):
```
VITE_API_URL=http://localhost:8000
```

## 3. The API contract (exact — mirror these as TS types)

### Endpoints
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/nlp/health` | — | `{"status": "ok"}` |
| POST | `/api/nlp/query` | `{query: string, model?: string}` (query 1–2000 chars) | `QueryResponse` (below) |

Errors: `422` empty/missing query; `500` backend failure (never fake data —
surface the error state in UI, do not render charts on error).

### `QueryResponse` (backend: `src/data_tooling/models.py`)
```ts
type Intent =
  | "player_season_avg" | "player_game_logs"
  | "team_stats" | "team_game_logs"
  | "compare_players"
  | "player_career_trend" | "team_history_trend"
  | "needs_clarification";

type VizType =
  | "single_stat" | "comparison_bars" | "time_series"
  | "game_log_table" | "team_stat_card" | "trend_line";

type MetricKey =
  | "PTS" | "AST" | "REB" | "STL" | "BLK" | "MIN"
  | "FG_PCT" | "FG3M" | "FG3_PCT" | "FT_PCT"
  | "W" | "L" | "W_PCT";

interface QuerySpec {
  intent: Intent;
  players: string[];            // canonical "First Last"
  teams: string[];              // canonical "Boston Celtics"
  season: string | null;        // "YYYY-YY", most-recent for trends
  metrics: MetricKey[];
  last_n: number | null;        // game-log window
  per_mode: "PerGame" | "Totals"; // trend flavor — use for axis labels
  seasons: string[];            // trend coverage, chronological
  highlight_season: string | null;  // most-improved queries only
  highlight_note: string | null;    // e.g. "largest PTS jump: +7.7 (2022-23)"
  raw_query: string | null;
}

interface VizHint {
  type: VizType;
  title: string;                // pre-built display title — just render it
  x_key: string | null;         // "GAME_DATE" (time_series) or "SEASON" (trend_line)
  y_keys: string[];             // metric keys to plot
}

interface ToolCallTrace { tool: string; args: Record<string, unknown>; result_summary: string | null; }

interface QueryResponse {
  answer_text: string;          // 1–2 sentence answer — always show prominently
  spec: QuerySpec;
  data: Record<string, number | string | null>[];  // chart rows
  viz_hint: VizHint;            // SWITCH ON THIS to pick the component
  debug: ToolCallTrace[];       // collapsible "how I got this" trace (nice touch)
}
```

### `viz_hint.type` → component map (the core rendering rule)
| `type` | When | Render | Keys |
|---|---|---|---|
| `single_stat` | one player, one season | big number card(s) | `y_keys` from `data[0]` |
| `comparison_bars` | 2+ players side-by-side | grouped bar chart | x=`PLAYER_NAME`, bars=`y_keys` |
| `time_series` | last-N games | line chart | x=`GAME_DATE` (parse "Apr 11, 2025" / team logs use "APR 13, 2025" — case-insensitive parse!), y=`y_keys` |
| `trend_line` | season-by-season history | line chart | x=`SEASON` ("YYYY-YY"), y=`y_keys`; label axis per-game vs totals via `spec.per_mode` |
| `team_stat_card` | team season | record card (W-L, W_PCT + specs) | `W`, `L`, `W_PCT` |
| `game_log_table` | fallback table | plain table of `data` | all keys |

### Real example payloads (from live backend runs — use as fixtures/mocks)
Single stat — "how many points did jalen brunson average last year":
```json
{
  "answer_text": "Jalen Brunson averaged 26.0 points per game in the 2025-26 regular season.",
  "spec": {"intent": "player_season_avg", "players": ["Jalen Brunson"], "teams": [], "season": "2025-26", "metrics": ["PTS"], "last_n": null, "per_mode": "PerGame", "seasons": [], "highlight_season": null, "highlight_note": null},
  "data": [{"PLAYER_NAME": "Jalen Brunson", "SEASON": "2025-26", "GP": 74, "PTS": 26.0, "AST": 6.8, "TEAM_ABBREVIATION": "NYK"}],
  "viz_hint": {"type": "single_stat", "title": "Jalen Brunson PTS 2025-26", "x_key": null, "y_keys": ["PTS"]}
}
```
Trend — "what is brunson's highest points per game season of his career?" (8 rows, `trend_line`, x=`SEASON`):
```json
{
  "spec": {"intent": "player_career_trend", "season": "2025-26", "per_mode": "PerGame", "seasons": ["2018-19", "…", "2025-26"]},
  "data": [{"SEASON": "2023-24", "PTS": 28.7, "TEAM_ABBREVIATION": "NYK"}, "..."],
  "viz_hint": {"type": "trend_line", "title": "Jalen Brunson PTS per game by season 2018-19 to 2025-26", "x_key": "SEASON", "y_keys": ["PTS"]}
}
```
Improvement — same trend payload PLUS `highlight_season: "2022-23"`, `highlight_note: "largest PTS jump: +7.7 (2022-23)"` → render the full line and annotate that point (dot/badge), do not filter.

## 4. Gotchas the backend team already learned (don't rediscover these)
1. **Game-log dates are inconsistent strings**: player logs `"Apr 11, 2025"`, team logs `"APR 13, 2025"`. Parse case-insensitively; sort chronologically client-side before charting (API returns most-recent-first).
2. **`needs_clarification` intent** (`data: []`, e.g. unknown "Mickey Mouse" or ambiguous names): render `answer_text` as a clarification prompt, NOT an empty chart.
3. **Compare rows can carry `"error"`** (e.g. Haliburton missed 2025-26 injured): row looks like `{"PLAYER_NAME": "…", "error": "No stats …"}` — render the available bars + a "missing" note, don't crash on absent metrics.
4. **Trend x-axis is `"SEASON"` for BOTH players and teams** (backend unifies `SEASON_ID`/`YEAR` into `SEASON`) — one line-chart path works for both.
5. **Latency is 7–30s per query** (NBA API is slow; Groq adds ~7s). Loading skeleton + "fetching stats…" state is mandatory, not polish. Consider `AbortController` + request timeout UI (~60s).
6. **Numbers come as JSON numbers** (backend normalizes numpy) — safe to pass straight to recharts.
7. Team stat keys: `W`/`L`/`W_PCT` (backend aliases `WINS`/`LOSSES`/`WIN_PCT` already).

## 5. What the new session should build (suggested order)
1. `src/lib/api.ts` — typed client: `queryNlp(query): Promise<QueryResponse>` reading `import.meta.env.VITE_API_URL`, plus the `Intent`/`VizType`/`QueryResponse` types above. Test against `/health` first.
2. `src/components/QueryBox.tsx` — input + submit + loading/error/empty states. Show `answer_text` prominently on success.
3. `src/components/VizSwitch.tsx` — switch on `viz_hint.type` → per-type components below. Unknown future types → fall back to a raw table (forward-compatible).
4. `StatCard` (`single_stat`, `team_stat_card`), `ComparisonBars` + `TrendLine` (recharts `LineChart`), `GameLogChart` (`time_series`), `DataTable` (`game_log_table`/fallback).
5. `DebugTrace` — collapsible `<details>` rendering `debug[]` tool calls (backend provides these free; great for trust).
6. Polish: `highlight_season` annotation on `TrendLine`, per-game/totals axis label from `spec.per_mode`, empty/error states, mobile sanity.
7. Verification queries (all live-tested on backend, expected answers):
   - "how many points did jalen brunson average last year" → 26.0 PPG single_stat
   - "jalen brunson last 5 games points" → time_series, 5 rows
   - "compare jalen brunson vs tyrese haliburton in 2024-25" → 26.0 vs 18.6 comparison_bars
   - "what is brunson's highest points per game season of his career?" → trend_line, peak 2023-24 28.7
   - "what was the celtics record last season" → team_stat_card 56-26
   - "how many ppg did mickey mouse average" → clarification text, no chart

## 6. Backend reference (do not modify unless asked)
- Contract source of truth: `../Session-Backend/src/data_tooling/models.py`
- Endpoint + CORS: `../Session-Backend/src/data_tooling/api.py`
- Scope/gaps log: `../Session-Backend/src/data_tooling/V1_SCOPE_AND_GAPS.txt`
- Full backend build history: `../Session-Backend/open_code_sessions/2026-09-05-nlp-visualizer/session_notes.md`
- Standing backend rules (for context): no `pip install` without owner approval; lazy `nba_api` imports.
- Optional backend tweak if the UI wants it later (not needed for V1): none blocking. If recharts wants numeric timestamps, convert date/season strings client-side — no backend change required.
