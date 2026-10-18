import { api } from '@/shared/api/client';
import type {
  Backtest,
  Bridge,
  Candidate,
  CandidateFilter,
  EvidenceLink,
  Indication,
  KnownTherapy,
  Paginated,
  TuningResult,
} from '@/entities';

const d = (key: string) => `/diseases/${encodeURIComponent(key)}`;

export const candidatesApi = {
  list: (key: string, f: Partial<CandidateFilter>) => api.get<Paginated<Candidate>>(`${d(key)}/candidates`, { ...f }),
  evidence: (key: string, cid: string) =>
    api.get<EvidenceLink[]>(`${d(key)}/candidates/${encodeURIComponent(cid)}/evidence`),
  indications: (chemblId: string) =>
    api.get<{ chembl_id: string; indications: Indication[] | null; error?: string }>(
      `/drugs/${encodeURIComponent(chemblId)}/indications`,
    ),
  known: (key: string) => api.get<KnownTherapy[]>(`${d(key)}/known`),
  bridges: (key: string) => api.get<Bridge[]>(`${d(key)}/bridges`),
  backtest: (key: string) => api.get<Backtest>(`${d(key)}/backtest`),
  tuning: (key: string) => api.get<TuningResult>(`${d(key)}/tuning`),
};
