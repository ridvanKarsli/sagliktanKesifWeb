export interface DiscoveryCandidate {
  rank: number;
  chemical: string;
  chembl_id?: string;
  max_phase?: number | null;
  clinical_trials?: number | null;
  pubmed_direct?: number | null;
  direction: string;
  genes?: string[];
  mechanism?: string;
  genetic_target?: string;
  network_target?: string;
  similar_from?: string;
  stopped_trials?: string;
  p_trial_5y?: number | null;
  justification: string;
}

export interface DiscoverySummary {
  built_at?: string;
  n_new?: number;
  n_new_checked?: number;
  n_new_with_trials?: number;
  n_untested?: number | null;
  enrichment?: number | null;
  base_rate?: number | null;
  backtest?: { trials?: { method_at_10: number; frequency_at_10: number } };
  verdict?: string;
  target_classes?: { gene: string; n: number; drugs: string[] }[];
  new_candidates?: DiscoveryCandidate[];
  confidence?: import('./disease').MethodConfidence;
  fusion?: string;
}
