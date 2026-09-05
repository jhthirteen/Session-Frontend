# Session Notes — 2026-09-06: NBA Hub NLP Visualizer UI (`Session-Frontend`)

React frontend for the backend in `../Session-Backend` (`POST /api/nlp/query` →
`{answer_text, spec, data, viz_hint, debug}`). Stock Vite + React 19 + TS +
recharts scaffold; everything below was built fresh in `src/`. Run with
`npm run dev` (expects `VITE_API_URL=http://localhost:8000` in `.env.local`;
backend serves CORS for `:5173`/`:3000`).

## What we built
- `src/lib/types.ts` — exact TS mirror of the backend contract (`Intent`,
  `VizType`, `QuerySpec`, `VizHint` incl. `series_key`, `QueryResponse`).
- `src/lib/api.ts` — `checkHealth()` + `queryNlp()` (60s `AbortController`
  timeout; distinguishes 422 / 500 / network-down / timeout / cancel).
- `src/lib/format.ts` — case-insensitive game-date parse (player `"Apr 11, 2025"`
  vs team `"APR 13, 2025"`), chronological sort, PCT formatting, `per_mode`
  axis labels, purple-family series palette.
- `src/lib/pivot.ts` — long→wide pivot for comparisons: `detectSeriesKey()`
  (explicit hint, else inferred; never splits on the x-axis, so snapshots stay
  bars), `toWideRows()` (union x-domain, `null` gaps — lines break, never
  interpolate), `summarizeWide()` (avg/peak per series).
- Components, all switching on `viz_hint.type` with a table fallback for
  unknown future types: `QueryBox` (Ask/Stop + example chips), `StatCards`
  (`single_stat`, `team_stat_card`), `ComparisonBars` (generalized to any
  `x_key`), `TrendOrTimeChart` (single-series lines), **`ComparisonChart`**
  (multi-thing default: Lines/Bars/Table toggle persisted to `localStorage`,
  legend show/hide, metric selector, summary strip, gap + error notes),
  `DataTable`, `DebugTrace` (collapsible tool trace), `VizSwitch` (routes +
  auto-upgrades any multi-series payload, incl. legacy concatenated trends).
- `src/App.tsx` — backend status dot, prominent `answer_text`, spec pills,
  loading skeleton with elapsed timer (7–30s is normal), error card (never
  renders fake stats), session history, fixture previews when backend is down.
- Design (user-directed): minimal black/white chrome, light-purple
  (`#7c3aed`/`#ede9fe`) reserved for chart series + emphasis. No gradients,
  no emoji. `src/App.css` is dead stock template (unimported, harmless).

## Verification queries (backend-tested meanings)
- Brunson PPG last year → big-number card; last-5-games → line + table.
- Brunson vs Haliburton 2024-25 → grouped bars (incl. `error`-row note path).
- Brunson career peak → trend line + `highlight_season` annotation.
- Celtics record → team card; "Mickey Mouse" → clarification text, no chart.
- Tatum vs Brown career PPG → overlaid lines over union seasons with gap note.
- Celtics vs Lakers record → team compare bars.
- Fixtures for all of the above in `src/lib/fixtures.ts` (+ `FIXTURE_MULTI_TREND`
  with a real coverage gap, `FIXTURE_TEAM_COMPARE`).

## Test results (no test runner installed — verified by execution)
- `npm run build` (`tsc -b` + vite) green; `npm run lint` (oxlint) clean;
  dev server serves 200.
- Pivot logic runtime-checked by compiling `lib/` with `tsc` and asserting in
  node: 9-season union, missing-season → `null`, mixed-case date sort,
  snapshot-compare stays bars, legacy concatenated trend upgrades to chart.
- Backend suites (other repo): 58 passed, 1 skipped after the TPM fix.

## Learnings (the non-obvious stuff)
1. **The screenshot bug was a contract gap, not a chart bug.** Two concatenated
   single-entity trend payloads plotted as one line because nothing in the
   payload said "two series". Fix needed `series_key` on the contract, not
   just a smarter chart — but the chart ALSO defensively infers it, so old
   backends upgrade for free.
2. **Series == x means snapshot.** The rule "never split on the x-axis" is what
   keeps 2-player snapshots as bars while sending 2-player histories to lines.
   One predicate, no per-intent special cases.
3. **Union domain + null gaps.** Unequal careers (Brown from 2016-17, Tatum
   from 2017-18) must not interpolate — `connectNulls={false}` plus an
   explicit "N points missing" footnote.
4. **One metric at a time on multi-entity views.** Multi-metric × multi-entity
   overlays are unreadable; the selector defaults to `y_keys[0]`.
5. **Backend TPM budget shapes frontend expectations.** The 413 fix means the
   model sees slimmed rows while charts get full rows — the UI must never
   assume `answer_text` mentions every plotted point.

## Open questions / next steps
- Live end-to-end check of Tatum/Brown + Celtics/Lakers against the real
  backend (needs key + slow NBA calls).
- No dedicated backend path yet for multi-entity last-N-games overlays or
  season-vs-season ("Brunson 2023-24 vs 2024-25") — frontend auto-upgrade
  covers them if the rows arrive; backend route TBD.
- If 413s recur on huge queries: drop `MAX_ITERS` 6→4 or echo aggregates only.
- Possible polish: `single_stat` with N rows → side-by-side mini cards
  (backend never emits this today, so skipped); delete dead `src/App.css`.
