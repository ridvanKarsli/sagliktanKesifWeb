import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompare, useDiseases } from './hooks';
import { diseasesApi } from './api';
import { useLiveRuns } from '@/features/runs/hooks';
import { useCatalogStatus } from '@/features/catalog/AddDiseaseDialog';
import { catalogApi } from '@/features/catalog/api';
import { useCan } from '@/features/auth/useSession';
import { Button, Spinner, PageError } from '@/shared/ui';
import { errorMessage } from '@/shared/api/errors';
import { isActiveRun, type DiseaseDetail, type ServiceCheck } from '@/entities';
import { useCallback } from 'react';

function badgeFor(d: DiseaseDetail): [string, string] {
  if (d.active_run?.status === 'queued') return ['running', `Sırada (${d.active_run.queue_position}.)`];
  if (isActiveRun(d.active_run)) return ['running', 'Analiz çalışıyor'];
  const s = d.status;
  if (s.has_candidates && s.has_backtest) return ['ready', 'Analiz hazır'];
  if (s.has_candidates) return ['ready', 'Adaylar hazır'];
  if (s.has_corpus) return ['partial', 'Veri indirildi, analiz bekliyor'];
  return ['none', 'Henüz başlamadı'];
}

export function HomePage() {
  const diseases = useDiseases();
  const labelOf = useCallback((key: string) => diseases.data?.find((d) => d.key === key)?.label, [diseases.data]);
  useLiveRuns(labelOf);
  const nav = useNavigate();
  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Hastalıklar</h1>
          <p className="lead">
            Bir hastalık seçin. Her hastalık için tıbbi literatürden kaynaklı ilaç adayları üretilir, güvenilirliği
            ölçülür ve kanıtı gösterilir.
          </p>
        </div>
      </div>
      <CatalogNotice />
      <ServicesCheck />
      {diseases.error && <PageError>{errorMessage(diseases.error)}</PageError>}
      <div className="cards">
        {diseases.data?.map((d) => {
          const [cls, text] = badgeFor(d);
          const s = d.status;
          return (
            <button key={d.key} type="button" className="dcard" onClick={() => nav(`/d/${d.key}`)}>
              <span className={`badge ${cls}`}>{text}</span>
              <h3>{d.label}</h3>
              <div className="sub">
                {d.name_en} · {d.mesh_id || 'sözlük kimliği yok'}
              </div>
              <div className="kpis">
                <span>
                  <b>{s.n_articles || '–'}</b>hastalık makalesi
                </span>
                <span>
                  <b>{s.n_bridges || '–'}</b>köprü gen
                </span>
                <span>
                  <b>{d.n_candidates || s.steps?.rank?.n_candidates || '–'}</b>aday ilaç
                </span>
              </div>
              <div className="sub">
                {s.fetched_at ? 'Son indirme ' + s.fetched_at.slice(0, 10) : 'Analizi başlatmak için tıklayın'}
              </div>
            </button>
          );
        })}
      </div>
      <CompareSection />
      {diseases.data && diseases.data.length === 0 && (
        <div className="callout">
          <h2>Henüz hastalık yok</h2>
          <p>
            Sağ üstten "Hastalık ekle" ile başlayın. Hastalıklar uluslararası hastalık sözlüğünden seçilir; elle yazmaya
            gerek yoktur.
          </p>
        </div>
      )}
    </section>
  );
}

function CatalogNotice() {
  const st = useCatalogStatus();
  const qc = useQueryClient();
  const can = useCan('analyst');
  const build = useMutation({
    mutationFn: catalogApi.build,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'status'] }),
  });
  if (!st.data || st.data.ready) return null;
  const b = st.data.build;
  return (
    <div className="notice">
      {b?.status === 'running' ? (
        <>
          <Spinner />
          <span>
            Hastalık kataloğu ilk kez indiriliyor: {b.stage || 'başlıyor'}. Bitince "Hastalık ekle" ile tüm hastalıklar
            listelenir.
          </span>
        </>
      ) : (
        <>
          <span>Hastalık kataloğu henüz indirilmedi; ilk kullanımda bir kez indirilir (1-3 dk).</span>
          {can && (
            <Button variant="secondary" onClick={() => build.mutate()} disabled={build.isPending}>
              Şimdi indir
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function ServicesCheck() {
  const [res, setRes] = useState<{ ok: boolean; checks: ServiceCheck[] } | null>(null);
  const check = useMutation({ mutationFn: diseasesApi.services, onSuccess: setRes });
  return (
    <div className="services">
      <Button variant="secondary" onClick={() => check.mutate()} disabled={check.isPending}>
        {check.isPending ? 'Kontrol ediliyor…' : 'Veri kaynaklarını kontrol et'}
      </Button>
      <span className="hint">
        {res
          ? res.ok
            ? 'Tüm kaynaklar erişilebilir ve beklenen biçimde yanıt veriyor.'
            : 'En az bir kaynak sorunlu; analiz bu adımda eksik kalabilir (ayrıntı için işaretin üzerine gelin).'
          : 'Makale, gen, ilaç ve klinik çalışma kaynaklarına küçük birer istek atılır; bir analize başlamadan önce önerilir.'}
      </span>
      <div className="svc-list" style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {check.error && (
          <span className="svc bad">
            <i />
            {errorMessage(check.error)}
          </span>
        )}
        {res?.checks.map((c) => (
          <span key={c.key} className={`svc ${c.ok ? 'ok' : 'bad'}`} title={c.detail}>
            <i />
            {c.name} · {c.ms} ms{c.ok ? '' : ` · ${c.detail}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompareSection() {
  const cmp = useCompare();
  if (!cmp.data || cmp.data.length === 0) return null;
  return (
    <section className="compare">
      <h2>Hastalıklar arası karşılaştırma</h2>
      <p className="hint">
        Her hastalıkta yöntemin ürettiği "yeni" adaylardan kaçının bağımsız klinik çalışma kaydı olduğu ve geriye dönük
        test sonucu. Ayrıntı için hastalık sayfasındaki "Keşif özeti" sekmesi.
      </p>
      <div className="tablecard">
        <table className="gtable">
          <thead>
            <tr>
              <th>Hastalık</th>
              <th>Aday</th>
              <th>İlk 3</th>
              <th title="Hastalıkla hiç anılmamış adaylardan klinik çalışma kaydı olanlar / kontrol edilenler">
                Yeni adaylarda bağımsız kayıt
              </th>
              <th title="Rastgele beklenenin kaç katı">Zenginleşme</th>
              <th title="Geriye dönük test, klinik çalışma ölçütü, ilk 10: yöntem / sıklık">Test @10</th>
              <th>Öne çıkan hedefler</th>
            </tr>
          </thead>
          <tbody>
            {cmp.data.map((r) => (
              <tr key={r.key}>
                <td>
                  <Link to={`/d/${r.key}`}>{r.label}</Link>
                </td>
                <td>{r.n_candidates ?? '–'}</td>
                <td>{(r.top3 || []).join(', ')}</td>
                <td>{r.n_new_checked ? `${r.n_new_with_trials} / ${r.n_new_checked}` : '–'}</td>
                <td>{r.enrichment != null ? `${r.enrichment}×` : '–'}</td>
                <td>{r.trials_at_10 ?? '–'}</td>
                <td>{(r.top_classes || []).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
