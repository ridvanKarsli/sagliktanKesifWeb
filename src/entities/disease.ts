import type { Run } from './run';

export interface StepInfo {
  at?: string;
  n_candidates?: number;
  n_articles?: number;
  n_bridges?: number;
  [k: string]: unknown;
}

export interface LastJob {
  status: string;
  steps?: string[];
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

/** Motorun dosya tabanlı durum özeti (DiseaseDetailOut.status). */
export interface DiseaseStatus {
  disease: string;
  has_corpus: boolean;
  n_articles: number;
  n_bridges: number;
  fetched_at?: string | null;
  has_drugs: boolean;
  has_labels: boolean;
  has_candidates: boolean;
  has_novelty: boolean;
  has_backtest: boolean;
  has_report: boolean;
  has_discovery: boolean;
  last_job?: LastJob | null;
  steps: Partial<Record<string, StepInfo>>;
  settings: Record<string, number | boolean>;
}

export interface Disease {
  key: string;
  label: string;
  name_en: string;
  mesh_id: string;
  pubmed_query: string;
  is_default: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DiseaseDetail extends Disease {
  status: DiseaseStatus;
  active_run?: Run | null;
  n_candidates: number;
}

export interface DiseaseCreate {
  name_en: string;
  key?: string | null;
  label?: string | null;
  mesh_id?: string;
  mesh_term?: string;
  pubmed_query?: string;
}

export interface Estimate {
  pubmed_total: number;
  will_download: number;
  sampled: boolean;
  estimated_minutes: number;
  small: boolean;
}

export interface CompareRow {
  key: string;
  label: string;
  n_candidates?: number | null;
  top3?: string[];
  n_new_checked?: number | null;
  n_new_with_trials?: number | null;
  enrichment?: number | null;
  trials_at_10?: string | null;
  top_classes?: string[];
}

export interface ServiceCheck {
  key: string;
  name: string;
  ok: boolean;
  ms: number;
  detail: string;
}

export interface Settings {
  params: Record<string, number | boolean>;
  defaults: Record<string, number | boolean>;
}
