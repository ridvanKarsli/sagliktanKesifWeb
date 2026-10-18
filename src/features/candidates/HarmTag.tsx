import { HARM } from '@/shared/lib/labels';
import { Tag } from '@/shared/ui';

interface HarmRow {
  harm_signal: string;
  n_harm_rel?: number | null;
  n_treat_rel?: number | null;
}

export function HarmTag({ row }: { row: HarmRow }) {
  const [cls, title] = HARM[row.harm_signal] || HARM.yok!;
  const n = (row.n_harm_rel || 0) + (row.n_treat_rel || 0);
  return (
    <>
      <Tag kind={cls} title={title}>
        {row.harm_signal === 'yok' || !row.harm_signal ? '–' : row.harm_signal}
      </Tag>
      {n > 0 && (
        <div className="sub">
          tedavi {row.n_treat_rel || 0} · tetikleme {row.n_harm_rel || 0}
        </div>
      )}
    </>
  );
}
