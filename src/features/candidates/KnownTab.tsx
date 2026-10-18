import { useKnown } from './hooks';
import { HarmTag } from './HarmTag';
import { Empty } from '@/shared/ui';
import { COMPOUND } from '@/shared/lib/format';

export function KnownTab({ diseaseKey }: { diseaseKey: string }) {
  const q = useKnown(diseaseKey);
  return (
    <div className="panel">
      <p className="explain">
        Hastalık makalelerinde <b>doğrudan tedavi ilişkisi</b> raporlanan ilaçlar: zaten denenmiş ya da kullanılan
        tedavilerin haritası. Aday listesinden farkı: burada ilaç hastalıkla doğrudan anılır. Kılavuzlarla
        karşılaştırmak ve bir adayın gerçekten yeni olup olmadığını görmek için kullanın.
      </p>
      {q.data && q.data.length === 0 && <Empty>Henüz hesaplanmadı. "Sıralama" adımı bu listeyi de üretir.</Empty>}
      {q.data && q.data.length > 0 && (
        <div className="tablecard">
          <table className="gtable">
            <thead>
              <tr>
                <th>#</th>
                <th>İlaç</th>
                <th>Faz</th>
                <th title="Makalelerde 'ilaç hastalığı azaltıyor' ilişkisi">Tedavi ilişkisi</th>
                <th title="tedavi odaklı makalelerde anılma">Tedavi makalesi</th>
                <th>Tetikleme</th>
                <th>Güvenlik</th>
                <th>Yıllar</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((r) => (
                <tr key={r.rank}>
                  <td>{r.rank}</td>
                  <td>
                    <b>{r.chemical}</b>
                    {r.chembl_id && (
                      <div className="sub">
                        <a href={COMPOUND(r.chembl_id)} target="_blank" rel="noreferrer">
                          {r.chembl_id}
                        </a>
                      </div>
                    )}
                  </td>
                  <td>{r.max_phase != null ? Number(r.max_phase) : ''}</td>
                  <td>{r.n_treat_rel}</td>
                  <td>{r.n_therapy_articles || 0}</td>
                  <td>{r.n_harm_rel}</td>
                  <td>
                    <HarmTag row={r} />
                  </td>
                  <td>
                    {r.first_year || ''}
                    {r.last_year && r.last_year !== r.first_year ? `–${r.last_year}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
