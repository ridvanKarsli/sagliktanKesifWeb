import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { runsApi } from './api';
import { isActiveRun, type Run, type RunCreate } from '@/entities';
import { useToast } from '@/shared/ui';
import { diseaseKeys } from '@/features/diseases/hooks';

export const runKeys = { all: ['runs'] as const, log: (key: string) => ['runs', 'log', key] as const };

/** Tüm işleri izler; bir iş bitince ilgili sorguları yeniler ve bildirim gösterir. Sayfa yenilemeye gerek yok. */
export function useLiveRuns(labelOf?: (key: string) => string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const prev = useRef<Map<string, string> | null>(null);
  const q = useQuery({
    queryKey: runKeys.all,
    queryFn: () => runsApi.list(50),
    refetchInterval: (query) => (query.state.data?.some(isActiveRun) ? 4000 : 15000),
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const runs = q.data;
    if (!runs) return;
    const cur = new Map(runs.map((r) => [r.id, r.status]));
    if (prev.current) {
      const changed = runs.filter((r) => prev.current!.get(r.id) !== r.status);
      if (changed.length) {
        qc.invalidateQueries({ queryKey: diseaseKeys.all });
        for (const r of changed) {
          qc.invalidateQueries({ queryKey: diseaseKeys.detail(r.disease_key) });
          if (r.status === 'done' || r.status === 'failed') {
            qc.invalidateQueries({ queryKey: diseaseKeys.results(r.disease_key) });
            qc.invalidateQueries({ queryKey: diseaseKeys.compare });
            toast(
              `${labelOf?.(r.disease_key) || r.disease_key}: analiz ${r.status === 'done' ? 'tamamlandı' : 'durdu'}`,
              { bad: r.status === 'failed' },
            );
          }
        }
      }
    }
    prev.current = cur;
  }, [q.data, qc, toast, labelOf]);
  return q;
}

export function useActiveRunFor(key: string, runs?: Run[]): Run | undefined {
  return runs?.find((r) => r.disease_key === key && isActiveRun(r));
}

export function useStartRun(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RunCreate) => runsApi.start(key, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: runKeys.all });
      qc.invalidateQueries({ queryKey: diseaseKeys.detail(key) });
      qc.invalidateQueries({ queryKey: diseaseKeys.all });
    },
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: runKeys.all }),
  });
}

export function useRunLog(key: string, enabled: boolean) {
  return useQuery({
    queryKey: runKeys.log(key),
    queryFn: () => runsApi.log(key, 300),
    enabled,
    refetchInterval: enabled ? 4000 : false,
  });
}
