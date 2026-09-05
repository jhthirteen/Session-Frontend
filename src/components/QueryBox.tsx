import { useState } from 'react';
import { EXAMPLE_QUERIES } from '../lib/fixtures';

interface Props {
  loading: boolean;
  initialValue?: string;
  onSubmit: (query: string) => void;
  onCancel: () => void;
}

export default function QueryBox({ loading, initialValue = '', onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initialValue);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="querybox">
      <form
        className="querybox-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <input
          className="querybox-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Ask anything… e.g. "compare brunson vs haliburton in 2024-25"'
          maxLength={2000}
          disabled={loading}
          aria-label="NBA question"
        />
        {loading ? (
          <button type="button" className="btn btn-stop" onClick={onCancel}>
            Stop
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
            Ask
          </button>
        )}
      </form>
      <div className="chips">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            className="chip"
            disabled={loading}
            onClick={() => {
              setValue(q);
              submit(q);
            }}
            title={q}
          >
            {q.length > 42 ? q.slice(0, 42) + '…' : q}
          </button>
        ))}
      </div>
    </div>
  );
}
