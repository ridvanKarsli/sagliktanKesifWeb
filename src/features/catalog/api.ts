import { api } from '@/shared/api/client';
import type { CatalogBuild, CatalogList, CatalogStatus } from '@/entities';

export const catalogApi = {
  status: () => api.get<CatalogStatus>('/catalog/status'),
  build: () => api.post<CatalogBuild>('/catalog/build'),
  list: (q: string, category: string, limit = 300) => api.get<CatalogList>('/catalog/list', { q, category, limit }),
  count: (term: string, entries: string[]) =>
    api.get<{ count: number; query: string }>('/catalog/count', { term, entries: entries.join('|') }),
  resolve: (name: string) =>
    api.post<{ term: string; mesh_id: string; pubmed_query: string }[]>('/catalog/resolve', { name }),
};
