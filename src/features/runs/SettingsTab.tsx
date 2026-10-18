import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStartRun } from './hooks';
import { diseasesApi } from '@/features/diseases/api';
import { diseaseKeys } from '@/features/diseases/hooks';
import { useTuning } from '@/features/candidates/hooks';
import { useCan } from '@/features/auth/useSession';
import { Button } from '@/shared/ui';
import { PARAM_META, PNAME, STEPS } from '@/shared/lib/labels';
import { fmtShort } from '@/shared/lib/format';
import { errorMessage } from '@/shared/api/errors';
import type { AnalysisStep, DiseaseDetail, Run, TuneSummary } from '@/entities';

type Params = Record<string, number | boolean>;

export function SettingsTab({ d, activeRun }: { d: DiseaseDetail; activeRun?: Run }) {
  const can = useCan('analyst');
  return (
    <div className="panel">
      <div className="settings">
        <ParamsCard d={d} can={can} />
        <StepsCard d={d} can={can} busy={!!activeRun} />
        <TuneCard d={d} can={can} busy={!!activeRun} />
      </div>
    </div>
  );
}

function ParamsCard({ d, can }: { d: DiseaseDetail; can: boolean }) {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: diseaseKeys.settings(d.key), queryFn: () => diseasesApi.settings(d.key) });
  const [form, setForm] = useState<Params>({});
  const [bt, setBt] = useState(true);
  const [cutoff, setCutoff] = useState(2018);
  const [hint, setHint] = useState<{ text: string; err?: boolean }>({ text: '' });
  useEffect(() => {
    if (settings.data) setForm(settings.data.params);
  }, [settings.data]);
  const rerank = useMutation({
    mutationFn: () => diseasesApi.rerank(d.key, form, bt ? cutoff : null),
    onMutate: () => setHint({ text: 'Yeniden sıralanıyor…' }),
    onSuccess: (r) => {
      setHint({
        text: `${r.n_candidates} aday sıralandı${r.backtest ? ', güvenilirlik testi yenilendi' : ''}. Ayarlar kaydedildi.`,
      });
      qc.invalidateQueries({ queryKey: diseaseKeys.results(d.key) });
      qc.invalidateQueries({ queryKey: diseaseKeys.detail(d.key) });
      qc.invalidateQueries({ queryKey: diseaseKeys.settings(d.key) });
    },
    onError: (e) => setHint({ text: errorMessage(e), err: true }),
  });
  const defaults = settings.data?.defaults || {};
  const submit = (e: FormEvent) => {
    e.preventDefault();
    rerank.mutate();
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>Sıralama ayarları</h2>
      <p className="hint">
        Değişiklikler yalnızca bu hastalık için kaydedilir. Yeniden sıralama saniyeler sürer, veri indirmez.
      </p>
      <div className="fields">
        {Object.entries(PARAM_META).map(([k, [name, help]]) => {
          const dv = defaults[k];
          const isBool = typeof dv === 'boolean';
          const v = form[k];
          return (
            <label key={k} className="field">
              <span>
                {name}{' '}
                <small>
                  {help}
                  {help ? ' · ' : ''}varsayılan {isBool ? (dv ? 'açık' : 'kapalı') : String(dv ?? '')}
                </small>
              </span>
              {isBool ? (
                <select
                  value={v ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value === 'true' })}
                  disabled={!can}
                >
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              ) : (
                <input
                  type="number"
                  step={Number.isInteger(dv) ? 1 : 0.1}
                  value={v === undefined ? '' : String(v)}
                  onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
                  disabled={!can}
                />
              )}
            </label>
          );
        })}
      </div>
      {can && (
        <div className="row">
          <Button variant="primary" type="submit" disabled={rerank.isPending}>
            Kaydet ve yeniden sırala
          </Button>
          <Button variant="secondary" onClick={() => setForm({ ...defaults })}>
            Varsayılanlara dön
          </Button>
          <label className="toggle">
            <input type="checkbox" checked={bt} onChange={(e) => setBt(e.target.checked)} />
            <span>
              Güvenilirlik testini de yenile (kesit{' '}
              <input
                type="number"
                className="inline"
                value={cutoff}
                onChange={(e) => setCutoff(Number(e.target.value))}
              />
              )
            </span>
          </label>
        </div>
      )}
      <div className={`hint ${hint.err ? 'err' : ''}`}>{hint.text}</div>
    </form>
  );
}

function StepsCard({ d, can, busy }: { d: DiseaseDetail; can: boolean; busy: boolean }) {
  const done = d.status.steps || {};
  const [sel, setSel] = useState<Set<AnalysisStep>>(() => new Set(STEPS.filter((s) => !done[s.key]).map((s) => s.key)));
  const [adv, setAdv] = useState({
    cutoff: 2018,
    top: 100,
    start_year: 1990,
    per_gene: 300,
    max_a: 25000,
    force: false,
  });
  const [hint, setHint] = useState<{ text: string; err?: boolean }>({ text: '' });
  const start = useStartRun(d.key);
  const toggle = (k: AnalysisStep) => {
    const n = new Set(sel);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    setSel(n);
  };
  const run = () => {
    if (sel.size === 0) return setHint({ text: 'En az bir adım seçin.', err: true });
    start.mutate(
      {
        steps: [...sel],
        cutoff: adv.cutoff,
        top: adv.top,
        start_year: adv.start_year,
        per_gene: adv.per_gene,
        max_a: adv.max_a > 0 ? adv.max_a : null,
        force: adv.force,
      },
      {
        onSuccess: () => setHint({ text: 'Sıraya alındı.' }),
        onError: (e) => setHint({ text: errorMessage(e), err: true }),
      },
    );
  };
  const n = (k: keyof typeof adv) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAdv({ ...adv, [k]: Number(e.target.value) });
  return (
    <div className="card">
      <h2>Analiz adımları</h2>
      <p className="hint">
        "Analizi başlat" bu adımların tümünü sırayla çalıştırır. Gerekirse yalnızca bazılarını seçip
        çalıştırabilirsiniz.
      </p>
      <div className="steps">
        {STEPS.map((s) => (
          <label key={s.key} className={sel.has(s.key) ? 'on' : ''} title={s.sub}>
            <input type="checkbox" checked={sel.has(s.key)} onChange={() => toggle(s.key)} />
            {s.name}
          </label>
        ))}
      </div>
      <details className="advanced">
        <summary>Gelişmiş seçenekler</summary>
        <div className="fields">
          <label className="field">
            <span>Güvenilirlik kesit yılı</span>
            <input type="number" value={adv.cutoff} onChange={n('cutoff')} />
          </label>
          <label className="field">
            <span>Yenilik kontrolü: ilk N aday</span>
            <input type="number" value={adv.top} onChange={n('top')} />
          </label>
          <label className="field">
            <span>Makale başlangıç yılı</span>
            <input type="number" value={adv.start_year} onChange={n('start_year')} />
          </label>
          <label className="field">
            <span>Gen başına makale</span>
            <input type="number" value={adv.per_gene} onChange={n('per_gene')} />
          </label>
          <label className="field">
            <span>
              En fazla hastalık makalesi <small>aşılırsa yıllara orantılı örnekleme</small>
            </span>
            <input type="number" value={adv.max_a} onChange={n('max_a')} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={adv.force} onChange={(e) => setAdv({ ...adv, force: e.target.checked })} />
            <span>İlaç sözlüğü ve etiketleri yeniden indir</span>
          </label>
        </div>
      </details>
      {can && (
        <div className="row">
          <Button variant="primary" onClick={run} disabled={busy || start.isPending}>
            Seçili adımları çalıştır
          </Button>
          <span className={`hint ${hint.err ? 'err' : ''}`}>
            {busy ? 'Bu hastalık için bir analiz zaten çalışıyor.' : hint.text}
          </span>
        </div>
      )}
    </div>
  );
}

const fmtSum = (s?: TuneSummary) =>
  s?.trials
    ? `klinik çalışma: ilk 10'da ${s.trials.hits_at_10}, AUC ${s.trials.auc}` +
      (s.trials_novel ? ` · hiç anılmamış: ilk 50'de ${s.trials_novel.hits_at_50}, AUC ${s.trials_novel.auc}` : '')
    : '–';

function TuneCard({ d, can, busy }: { d: DiseaseDetail; can: boolean; busy: boolean }) {
  const [a, setA] = useState(2016);
  const [b, setB] = useState(2019);
  const [err, setErr] = useState('');
  const t = useTuning(d.key);
  const start = useStartRun(d.key);
  const run = () => {
    if (a === b) return setErr('Kesit A ve B farklı olmalı.');
    setErr('');
    start.mutate(
      { steps: ['tune', 'rank', 'backtest', 'report'], cutoff_a: a, cutoff_b: b },
      { onError: (e) => setErr(errorMessage(e)) },
    );
  };
  const r = t.data;
  const v = r?.validation_on_b;
  return (
    <div className="card">
      <h2>Parametre ayarı (çapraz doğrulama)</h2>
      <p className="hint">
        Ayarlar bir kesit yılında (A) denenir, en iyisi başka bir kesit yılında (B) sınanır. B'de de varsayılanı geçerse
        uygulanır; geçemezse "testlere uydurma" sayılır ve uygulanmaz. Yaklaşık 1-3 dakika.
      </p>
      {can && (
        <div className="row">
          <label className="field">
            <span>Kesit A (ayar)</span>
            <input
              type="number"
              className="inline"
              style={{ width: 90 }}
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Kesit B (doğrulama)</span>
            <input
              type="number"
              className="inline"
              style={{ width: 90 }}
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
            />
          </label>
          <Button variant="secondary" onClick={run} disabled={busy || start.isPending}>
            Ayarı çalıştır
          </Button>
        </div>
      )}
      {err && <div className="hint err">{err}</div>}
      <div className="hint">
        {r && !r.best_params && 'Henüz çalıştırılmadı.'}
        {r?.best_params && v && (
          <>
            <div>
              Son çalıştırma {fmtShort(r.at)} · kesit A {r.cutoff_a}, kesit B {r.cutoff_b}
            </div>
            <table className="tune-table">
              <thead>
                <tr>
                  <th>Kesit A'da en iyi ayar</th>
                  <th>Kesit B'de sonuç</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {Object.entries(r.best_on_a?.params || {})
                      .map(
                        ([k, val]) =>
                          `${PNAME[k] || k}: ${val === true ? 'açık' : val === false ? 'kapalı' : String(val)}`,
                      )
                      .join(', ')}
                  </td>
                  <td>{fmtSum(v.best_summary)}</td>
                </tr>
                <tr>
                  <td>Varsayılan ayar</td>
                  <td>{fmtSum(v.base_summary)}</td>
                </tr>
              </tbody>
            </table>
            <div className={`verdict ${v.validated ? 'ok' : 'no'}`}>
              {r.verdict}
              {r.applied ? ' Uygulandı.' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
