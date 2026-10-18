export interface CatalogBuild {
  status: 'idle' | 'running' | 'done' | 'failed' | string;
  stage?: string;
  error?: string | null;
  started_at?: string | null;
}
export interface CatalogStatus {
  ready: boolean;
  n?: number;
  build?: CatalogBuild;
}
export interface CatalogItem {
  term: string;
  mesh_id: string;
  entries: string[];
  categories: string[];
  pubmed_query: string;
  added_key?: string | null;
}
export interface CatalogList {
  items: CatalogItem[];
  total: number;
  categories: { code: string; name: string; n: number }[];
}
