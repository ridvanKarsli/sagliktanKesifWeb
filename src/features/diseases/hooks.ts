import { useQuery } from '@tanstack/react-query';
import { diseasesApi } from './api';
import { isActiveRun } from '@/entities';

export const diseaseKeys = {
  all: ['diseases'] as const,
  detail: (key: string) => ['diseases', key] as const,
  compare: ['compare'] as const,
  settings: (key: string) => ['diseases', key, 'settings'] as const,
  results: (key: string) => ['results', key] as const,
};

export function useDiseases() {
  return useQuery({
    queryKey: diseaseKeys.all,
    queryFn: diseasesApi.list,
    refetchInterval: (q) => (q.state.data?.some((d) => isActiveRun(d.active_run)) ? 4000 : 15000),
  });
}

export function useDisease(key: string) {
  return useQuery({
    queryKey: diseaseKeys.detail(key),
    queryFn: () => diseasesApi.get(key),
    refetchInterval: (q) => (isActiveRun(q.state.data?.active_run) ? 4000 : 15000),
  });
}

export function useCompare() {
  return useQuery({ queryKey: diseaseKeys.compare, queryFn: diseasesApi.compare, staleTime: 30_000 });
}
