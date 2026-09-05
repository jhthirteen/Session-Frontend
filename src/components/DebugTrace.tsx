import type { QueryResponse } from '../lib/types';

export default function DebugTrace({ response }: { response: QueryResponse }) {
  if (response.debug.length === 0) return null;
  return (
    <details className="debug">
      <summary>
        How I got this · {response.debug.length} tool call
        {response.debug.length === 1 ? '' : 's'}
      </summary>
      <ol>
        {response.debug.map((t, i) => (
          <li key={i}>
            <code>{t.tool}</code>{' '}
            <span className="muted">{JSON.stringify(t.args)}</span>
            {t.result_summary && <div>→ {t.result_summary}</div>}
          </li>
        ))}
      </ol>
    </details>
  );
}
