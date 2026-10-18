import { ApiError } from './errors';
import { useAuthStore } from '@/features/auth/store';
import type { TokenPair } from '@/entities';

export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) || '/api/v1';

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  auth?: boolean;
  signal?: AbortSignal;
}

export const buildQuery = (q?: Query): string => {
  if (!q) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

let refreshing: Promise<boolean> | null = null;

/** Yenileme belirteciyle yeni erişim belirteci alır; eşzamanlı çağrılar tek isteği paylaşır. */
async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken, setSession, clear } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const r = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!r.ok) {
        clear();
        return false;
      }
      const pair = (await r.json()) as TokenPair;
      setSession(pair.access_token, pair.refresh_token, pair.user);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function parse(r: Response): Promise<unknown> {
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const { accessToken, mode } = useAuthStore.getState();
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth !== false && accessToken && mode !== 'disabled') headers.Authorization = `Bearer ${accessToken}`;
  let r: Response;
  try {
    r = await fetch(`${API_BASE}${path}${buildQuery(opts.query)}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    // ağ hatası: sunucuya ulaşılamadı (çevrimdışı, sunucu kapalı, CORS)
    throw new ApiError(0, { code: 'network_error', message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.' }, 'network');
  }
  if (r.status === 401 && !retried && opts.auth !== false && mode !== 'disabled') {
    if (await tryRefresh()) return request<T>(path, opts, true);
  }
  if (!r.ok) {
    const data = (await parse(r)) as { error?: Partial<import('./errors').ApiErrorBody> } | null;
    throw new ApiError(r.status, data?.error ?? null, r.statusText || `HTTP ${r.status}`);
  }
  return (await parse(r)) as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: 'POST', body, query }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, query?: Query) => request<T>(path, { method: 'DELETE', query }),
};

/** Dosya indirme bağlantıları (rapor, CSV): belirteç başlıkta taşınamadığı için fetch + blob. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const { accessToken, mode } = useAuthStore.getState();
  const headers: Record<string, string> = {};
  if (accessToken && mode !== 'disabled') headers.Authorization = `Bearer ${accessToken}`;
  const r = await fetch(`${API_BASE}${path}`, { headers });
  if (!r.ok) throw new ApiError(r.status, null, 'İndirilemedi');
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function openFileInTab(path: string): Promise<void> {
  const { accessToken, mode } = useAuthStore.getState();
  const headers: Record<string, string> = {};
  if (accessToken && mode !== 'disabled') headers.Authorization = `Bearer ${accessToken}`;
  const r = await fetch(`${API_BASE}${path}`, { headers });
  if (!r.ok) throw new ApiError(r.status, null, 'Açılamadı');
  const blob = await r.blob();
  window.open(URL.createObjectURL(blob), '_blank', 'noopener');
}
