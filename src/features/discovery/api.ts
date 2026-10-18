import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { DiscoverySummary } from '@/entities';
import { diseaseKeys } from '@/features/diseases/hooks';

export const discoveryApi = {
  get: (key: string) => api.get<DiscoverySummary>(`/diseases/${encodeURIComponent(key)}/discovery`),
};
export const useDiscovery = (key: string, enabled = true) =>
  useQuery({ queryKey: [...diseaseKeys.results(key), 'discovery'], queryFn: () => discoveryApi.get(key), enabled });
