import { api } from '@/shared/api/client';
import type { CompareRow, Disease, DiseaseCreate, DiseaseDetail, Estimate, ServiceCheck, Settings } from '@/entities';

export const diseasesApi = {
  list: () => api.get<DiseaseDetail[]>('/diseases'),
  get: (key: string) => api.get<DiseaseDetail>(`/diseases/${encodeURIComponent(key)}`),
  create: (body: DiseaseCreate) => api.post<Disease>('/diseases', body),
  remove: (key: string, purge: boolean) =>
    api.delete<{ removed: string; purged: string[] }>(`/diseases/${encodeURIComponent(key)}`, { purge }),
  estimate: (key: string) => api.get<Estimate>(`/diseases/${encodeURIComponent(key)}/estimate`),
  compare: () => api.get<CompareRow[]>('/compare'),
  services: () => api.get<{ ok: boolean; checks: ServiceCheck[] }>('/health/services'),
  settings: (key: string) => api.get<Settings>(`/diseases/${encodeURIComponent(key)}/settings`),
  rerank: (key: string, params: Record<string, unknown>, cutoff: number | null) =>
    api.post<{ n_candidates: number; backtest?: unknown; imported: { candidates: number; artifacts: number } }>(
      `/diseases/${encodeURIComponent(key)}/rerank`,
      { params, cutoff },
    ),
};
