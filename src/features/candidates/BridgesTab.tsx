import { useBridges } from './hooks';
import { Empty, Tag } from '@/shared/ui';

export function BridgesTab({ diseaseKey }: { diseaseKey: string }) {
  const q = useBridges(diseaseKey);
  const rows = q.data || [];
  const missing = rows.filter((r) => !r.has_literature).length;
  return (
    <div className="panel">
      <p className="explain">
        Köprü genler, hastalık ile ilaçlar arasındaki bağlantının geçtiği genlerdir: hastalık makalelerinde sık geçenler
        ("doğrudan") ve bunlarla literatürde ilişkisi olan yolak komşuları. Bir genin literatürü inmemişse henüz
        puanlamaya girmez.
      </p>
      {q.data && rows.length === 0 && <Empty>Makaleler indirilmeden köprü genler hesaplanamaz.</Empty>}
      {rows.length > 0 && (
        <>
          {missing > 0 && (
            <p className="hint err" style={{ margin: '0 0 10px' }}>
              {missing} köprü genin literatürü henüz inmedi; bunlar puanlamaya girmiyor. Ayarlar sekmesinden "Makaleleri
              indir" adımını çalıştırın (yalnızca eksikler iner).
            </p>
          )}
          <div className="tablecard">
            <table className="gtable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gen</th>
                  <th>Resmi sembol</th>
                  <th>Nasıl seçildi</th>
                  <th>Hastalık makalesi</th>
                  <th title="Genin hastalık literatüründeki payı / tüm literatürdeki payı. Eşiğin altındakiler köprü olmaz (genel sitokinler her hastalığa sızmasın diye)">
                    Özgüllük
                  </th>
                  <th>İndirilen gen literatürü</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.gene_id} className={r.used ? '' : 'muted'}>
                    <td>{i + 1}</td>
                    <td>
                      {r.label}
                      {r.species && r.species !== 'insan' && <small> ({r.species})</small>}
                    </td>
                    <td>{r.symbol}</td>
                    <td>
                      <Tag kind={r.source === 'primary' ? 'aday' : 'plain'}>
                        {r.source === 'primary' ? 'doğrudan' : 'yolak komşusu'}
                      </Tag>
                    </td>
                    <td>{r.n_articles}</td>
                    <td>
                      {r.specificity != null ? (
                        <>
                          {r.specificity}× {!r.used && <Tag kind="ters">elendi</Tag>}
                        </>
                      ) : (
                        <span className="sub">bilinmiyor</span>
                      )}
                    </td>
                    <td>{r.has_literature ? r.n_literature : 'inmedi'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
