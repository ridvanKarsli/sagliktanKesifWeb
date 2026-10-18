import { api } from '@/shared/api/client';
import type { Run, RunCreate } from '@/entities';

export const runsApi = {
  list: (limit = 50) => api.get<Run[]>('/runs', { limit }),
  get: (id: string) => api.get<Run>(`/runs/${id}`),
  start: (key: string, body: RunCreate) => api.post<Run>(`/diseases/${encodeURIComponent(key)}/runs`, body),
  cancel: (id: string) => api.delete<Run>(`/runs/${id}`),
  log: (key: string, tail = 300) => api.get<{ lines: string[] }>(`/diseases/${encodeURIComponent(key)}/log`, { tail }),
};
