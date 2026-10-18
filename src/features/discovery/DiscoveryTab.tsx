import { useDiscovery } from './api';
import { Empty, Tag } from '@/shared/ui';
import { COMPOUND, fmtShort } from '@/shared/lib/format';
import type { DiscoveryCandidate } from '@/entities';

function Hit({ c }: { c: DiscoveryCandidate }) {
  if (c.clinical_trials && c.clinical_trials > 0)
    return (
      <Tag kind="known" title="klinik çalışma kayıtlarında bu hastalık için kayıt">
        klinik çalışması var ({c.clinical_trials})
      </Tag>
    );
  if (c.clinical_trials === 0)
    return c.pubmed_direct && c.pubmed_direct > 0 ? (
      <Tag kind="plain">literatürde {c.pubmed_direct} makale</Tag>
    ) : (
      <Tag kind="aday">denenmemiş hipotez</Tag>
    );
  return <Tag kind="plain">kontrol edilmedi</Tag>;
}

export function DiscoveryTab({ diseaseKey }: { diseaseKey: string }) {
  const q = useDiscovery(diseaseKey);
  const s = q.data;
  return (
    <div className="panel">
      <p className="explain">
        Bu hastalıkla <b>hiç anılmamış</b> ilaç adayları, her biri için verideki sayılara dayanan gerekçe, ve bağımsız
        doğrulama: bu adaylardan kaçı klinik çalışma kayıtlarında bu hastalık için zaten kayıtlı? Yöntem bunları
        görmeden bulduysa, kaydı olmayanlar da ciddiye alınmaya değer.
      </p>
      {s && !s.built_at && <Empty>Keşif özeti henüz üretilmedi. "Rapor" adımı (Analizi güncelle) bunu üretir.</Empty>}
      {s?.built_at && (
        <>
          <div className="disc-head">
            <div className="disc-kpi">
              <b>{s.n_new}</b>
              <span>incelenen makale örneğinde hastalıkla hiç anılmamış ilaç</span>
            </div>
            <div className="disc-kpi">
              <b>
                {s.n_new_with_trials} / {s.n_new_checked}
              </b>
              <span>bunlardan klinik çalışma kaydı olan / kontrol edilen</span>
            </div>
            <div className="disc-kpi">
              <b>{s.n_untested ?? '–'}</b>
              <span>denenmemiş hipotez (literatürde ve kayıtlarda yok)</span>
            </div>
            <div className="disc-kpi">
              <b>{s.enrichment != null ? `${s.enrichment}×` : '–'}</b>
              <span>
                rastgele beklenenin katı{s.base_rate != null ? ` (taban %${(s.base_rate * 100).toFixed(1)})` : ''}
              </span>
            </div>
            <div className="disc-kpi">
              <b>
                {s.backtest?.trials ? `${s.backtest.trials.method_at_10} / ${s.backtest.trials.frequency_at_10}` : '–'}
              </b>
              <span>geriye dönük test @10: yöntem / sıklık</span>
            </div>
          </div>
          <div className="disc-verdict">{s.verdict || ''}</div>
          {s.target_classes && s.target_classes.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>Öne çıkan hedef sınıfları</h3>
              <div className="classes">
                {s.target_classes.map((c) => (
                  <span key={c.gene} title={c.drugs.join(', ')}>
                    <b>{c.gene}</b> · {c.n} aday
                  </span>
                ))}
              </div>
            </>
          )}
          <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>Yeni adaylar ve gerekçeleri</h3>
          {(s.new_candidates || []).length === 0 && <div className="empty">Yeni aday yok.</div>}
          {(s.new_candidates || []).map((c) => (
            <div key={c.rank} className="disc-item">
              <h4>
                #{c.rank} {c.chemical}{' '}
                <span className="meta">
                  {c.max_phase != null ? `faz ${Number(c.max_phase)}` : ''}
                  {c.chembl_id && (
                    <>
                      {' · '}
                      <a href={COMPOUND(c.chembl_id)} target="_blank" rel="noreferrer">
                        {c.chembl_id}
                      </a>
                    </>
                  )}
                </span>{' '}
                <Hit c={c} /> <Tag kind={c.direction}>{c.direction}</Tag>
              </h4>
              <div className="meta">
                köprü: {(c.genes || []).join(', ')}
                {c.mechanism ? ` · mekanizma: ${c.mechanism}` : ''}
              </div>
              <p>{c.justification}</p>
            </div>
          ))}
          <p className="hint">
            Üretim: {fmtShort(s.built_at)}. Gerekçeler kural tabanlıdır; her cümle verideki bir sayıya dayanır, dil
            modeli kullanılmaz.
          </p>
        </>
      )}
    </div>
  );
}
