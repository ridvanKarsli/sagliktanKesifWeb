import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { candidatesApi } from './api';
import { diseaseKeys } from '@/features/diseases/hooks';
import type { CandidateFilter } from '@/entities';

export function useCandidates(key: string, f: Partial<CandidateFilter>, enabled = true) {
  return useQuery({
    queryKey: [...diseaseKeys.results(key), 'candidates', f],
    queryFn: () => candidatesApi.list(key, f),
    placeholderData: keepPreviousData,
    enabled,
  });
}
export const useEvidence = (key: string, cid: string | null) =>
  useQuery({
    queryKey: [...diseaseKeys.results(key), 'evidence', cid],
    queryFn: () => candidatesApi.evidence(key, cid!),
    enabled: !!cid,
  });
export const useIndications = (chemblId: string | null) =>
  useQuery({
    queryKey: ['indications', chemblId],
    queryFn: () => candidatesApi.indications(chemblId!),
    enabled: !!chemblId,
    staleTime: Infinity,
  });
export const useKnown = (key: string) =>
  useQuery({ queryKey: [...diseaseKeys.results(key), 'known'], queryFn: () => candidatesApi.known(key) });
export const useBridges = (key: string) =>
  useQuery({ queryKey: [...diseaseKeys.results(key), 'bridges'], queryFn: () => candidatesApi.bridges(key) });
export const useBacktest = (key: string) =>
  useQuery({ queryKey: [...diseaseKeys.results(key), 'backtest'], queryFn: () => candidatesApi.backtest(key) });
export const useTuning = (key: string) =>
  useQuery({ queryKey: [...diseaseKeys.results(key), 'tuning'], queryFn: () => candidatesApi.tuning(key) });
