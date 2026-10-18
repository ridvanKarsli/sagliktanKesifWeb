import { useState } from 'react';
import { useCancelRun, useRunLog } from './hooks';
import { useCan } from '@/features/auth/useSession';
import { STEP_NAME, stepIndex } from '@/shared/lib/labels';
import { Button, Spinner, useToast } from '@/shared/ui';
import { errorMessage } from '@/shared/api/errors';
import type { Run } from '@/entities';

/** Analiz kutusu: insan dilinde ilerleme, adım çipleri, isteğe bağlı ayrıntılı günlük. */
export function JobBox({ run, diseaseKey }: { run: Run; diseaseKey: string }) {
  const [showLog, setShowLog] = useState(false);
  const log = useRunLog(diseaseKey, showLog);
  const cancel = useCancelRun();
  const canAnalyst = useCan('analyst');
  const { toast } = useToast();
  const order = [...run.steps].sort((a, b) => stepIndex(a) - stepIndex(b));
  const completed = new Set(run.progress.completed_steps || []);
  const current = run.status === 'running' ? run.progress.step : null;
  const titles: Record<string, string> = {
    running: `Analiz çalışıyor: ${order.map((s) => STEP_NAME[s] || s).join(', ')}`,
    done: 'Analiz tamamlandı',
    failed: 'Analiz durdu',
    queued: `Sırada (${run.queue_position}. sırada)`,
    cancelled: 'Sıradan çıkarıldı',
  };
  const sub =
    run.status === 'running'
      ? `${run.progress.message || 'Başlıyor'}${run.progress.done != null && run.progress.total ? ` (${run.progress.done.toLocaleString('tr-TR')} / ${run.progress.total.toLocaleString('tr-TR')})` : ''}`
      : run.status === 'failed'
        ? `Bir adım tamamlanamadı: ${run.error || ''}. 'Analizi güncelle' ile yeniden deneyebilirsiniz.`
        : run.status === 'queued'
          ? 'Önündeki işler bitince başlar; sekmeyi kapatabilirsiniz.'
          : run.status === 'done'
            ? 'Sonuçlar yenilendi.'
            : '';
  const pct =
    run.progress.done != null && run.progress.total
      ? Math.min(100, Math.round((run.progress.done / run.progress.total) * 100))
      : null;
  return (
    <div className={`jobbox ${run.status}`}>
      <div className="jobbox-head">
        <div>
          <div className="jobbox-title">{titles[run.status] || run.status}</div>
          <div className="jobbox-sub">{sub}</div>
        </div>
        <div className="row">
          {run.status === 'queued' && canAnalyst && (
            <Button
              variant="secondary"
              onClick={() => cancel.mutate(run.id, { onError: (e) => toast(errorMessage(e), { bad: true }) })}
              disabled={cancel.isPending}
            >
              Sıradan çıkar
            </Button>
          )}
          {run.status === 'running' && <Spinner />}
        </div>
      </div>
      <div className="job-steps">
        {order.map((st) => {
          const done = run.status === 'done' || completed.has(st);
          const cur = st === current && run.status === 'running';
          return (
            <span key={st} className={`jstep ${done ? 'done' : cur ? 'cur' : 'todo'}`}>
              {done ? '✓ ' : cur ? '● ' : ''}
              {STEP_NAME[st] || st}
            </span>
          );
        })}
      </div>
      {pct != null && run.status === 'running' && (
        <div className="pbar">
          <i style={{ width: `${pct}%` }} />
        </div>
      )}
      <details
        className="jobbox-details"
        open={showLog}
        onToggle={(e) => setShowLog((e.target as HTMLDetailsElement).open)}
      >
        <summary>Ayrıntılı günlük</summary>
        <pre className="joblog">{log.data?.lines.join('\n') || (log.isLoading ? 'yükleniyor…' : '')}</pre>
      </details>
    </div>
  );
}
