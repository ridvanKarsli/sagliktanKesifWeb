export const fmtDateTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';
export const fmtShort = (iso?: string | null): string => (iso ? iso.slice(0, 16).replace('T', ' ') : '');
export const fmtInt = (n?: number | null): string => (n == null ? '–' : n.toLocaleString('tr-TR'));
export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const PUBMED = (p: string) => `https://pubmed.ncbi.nlm.nih.gov/${p}/`;
export const COMPOUND = (id: string) => `https://www.ebi.ac.uk/chembl/compound_report_card/${id}/`;
