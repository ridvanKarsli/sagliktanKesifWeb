import { Tag } from '@/shared/ui';
import { CONFIDENCE } from '@/shared/lib/labels';
import type { ConfidenceGrade, MethodConfidence } from '@/entities';

/** Yöntem güveni etiketi: renk + kısa açıklama (ayrıntı üzerine gelince). */
export function ConfidenceBadge({ grade, reasons }: { grade?: ConfidenceGrade | null; reasons?: string[] }) {
  const g = grade || 'ölçülemedi';
  const [kind, title] = CONFIDENCE[g] || CONFIDENCE['ölçülemedi']!;
  const tip = [title, ...(reasons || [])].join('\n');
  return (
    <Tag kind={kind} title={tip}>
      Yöntem güveni: {g}
    </Tag>
  );
}

/** Hastalık sayfasında güven notunun gerekçeleri. Not yüksekse yer kaplamasın diye tek satır kalır. */
export function ConfidenceBox({ c }: { c?: MethodConfidence | null }) {
  if (!c) return null;
  const [, title] = CONFIDENCE[c.grade] || CONFIDENCE['ölçülemedi']!;
  const n = c.numbers || {};
  return (
    <div className={`confbox ${c.grade === 'düşük' ? 'low' : ''}`}>
      <div className="confbox-head">
        <ConfidenceBadge grade={c.grade} reasons={c.reasons} />
        <span>{title}</span>
        {n.lift_over_random != null && (
          <span className="sub">
            · rastgelenin {n.lift_over_random} katı{n.source ? ` (${n.source})` : ''}
          </span>
        )}
      </div>
      {c.grade !== 'yüksek' && c.reasons.length > 0 && (
        <ul>
          {c.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
