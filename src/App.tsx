import { useCallback, useEffect, useRef, useState } from 'react';
import DebugTrace from './components/DebugTrace';
import QueryBox from './components/QueryBox';
import VizSwitch from './components/VizSwitch';
import { apiBase, checkHealth, queryNlp } from './lib/api';
import { FIXTURE_COMPARISON, FIXTURE_LEADERBOARD, FIXTURE_MULTI_TREND, FIXTURE_SINGLE_STAT, FIXTURE_TEAM_COMPARE, FIXTURE_TREND } from './lib/fixtures';
import type { ApiError, QueryResponse } from './lib/types';

type Status = 'idle' | 'loading' | 'success' | 'error';
type BackendState = 'checking' | 'up' | 'down';

function elapsedLabel(startedAt: number, now: number): string {
  return `${((now - startedAt) / 1000).toFixed(0)}s`;
}

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [backend, setBackend] = useState<BackendState>('checking');
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState<{ q: string; title: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkHealth()
      .then((ok) => {
        if (!cancelled) setBackend(ok ? 'up' : 'down');
      })
      .catch(() => {
        if (!cancelled) setBackend('down');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tick the elapsed timer while loading (latency 7–30s is normal).
  useEffect(() => {
    if (status !== 'loading') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [status]);

  const ask = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus('loading');
    setError(null);
    setStartedAt(Date.now());
    setNow(Date.now());
    try {
      const res = await queryNlp(q, { signal: ctrl.signal, timeoutMs: 60_000 });
      setResponse(res);
      setStatus('success');
      setBackend('up');
      setHistory((h) =>
        [{ q, title: res.viz_hint.title }, ...h.filter((x) => x.q !== q)].slice(0, 8),
      );
    } catch (e) {
      if ((e as ApiError)?.status === 499) {
        setStatus(response ? 'success' : 'idle'); // cancelled: keep prior result
        return;
      }
      setError(e as ApiError);
      setStatus('error');
      if ((e as ApiError)?.status === 0) setBackend('down');
    }
  }, [response]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const loadDemo = (which: 'single' | 'trend' | 'compare' | 'multi' | 'teams' | 'leaders') => {
    const r =
      which === 'trend'
        ? FIXTURE_TREND
        : which === 'compare'
          ? FIXTURE_COMPARISON
          : which === 'multi'
            ? FIXTURE_MULTI_TREND
            : which === 'teams'
              ? FIXTURE_TEAM_COMPARE
              : which === 'leaders'
                ? FIXTURE_LEADERBOARD
                : FIXTURE_SINGLE_STAT;
    setResponse(r);
    setStatus('success');
    setError(null);
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>NBA</span>
          <div>
            <div className="brand-title">NBA Hub — NLP Visualizer</div>
            <div className="brand-sub">Ask in plain English. Get charts.</div>
          </div>
        </div>
        <div className="backend" title={apiBase}>
          <span className={`dot dot-${backend}`} />
          {backend === 'up' && 'Backend live'}
          {backend === 'down' && 'Backend offline — check :8000'}
          {backend === 'checking' && 'Checking backend…'}
        </div>
      </header>

      <main className="main">
        <QueryBox
          loading={status === 'loading'}
          onSubmit={ask}
          onCancel={cancel}
        />

        {status === 'idle' && !response && (
          <section className="card empty">
            <h2>Try one of these — all live-tested on the backend</h2>
            <ul className="empty-list">
              <li>“how many points did jalen brunson average last year” → big-number card</li>
              <li>“jalen brunson last 5 games points” → game-by-game line + table</li>
              <li>“compare jalen brunson vs tyrese haliburton in 2024-25” → grouped bars</li>
              <li>“what is brunson&apos;s highest points per game season of his career?” → career trend</li>
              <li>“what was the celtics record last season” → team record card</li>
              <li>“compare tatum vs brown points per game throughout their careers” → overlaid lines</li>
              <li>“who led the nba in assists in the 2024-25 season?” → ranked leaderboard</li>
            </ul>
            <div className="demo-row">
              <span className="muted">Backend down? Preview with fixtures:</span>
              <button className="btn btn-ghost" onClick={() => loadDemo('single')}>Single stat</button>
              <button className="btn btn-ghost" onClick={() => loadDemo('trend')}>Trend + highlight</button>
              <button className="btn btn-ghost" onClick={() => loadDemo('compare')}>Comparison</button>
              <button className="btn btn-ghost" onClick={() => loadDemo('multi')}>Career compare</button>
              <button className="btn btn-ghost" onClick={() => loadDemo('teams')}>Team compare</button>
              <button className="btn btn-ghost" onClick={() => loadDemo('leaders')}>Leaderboard</button>
            </div>
          </section>
        )}

        {status === 'loading' && (
          <section className="card">
            <div className="skeleton-line w60" />
            <div className="skeleton-line w90" />
            <div className="loading-row">
              <span className="spinner" aria-hidden />
              <span>
                Fetching stats… {elapsedLabel(startedAt, now)} elapsed (NBA API
                is slow — usually 7–30s). You can Stop anytime.
              </span>
            </div>
            <div className="skeleton-chart" />
          </section>
        )}

        {status === 'error' && error && (
          <section className="card error-card" role="alert">
            <h2>Couldn&apos;t run that query</h2>
            <p>{error.message}</p>
            {error.status === 0 && (
              <div className="demo-row">
                <span className="muted">While you start the backend, preview fixtures:</span>
                <button className="btn btn-ghost" onClick={() => loadDemo('single')}>Single stat</button>
                <button className="btn btn-ghost" onClick={() => loadDemo('trend')}>Trend</button>
                <button className="btn btn-ghost" onClick={() => loadDemo('compare')}>Comparison</button>
                <button className="btn btn-ghost" onClick={() => loadDemo('multi')}>Career compare</button>
              </div>
            )}
            <code className="muted small">POST {apiBase}/api/nlp/query → HTTP {error.status}</code>
          </section>
        )}

        {response && status !== 'loading' && (
          <section className="card answer">
            <div className="answer-text">{response.answer_text}</div>
            <h2 className="viz-title">{response.viz_hint.title}</h2>
            <div className="meta-row">
              <span className="pill pill-intent">{response.spec.intent}</span>
              {response.spec.players.map((p) => (
                <span className="pill" key={p}>{p}</span>
              ))}
              {response.spec.teams.map((t) => (
                <span className="pill" key={t}>{t}</span>
              ))}
              {response.spec.season && <span className="pill">{response.spec.season}</span>}
              <span className="pill pill-mode">{response.spec.per_mode}</span>
              <span className="pill pill-type">{response.viz_hint.type}</span>
            </div>
            <VizSwitch response={response} />
            <DebugTrace response={response} />
          </section>
        )}

        {history.length > 0 && (
          <section className="history">
            <h3>Recent in this session</h3>
            <ul>
              {history.map((h) => (
                <li key={h.q}>
                  <button className="link" onClick={() => ask(h.q)}>
                    {h.title}
                  </button>
                  <span className="muted small"> — {h.q}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="footer">
        <span className="muted small">
          Frontend: Vite + React 19 + recharts · Backend: {apiBase} · Never
          renders fake stats — errors surface, never chart.
        </span>
      </footer>
    </div>
  );
}
