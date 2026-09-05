import type { ApiError, QueryResponse } from './types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000';

export const apiBase = API_BASE;

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body?.detail === 'string') message = body.detail;
    else if (Array.isArray(body?.detail))
      message = body.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join('; ');
    else if (typeof body?.message === 'string') message = body.message;
  } catch {
    try {
      const text = await res.text();
      if (text) message = text.slice(0, 300);
    } catch {
      /* ignore */
    }
  }
  return { status: res.status, message };
}

/** GET /api/nlp/health — quick backend reachability probe. */
export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/nlp/health`, { signal });
  if (!res.ok) return false;
  const body = (await res.json()) as { status?: string };
  return body.status === 'ok';
}

export interface QueryOptions {
  signal?: AbortSignal;
  model?: string;
  /** ms before we abort client-side (backend can take 7–30s; default 60s). */
  timeoutMs?: number;
}

/** POST /api/nlp/query — never returns fake data; throws ApiError on failure. */
export async function queryNlp(
  query: string,
  opts: QueryOptions = {},
): Promise<QueryResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw { status: 422, message: 'Ask an NBA question first.' } as ApiError;
  }
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Chain outer signal (e.g. user cancels) into our controller.
  const onOuterAbort = () => controller.abort();
  opts.signal?.addEventListener('abort', onOuterAbort, { once: true });

  try {
    const res = await fetch(`${API_BASE}/api/nlp/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        opts.model ? { query: trimmed, model: opts.model } : { query: trimmed },
      ),
      signal: controller.signal,
    });
    if (!res.ok) throw await parseError(res);
    return (await res.json()) as QueryResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (opts.signal?.aborted)
        throw { status: 499, message: 'Request cancelled.' } as ApiError;
      throw {
        status: 504,
        message: `Timed out after ${Math.round(timeoutMs / 1000)}s — the NBA API is slow, try again or narrow the query (e.g. fewer games).`,
      } as ApiError;
    }
    if (err instanceof TypeError) {
      // fetch network failure (backend down / CORS / wrong VITE_API_URL)
      throw {
        status: 0,
        message: `Can't reach the backend at ${API_BASE}. Is uvicorn running on :8000 with GROQ_API_KEY set?`,
      } as ApiError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onOuterAbort);
  }
}
