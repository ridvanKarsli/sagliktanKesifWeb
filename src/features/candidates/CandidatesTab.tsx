import { useMemo, useState } from 'react';
import { useCandidates } from './hooks';
import { FilterBar } from './FilterBar';
import { DEFAULT_FILTER, type UiFilter } from './filter';
import { CandidateTable } from './CandidateTable';
import { CandidateDrawer } from './CandidateDrawer';
import { Seg, Stale, Empty } from '@/shared/ui';
import { useLocalStorage } from '@/shared/lib/hooks';
import { useDebounced } from '@/shared/lib/hooks';
import { fmtShort } from '@/shared/lib/format';
import { errorMessage } from '@/shared/api/errors';
import type { Candidate, DiseaseDetail, Run } from '@/entities';

const PAGE = 200;

export function CandidatesTab({ d, activeRun }: { d: DiseaseDetail; activeRun?: Run }) {
  const [view, setView] = useLocalStorage<'simple' | 'expert'>('view', 'simple');
  const [f, setF] = useState<UiFilter>(DEFAULT_FILTER);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const dq = useDebounced(f.q, 250);
  const query = useMemo(
    () => ({
      q: dq.trim() || undefined,
      status: f.status || undefined,
      direction: f.direction || undefined,
      harm: f.harm || undefined,
      kind: f.kind || undefined,
      durum: f.durum || undefined,
      min_phase: f.phase || undefined,
      sort: f.sort,
      offset,
      limit: PAGE,
    }),
    [dq, f, offset],
  );
  const res = useCandidates(d.key, query, d.status.has_candidates);
  const setFilter = (n: UiFilter) => {
    setF(n);
    setOffset(0);
  };
  const applyView = (v: 'simple' | 'expert') => {
    setView(v);
    document.body.dataset.view = v;
  };
  const lj = d.status.last_job;
  const stale = lj && lj.status === 'failed' && activeRun?.status !== 'running';
  const total = res.data?.page.total ?? 0;

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="explain" style={{ margin: 0 }}>
          Her satır bir araştırma hipotezidir: literatürde hastalığın genleriyle güçlü biçimde bağlantılı bir ilaç.
          Satıra tıklayınca bağlantının hangi makalelerden çıktığını görürsünüz. <b>Tedavi önerisi değildir.</b>
        </p>
        <Seg
          label="Görünüm"
          value={view}
          onChange={applyView}
          options={[
            { value: 'simple', label: 'Sade' },
            { value: 'expert', label: 'Uzman' },
          ]}
        />
      </div>
      <details className="howto">
        <summary>Bu tablo nasıl okunur?</summary>
        <ol>
          <li>
            <b>Önce "Yenilik" sütununa bakın.</b> "Tedavi olarak çalışılmış" satırlar yöntemin doğrulamasıdır (bilineni
            buluyor mu?). "Yeni" satırlar keşif adaylarıdır: hastalıkla hiç anılmamış, yalnızca genler üzerinden
            bağlanmış.
          </li>
          <li>
            <b>Bağlantı gücü</b> aynı listedeki adayları karşılaştırmak içindir; 5 nokta = bu hastalıkta en güçlü
            bağlantılar. Farklı hastalıklar arasında karşılaştırılmaz.
          </li>
          <li>
            <b>Mekanizma uyumu "tutarlı"</b> olanlar öncelikli: ilaç, geni hastalığın tersine itiyor. "Ters" olanlar
            alevlendirme riski taşır.
          </li>
          <li>
            <b>Satıra tıklayın:</b> kanıt zinciri (hastalık → gen → ilaç), her adımın makale numaraları ve ilacın bugün
            ne için kullanıldığı.
          </li>
          <li>
            Hormon, aracı molekül ve metabolitler varsayılan görünümde gizlidir (hastalıkla anılmaları çoğunlukla ölçüm
            ilişkisidir); "Sınıf" süzgecinden açılır.
          </li>
        </ol>
      </details>
      <FilterBar value={f} onChange={setFilter} count={total} />
      <div className="tablecard">
        {stale && (
          <div style={{ padding: '10px 10px 0' }}>
            <Stale>
              <b>Son analiz tamamlanamadı ({fmtShort(lj!.finished_at)}).</b>
              Aşağıdaki liste önceki başarılı analize ait, güncel değil. Hata: {lj!.error || ''}. Analiz kutusundaki
              günlükte ayrıntı var; "Analizi güncelle" ile yeniden deneyin.
            </Stale>
          </div>
        )}
        {res.error && <div className="empty err-text">{errorMessage(res.error)}</div>}
        {!d.status.has_candidates ? (
          <div className="empty">
            <b>Henüz aday listesi yok.</b>
            <br />
            "Analizi başlat" ile makaleler indirilir ve adaylar üretilir.
          </div>
        ) : res.data && total === 0 ? (
          <div className="empty">Filtrelere uyan aday yok.</div>
        ) : (
          <>
            <CandidateTable
              rows={res.data?.items || []}
              selected={selected?.chemical_id ?? null}
              onSelect={setSelected}
            />
            {total > PAGE && (
              <div className="pager">
                <span>
                  {offset + 1}–{Math.min(offset + PAGE, total)} / {total}
                </span>
                <button
                  type="button"
                  className="btn icon"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE))}
                >
                  ‹ Önceki
                </button>
                <button
                  type="button"
                  className="btn icon"
                  disabled={offset + PAGE >= total}
                  onClick={() => setOffset(offset + PAGE)}
                >
                  Sonraki ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <CandidateDrawer d={d} row={selected} onClose={() => setSelected(null)} />
      {!d.status.has_candidates && !res.data && res.isLoading && <Empty>Yükleniyor…</Empty>}
    </div>
  );
}
