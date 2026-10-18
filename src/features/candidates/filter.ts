export interface UiFilter {
  q: string;
  status: string;
  direction: string;
  harm: string;
  kind: string;
  durum: string;
  phase: string;
  sort: string;
}
export const DEFAULT_FILTER: UiFilter = {
  q: '',
  status: '',
  direction: '',
  harm: '',
  kind: '',
  durum: '',
  phase: '',
  sort: 'score',
};
