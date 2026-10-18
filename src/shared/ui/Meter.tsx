/** 5 noktalı bağlantı gücü: listedeki en yüksek puana göre. */
export function Meter({ score, max }: { score: number; max: number }) {
  const r = max ? score / max : 0;
  const n = !max ? 0 : r >= 0.6 ? 5 : r >= 0.35 ? 4 : r >= 0.2 ? 3 : r >= 0.1 ? 2 : 1;
  return (
    <span className="meter" title={`${n}/5 — bu listedeki en güçlü bağlantıya göre`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
    </span>
  );
}
