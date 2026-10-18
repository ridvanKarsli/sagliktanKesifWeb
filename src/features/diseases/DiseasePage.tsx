import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisease, useDiseases, diseaseKeys } from './hooks';
import { diseasesApi } from './api';
import { useLiveRuns, useStartRun } from '@/features/runs/hooks';
import { JobBox } from '@/features/runs/JobBox';
import { SettingsTab } from '@/features/runs/SettingsTab';
import { CandidatesTab } from '@/features/candidates/CandidatesTab';
import { KnownTab } from '@/features/candidates/KnownTab';
import { BridgesTab } from '@/features/candidates/BridgesTab';
import { BacktestTab } from '@/features/candidates/BacktestTab';
import { DiscoveryTab } from '@/features/discovery/DiscoveryTab';
import { PlainSummary } from './PlainSummary';
import { useCan } from '@/features/auth/useSession';
import { Button, Tabs, useToast, PageError } from '@/shared/ui';
import { ALL_STEPS, STEPS } from '@/shared/lib/labels';
import { fmtDateTime, fmtInt, fmtShort } from '@/shared/lib/format';
import { errorMessage } from '@/shared/api/errors';
import { downloadFile, openFileInTab } from '@/shared/api/client';
import { isActiveRun, type DiseaseDetail } from '@/entities';

type TabKey = 'candidates' | 'discovery' | 'known' | 'validation' | 'bridges' | 'settings';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'candidates', label: 'Aday ilaçlar' },
  { key: 'discovery', label: 'Keşif özeti' },
  { key: 'known', label: 'Bilinen tedaviler' },
  { key: 'validation', label: 'Güvenilirlik testi' },
  { key: 'bridges', label: 'Köprü genler' },
  { key: 'settings', label: 'Ayarlar' },
];

export function DiseasePage() {
  const { key = '' } = useParams();
  const all = useDiseases();
  const labelOf = useCallback((k: string) => all.data?.find((d) => d.key === k)?.label, [all.data]);
  const live = useLiveRuns(labelOf);
  const detail = useDisease(key);
  const [tab, setTab] = useState<TabKey>('candidates');
  const canAnalyst = useCan('analyst');
  const canAdmin = useCan('admin');
  const { toast } = useToast();
  const nav = useNavigate();
  const qc = useQueryClient();
  const start = useStartRun(key);

  const remove = useMutation({
    mutationFn: (purge: boolean) => diseasesApi.remove(key, purge),
    onSuccess: () => {
      toast(`${detail.data?.label || key} kaldırıldı`);
      qc.invalidateQueries({ queryKey: diseaseKeys.all });
      nav('/');
    },
    onError: (e) => toast(errorMessage(e), { bad: true }),
  });

  if (detail.isLoading) return <div className="skeleton">Yükleniyor…</div>;
  if (detail.error || !detail.data)
    return <PageError>{detail.error ? errorMessage(detail.error) : 'Hastalık bulunamadı.'}</PageError>;
  const d = detail.data;
  const s = d.status;
  const activeRun =
    live.data?.find((r) => r.disease_key === key && isActiveRun(r)) ||
    (isActiveRun(d.active_run) ? d.active_run! : undefined);
  const lastRun = live.data
    ?.filter((r) => r.disease_key === key)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
  const shownRun =
    activeRun ||
    (lastRun && lastRun.finished_at && Date.now() - new Date(lastRun.finished_at).getTime() < 10 * 60_000
      ? lastRun
      : undefined);

  const onRemove = () => {
    if (!confirm(`"${d.label}" listeden kaldırılsın mı?`)) return;
    const purge =
      s.has_corpus && canAdmin
        ? confirm(
            'İndirilen makaleler ve sonuçlar da silinsin mi?\n\nTamam: hepsini sil (yer açılır, yeniden eklenirse baştan indirilir)\nİptal: yalnızca listeden kaldır (veri diskte kalır)',
          )
        : false;
    remove.mutate(purge);
  };

  const runAll = () => start.mutate({ steps: ALL_STEPS }, { onError: (e) => toast(errorMessage(e), { bad: true }) });

  return (
    <section>
      <nav className="crumbs">
        <Link to="/">Hastalıklar</Link>
        <span>/</span>
        <span>{d.label}</span>
      </nav>
      <div className="page-head">
        <div>
          <h1>{d.label}</h1>
          <p className="lead">
            {[
              d.name_en,
              d.mesh_id,
              s.has_corpus ? `${s.n_articles} hastalık makalesi, ${s.n_bridges} köprü gen` : 'Henüz veri indirilmedi',
              s.fetched_at ? `son indirme ${fmtShort(s.fetched_at)}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="actions">
          {s.has_report && (
            <Button
              variant="secondary"
              onClick={() =>
                openFileInTab(`/diseases/${encodeURIComponent(key)}/report`).catch((e) =>
                  toast(errorMessage(e), { bad: true }),
                )
              }
            >
              Raporu aç
            </Button>
          )}
          {s.has_candidates && (
            <Button
              variant="secondary"
              onClick={() =>
                downloadFile(`/diseases/${encodeURIComponent(key)}/export.csv`, `${key}_candidates.csv`).catch((e) =>
                  toast(errorMessage(e), { bad: true }),
                )
              }
            >
              Listeyi indir
            </Button>
          )}
          {canAnalyst && (
            <Button variant="primary" onClick={runAll} disabled={!!activeRun || start.isPending}>
              {s.has_candidates ? 'Analizi güncelle' : 'Analizi başlat'}
            </Button>
          )}
          {canAnalyst && (
            <Button variant="icon" onClick={onRemove} title="Hastalığı listeden kaldır" disabled={remove.isPending}>
              Kaldır
            </Button>
          )}
        </div>
      </div>

      {!s.has_corpus && !activeRun && <EstimateBox d={d} />}
      {s.has_candidates && <PlainSummary d={d} />}
      <ProgressLine d={d} />
      {shownRun && <JobBox run={shownRun} diseaseKey={key} />}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'candidates' && <CandidatesTab d={d} activeRun={activeRun} />}
      {tab === 'discovery' && <DiscoveryTab diseaseKey={key} />}
      {tab === 'known' && <KnownTab diseaseKey={key} />}
      {tab === 'validation' && <BacktestTab diseaseKey={key} />}
      {tab === 'bridges' && <BridgesTab diseaseKey={key} />}
      {tab === 'settings' && <SettingsTab d={d} activeRun={activeRun} />}
    </section>
  );
}

function ProgressLine({ d }: { d: DiseaseDetail }) {
  const steps = d.status.steps || {};
  const done = STEPS.filter((st) => steps[st.key]);
  const lastAt = done
    .map((st) => steps[st.key]?.at || '')
    .sort()
    .pop();
  return (
    <div className="progress-line" title="Analizin adımları ve her birinin son çalışma zamanı">
      {done.length === 0 ? (
        <span className="pstep todo">Henüz analiz yapılmadı</span>
      ) : (
        <>
          <span className="plabel">Son analiz {fmtDateTime(lastAt)} · </span>
          {STEPS.map((st) => {
            const info = steps[st.key];
            return (
              <span
                key={st.key}
                className={`pstep ${info ? 'done' : 'todo'}`}
                title={`${st.sub}${info ? ' · ' + fmtDateTime(info.at) : ' · henüz yapılmadı'}`}
              >
                {info ? '✓ ' : ''}
                {st.name}
              </span>
            );
          })}
        </>
      )}
    </div>
  );
}

function EstimateBox({ d }: { d: DiseaseDetail }) {
  const est = useQuery({
    queryKey: ['estimate', d.key],
    queryFn: () => diseasesApi.estimate(d.key),
    staleTime: 10 * 60_000,
    retry: false,
  });
  return (
    <div className="estimate">
      {est.isLoading && 'Makale sayısı alınıyor…'}
      {est.error && <span className="warn">Makale kaynağına ulaşılamadı: {errorMessage(est.error)}</span>}
      {est.data && (
        <>
          <span>
            Literatürde <b>{fmtInt(est.data.pubmed_total)}</b> makale
          </span>
          {est.data.sampled && (
            <span>
              indirilecek: <b>{fmtInt(est.data.will_download)}</b> (yıllara orantılı örnek)
            </span>
          )}
          <span>
            tahmini süre: <b>~{est.data.estimated_minutes} dk</b>
          </span>
          {est.data.small && (
            <span className="warn">
              Az makale: köprü genler ve adaylar sınırlı olur, sonuçlar temkinli yorumlanmalı.
            </span>
          )}
          <span className="hint" style={{ margin: 0 }}>
            Analiz arka planda çalışır; birden fazla hastalık sıraya alınabilir.
          </span>
        </>
      )}
    </div>
  );
}
