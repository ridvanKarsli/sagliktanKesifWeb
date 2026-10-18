export type AnalysisStep =
  'fetch' | 'drugs' | 'labels' | 'evidence' | 'tune' | 'rank' | 'backtest' | 'novelty' | 'report';
export type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface RunProgress {
  step?: string | null;
  message: string;
  done?: number | null;
  total?: number | null;
  completed_steps: string[];
}

export interface Run {
  id: string;
  disease_key: string;
  steps: AnalysisStep[];
  status: RunStatus;
  queue_position: number;
  progress: RunProgress;
  error?: string | null;
  summary?: Record<string, unknown> | null;
  attempts: number;
  params: Record<string, unknown>;
  options: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface RunCreate {
  steps: AnalysisStep[];
  params?: Record<string, unknown> | null;
  cutoff?: number;
  cutoff_a?: number;
  cutoff_b?: number;
  top?: number;
  start_year?: number;
  max_a?: number | null;
  per_gene?: number;
  force?: boolean;
}

export const isActiveRun = (r: Run | null | undefined): boolean =>
  !!r && (r.status === 'queued' || r.status === 'running');
