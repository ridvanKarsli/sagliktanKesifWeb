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
  has_evidence?: boolean;
  confidence?: MethodConfidence;
  last_job?: LastJob | null;
  steps: Partial<Record<string, StepInfo>>;
  settings: Record<string, number | boolean>;
}

export type ConfidenceGrade = 'yüksek' | 'orta' | 'düşük' | 'ölçülemedi';

/** Bu hastalıkta yönteme ne kadar güvenilebileceği; geriye dönük ölçümden kural tabanlı türetilir. */
export interface MethodConfidence {
  grade: ConfidenceGrade;
  reasons: string[];
  numbers: {
    ap?: number;
    random_ap?: number;
    frequency_ap?: number | null;
    lift_over_random?: number | null;
    n_positives?: number;
    hits_at_25?: number | null;
    source?: string;
  };
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
  confidence?: ConfidenceGrade;
}

export interface CiValue {
  mean: number | null;
  lo: number | null;
  hi: number | null;
  n: number;
}

export interface ScorecardEntry {
  ap: CiValue;
  hits_at_25?: CiValue;
  vs_base?: CiValue;
  wins?: number;
  losses?: number;
}

export interface FusionDecision {
  method: 'base' | 'rrf' | 'logistic';
  verdict?: string;
  reason?: string;
  channels?: string[];
  measured_as?: string;
  origin?: string;
  weights?: { feature: string; weight: number }[];
  hold_out?: { mean_base_ap: number | null; mean_chosen_ap: number | null; confirmed: boolean };
}

export interface BenchmarkDiseaseRow {
  scheme?: string | null;
  hold_out: boolean;
  mean_base_ap?: number | null;
  mean_chosen_ap?: number | null;
  mean_random_ap?: number | null;
  mean_frequency_ap?: number | null;
}

export interface GateCheck {
  ok: boolean;
  value?: number | null;
  target?: number;
  n_checked?: number;
  n_wrong?: number;
  raw_error?: number | null;
  coverage?: number;
  pool?: number;
  audited_diseases?: number;
  method?: string;
  baselines?: Record<string, CiValue & { ok: boolean }>;
}

export interface Gate {
  passed: boolean;
  missing: string[];
  checks: {
    diseases: GateCheck;
    label_error: GateCheck;
    beats_baselines: GateCheck;
    final_confirmation?: GateCheck & { diseases?: string[]; mean?: number | null; lo?: number | null; hi?: number | null; note?: string | null };
  };
}

export interface BenchmarkResult {
  at: string;
  cutoffs: number[];
  n_groups: number;
  fit_diseases: string[];
  hold_out: string[];
  methods: string[];
  scorecard: Record<string, ScorecardEntry>;
  decision: FusionDecision;
  gate_1?: Gate;
  secondary_scheme?: string | null;
  diseases: Record<string, BenchmarkDiseaseRow>;
}

export interface BenchmarkResponse {
  benchmark: BenchmarkResult | null;
  decision: FusionDecision | null;
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
