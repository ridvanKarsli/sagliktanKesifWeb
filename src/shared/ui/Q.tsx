/** Sütun başlıklarındaki "?" açıklaması. */
export function Q({ title }: { title: string }) {
  return (
    <span className="q" title={title} aria-label={title} role="img">
      ?
    </span>
  );
}
