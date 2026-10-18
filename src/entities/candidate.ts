export interface Candidate {
  rank: number;
  chemical_id: string;
  chemical: string;
  chembl_id: string;
  score: number;
  lit_score: number;
  mech_score: number;
  penalty: number;
  direction: string;
  mechanism: string;
  max_phase?: number | null;
  n_direct_a: number;
  n_bridges: number;
  top_bridges: string;
  aliases: string;
  kind: string;
  status: string;
  harm_signal: string;
  durum: string;
  clinical_trials?: number | null;
  pubmed_direct?: number | null;
  extra: Record<string, unknown>;
}

export interface Paginated<T> {
  items: T[];
  page: { total: number; offset: number; limit: number };
}

export interface CandidateFilter {
  q?: string;
  kind?: string;
  show_endogenous?: boolean;
  status?: string;
  direction?: string;
  harm?: string;
  durum?: string;
  min_phase?: string;
  sort: string;
  offset: number;
  limit: number;
}

export interface EvidenceLink {
  source: 'chembl' | 'literature' | string;
  gene: string;
  species?: string;
  specificity?: number | null;
  gene_direction?: string;
  gene_direction_source?: string;
  consistency?: string;
  contribution: number;
  action_type?: string;
  moa?: string;
  n_ab?: number;
  n_bc?: number;
  lift?: number;
  drug_effect?: string;
  relations?: Record<string, number>;
  context_fraction?: number | null;
  ab_pmids?: string[];
  bc_pmids?: string[];
}

export interface Indication {
  term: string;
  phase: number;
}

export interface KnownTherapy {
  rank: number;
  chemical: string;
  chembl_id?: string;
  max_phase?: number | null;
  n_treat_rel: number;
  n_therapy_articles?: number;
  n_harm_rel: number;
  harm_signal: string;
  first_year?: number;
  last_year?: number;
}

export interface Bridge {
  gene_id: string;
  label: string;
  symbol: string;
  n_articles: number;
  source: string;
  species: string;
  specificity?: number | null;
  used: boolean;
  has_literature: boolean;
  n_literature: number;
}

export interface BacktestMetric {
  auc: number;
  hits_at_10: number;
  hits_at_25: number;
  hits_at_50: number;
}
export interface BacktestScheme {
  n_universe: number;
  n_positives: number;
  note?: string;
  positives_all?: string[];
  random_expected_hits?: { at_10: number; at_25: number; at_50: number };
  metrics?: Record<string, BacktestMetric>;
  positives?: { drug: string; method_rank?: number | null; frequency_rank: number }[];
}
export interface Backtest {
  cutoff_year?: number;
  n_a_before?: number;
  n_a_after?: number;
  primary_scheme?: string;
  schemes?: Record<string, BacktestScheme>;
}

export interface TuningResult {
  at?: string;
  cutoff_a?: number;
  cutoff_b?: number;
  best_params?: Record<string, unknown>;
  best_on_a?: { params: Record<string, unknown>; objective: number };
  validation_on_b?: { validated: boolean; best_summary?: TuneSummary; base_summary?: TuneSummary };
  verdict?: string;
  applied?: boolean;
}
export interface TuneSummary {
  trials?: { hits_at_10: number; auc: number };
  trials_novel?: { hits_at_50: number; auc: number };
}
