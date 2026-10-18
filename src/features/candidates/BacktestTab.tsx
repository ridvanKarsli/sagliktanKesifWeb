import { useBacktest } from './hooks';
import { Empty, Tag } from '@/shared/ui';
import { METRIC_NAME, SCHEME } from '@/shared/lib/labels';

export function BacktestTab({ diseaseKey }: { diseaseKey: string }) {
  const q = useBacktest(diseaseKey);
  const bt = q.data;
  return (
    <div className="panel">
      <p className="explain">
        Yöntemin geçmişi tahmin edip edemediğini ölçer: yalnızca belirli bir yıla kadarki makalelerle sıralama yapılır,
        sonra o yıldan <i>sonra</i> klinik çalışmaya giren ilaçların listede kaçıncı sırada olduğuna bakılır.
        Karşılaştırma için basit bir "en çok anılan ilaçlar" sıralaması (<i>frequency</i>) da gösterilir.{' '}
        <b>Yöntem bunu geçmiyorsa sıralamaya tahmin gözüyle bakılmamalıdır.</b>
      </p>
      {bt && !bt.schemes && (
        <Empty>
          <b>Henüz güvenilirlik testi yok.</b>
          <br />
          Analiz tamamlanınca burada görünür.
        </Empty>
      )}
      {bt?.schemes && (
        <>
          <div className="bt-head">
            <span>
              Kesit yılı <b>{bt.cutoff_year}</b>
            </span>
            <span>
              {bt.n_a_before} makale kesitten önce, {bt.n_a_after} sonra
            </span>
            <span>Birincil ölçüt: {(SCHEME[bt.primary_scheme || ''] || [bt.primary_scheme])[0]}</span>
          </div>
          <div className="bt-grid">
            {Object.entries(bt.schemes).map(([k, r]) => {
              const [name, sub] = SCHEME[k] || [k, ''];
              if (!r.metrics) {
                return (
                  <div key={k} className="bt-card">
                    <div className="bt-title">
                      <h3>{name}</h3>
                    </div>
                    <div className="meta">{sub}</div>
                    <div className="bt-pos">
                      {r.note || ''}
                      {r.positives_all && r.positives_all.length > 0 && (
                        <>
                          <br />
                          Pozitifler: {r.positives_all.join(', ')}
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              const used = r.metrics.fused ? 'fused' : 'method';
              const m = r.metrics[used];
              const f = r.metrics.frequency;
              const beats =
                !!m &&
                !!f &&
                (m.hits_at_10 > f.hits_at_10 || (m.hits_at_10 === f.hits_at_10 && m.hits_at_25 > f.hits_at_25));
              const tie = !!m && !!f && m.hits_at_10 === f.hits_at_10 && m.hits_at_25 === f.hits_at_25;
              return (
                <div key={k} className="bt-card">
                  <div className="bt-title">
                    <h3>{name}</h3>
                    <Tag kind="plain">
                      {r.n_positives} pozitif / {r.n_universe} ilaç
                    </Tag>
                  </div>
                  <div className="meta">
                    {sub} · rastgele beklenen isabet@10: {r.random_expected_hits?.at_10}
                    {r.random_expected_ap != null ? ` · rastgele AP: ${r.random_expected_ap}` : ''}
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Sıralama</th>
                        <th title="Ortalama kesinlik: pozitiflerin listede ne kadar üstte olduğu">AP</th>
                        <th>AUC</th>
                        <th>İlk 10</th>
                        <th>İlk 25</th>
                        <th>İlk 50</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(r.metrics).map(([key, v]) => (
                        <tr key={key} className={key === used ? 'method' : ''}>
                          <td>{METRIC_NAME[key] || key}</td>
                          <td>{v.ap ?? '–'}</td>
                          <td>{v.auc}</td>
                          <td>{v.hits_at_10}</td>
                          <td>{v.hits_at_25}</td>
                          <td>{v.hits_at_50}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {m && f && (
                    <div className={`bt-verdict ${beats ? 'ok' : 'no'}`}>
                      {beats
                        ? `Kullanılan sıralama, basit sıklık sıralamasını geçiyor (ilk 10'da ${m.hits_at_10} / ${f.hits_at_10}).`
                        : tie
                          ? 'Yöntem ve sıklık sıralaması başa baş.'
                          : 'Yöntem bu ölçütte sıklık sıralamasının gerisinde.'}
                    </div>
                  )}
                  <div className="bt-pos">
                    Pozitif ilaçlar ve sıraları (yöntem / sıklık):{' '}
                    {(r.positives || []).length
                      ? r.positives!.map((p, i) => (
                          <span key={p.drug}>
                            {i > 0 && ', '}
                            <b>{p.drug}</b> {p.method_rank ?? '–'} / {p.frequency_rank}
                          </span>
                        ))
                      : 'yok'}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
