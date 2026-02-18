import type { ErrorBody } from './types';

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.status = status;
    this.code = body.code;
  }
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('application/json');
}

async function safeParseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  if (isJsonResponse(res)) {
    try { return JSON.parse(text); } catch { /* ignore */ }
  }
  return text;
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setOnUnauthorized(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

async function refreshCsrfToken(): Promise<void> {
  try {
    await fetch(`${BASE}/public/ping`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    /* ignore */
  }
}

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input) return out;

  if (input instanceof Headers) {
    input.forEach((v, k) => { out[k] = v; });
    return out;
  }

  if (Array.isArray(input)) {
    for (const [k, v] of input) out[k] = v;
    return out;
  }

  return { ...(input as Record<string, string>) };
}

function removeCsrfHeader(h: Record<string, string>) {
  for (const k of Object.keys(h)) {
    if (k.toLowerCase() === 'x-xsrf-token') delete h[k];
  }
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    signal?: AbortSignal,
    _csrfRetried = false,
): Promise<T> {
  const headers = normalizeHeaders(options.headers);

  if (options.body != null && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
    throw new Error(
        `api.ts: body must be a string (JSON.stringify) or FormData, got ${typeof options.body}. ` +
        `Did you forget JSON.stringify()?`
    );
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const method = (options.method ?? 'GET').toUpperCase();

  if (typeof document === 'undefined' && method !== 'GET' && method !== 'HEAD') {
    throw new Error(
        `api.ts: state-changing request (${method} ${path}) cannot be made during SSR. ` +
        `CSRF tokens require browser cookies. Move this call to a client component or useEffect.`
    );
  }

  if (method !== 'GET' && method !== 'HEAD') {
    removeCsrfHeader(headers);

    let csrf = getCsrfToken();
    if (!csrf) {
      await refreshCsrfToken();
      csrf = getCsrfToken();
    }
    if (csrf) headers['X-XSRF-TOKEN'] = csrf;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    signal,
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' });
  }

  if (res.status === 403 && method !== 'GET' && method !== 'HEAD' && !_csrfRetried) {
    const body403 = await safeParseBody(res);
    const errObj403 = body403 && typeof body403 === 'object' ? (body403 as Record<string, unknown>) : null;
    const code403 = (errObj403?.code as string) ?? '';

    const hadTokenBefore = !!getCsrfToken();

    if (code403 === 'CSRF_INVALID' || !hadTokenBefore) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
            `[api] CSRF retry: ${method} ${path} (code=${code403}, hadToken=${hadTokenBefore})`
        );
      }

      await refreshCsrfToken();

      const nextOptions: RequestInit = {
        ...options,
        headers: normalizeHeaders(options.headers),
      };
      const nextHeaders = normalizeHeaders(nextOptions.headers);
      removeCsrfHeader(nextHeaders);
      nextOptions.headers = nextHeaders;

      return request<T>(path, nextOptions, signal, true);
    }

    throw new ApiError(403, {
      code: code403 || 'FORBIDDEN',
      message: (errObj403?.message as string) ?? '권한이 없습니다.',
    });
  }

  const body = await safeParseBody(res);

  if (!res.ok) {
    if (body && typeof body === 'object') {
      const errObj = body as Record<string, unknown>;
      const err = (errObj as any).code ? errObj : ((errObj as any).error ?? errObj);
      throw new ApiError(res.status, err as ErrorBody);
    }
    throw new ApiError(res.status, {
      code: 'SERVER_ERROR',
      message: typeof body === 'string' ? body.slice(0, 200) : `서버 오류 (${res.status})`,
    });
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
      request<T>(path, {}, signal),

  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, signal),

  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
      request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }, signal),

  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }, signal),

  del: <T>(path: string, signal?: AbortSignal) =>
      request<T>(path, { method: 'DELETE' }, signal),
};
