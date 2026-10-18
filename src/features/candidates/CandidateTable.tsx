import { Meter, Q, Tag } from '@/shared/ui';
import { DIR_TITLE, DURUM, KIND, STATUS, STATUS_TITLE } from '@/shared/lib/labels';
import { num } from '@/shared/lib/format';
import { HarmTag } from './HarmTag';
import type { Candidate } from '@/entities';

const extraNum = (c: Candidate, k: string) => (typeof c.extra[k] === 'number' ? (c.extra[k] as number) : null);

export function CandidateTable({
  rows,
  selected,
  onSelect,
}: {
  rows: Candidate[];
  selected: string | null;
  onSelect: (c: Candidate) => void;
}) {
  const maxScore = Math.max(0, ...rows.map((r) => num(r.score)));
  return (
    <table className="cands">
      <thead>
        <tr>
          <th className="num">#</th>
          <th>
            İlaç{' '}
            <Q title="İlacın uluslararası adı; altında ilaç veritabanı kimliği ve makalelerdeki diğer yazımları. Satıra tıklayınca kanıt zinciri açılır." />
          </th>
          <th className="num col-expert">
            Faz <Q title="Klinik gelişim aşaması: 4 = en az bir hastalıkta onaylı ilaç, 1-3 = araştırma aşamasında." />
          </th>
          <th>
            Bağlantı gücü{' '}
            <Q title="İlacın bu hastalığın genleriyle literatürdeki bağlantısının gücü. Bu listedeki en güçlü bağlantıya göre 1-5 nokta; sayı yalnızca aynı hastalık içinde karşılaştırmak içindir. 'lit' makalelerden, 'hedef' ilacın bilinen hedefinden gelen kısım." />
          </th>
          <th>
            Mekanizma uyumu{' '}
            <Q title="Tutarlı: gen hastalıkta artmış ve ilaç o geni baskılıyor (ya da tersi) — mantıklı yön. Ters: ilaç geni hastalık yönünde etkiliyor, kötüleştirebilir. Bilinmiyor: yön verisi yetersiz (en sık durum)." />
          </th>
          <th className="col-expert">
            Zarar raporu{' '}
            <Q title="Makalelerde bu ilacın hastalığı tetiklediği ya da alevlendirdiği rapor var mı? 'Tetikleme sinyali' olanların puanı düşürülür." />
          </th>
          <th className="col-expert">
            Hedef{' '}
            <Q title="İlacın ilaç veritabanında kayıtlı bilinen hedefi, hastalığın köprü genlerinden biriyse burada yazar." />
          </th>
          <th className="num col-expert">
            Hangi genlerle{' '}
            <Q title="İlaç hastalığa kaç gen üzerinden bağlanıyor ve hangileri. Her gen için makaleler kanıt panelinde." />
          </th>
          <th className="num col-expert">
            Hastalıkla anılma{' '}
            <Q title="İlaç bu hastalıkla aynı makalede kaç kez geçmiş. 0 = hiç anılmamış = yöntemin yalnızca genler üzerinden bulduğu aday." />
          </th>
          <th>
            Yenilik{' '}
            <Q title="Yeni: hastalıkla hiç anılmamış. Literatürde anılmış: birlikte geçen makale var. Tedavi olarak çalışılmış: tedavi ilişkisi ya da klinik çalışma kaydı var (onaylı olduğu anlamına gelmez)." />
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const durum = DURUM[r.durum];
          const st = STATUS[r.status] || ['', 'plain'];
          const kind = KIND[r.kind];
          const mech = [...new Set((r.mechanism || '').split('; ').filter(Boolean))].join('; ');
          const pen = num(r.penalty || 1);
          return (
            <tr key={r.chemical_id} className={selected === r.chemical_id ? 'sel' : ''} onClick={() => onSelect(r)}>
              <td className="num">{r.rank}</td>
              <td>
                <div className="drug">{r.chemical}</div>
                <div className="sub">
                  {kind && (
                    <Tag kind="plain" title={`Sınıf: ${r.kind}`}>
                      {kind}
                    </Tag>
                  )}{' '}
                  {r.chembl_id || r.chemical_id}
                  {r.aliases ? ' · ' + r.aliases.split(';').slice(0, 2).join(', ') : ''}
                </div>
              </td>
              <td className="num col-expert">{r.max_phase != null ? String(Number(r.max_phase)) : ''}</td>
              <td>
                <Meter score={num(r.score)} max={maxScore} />
                <span className="sub">{num(r.score).toFixed(1)}</span>
                <div className="sub">
                  lit {num(r.lit_score).toFixed(0)} · hedef {num(r.mech_score).toFixed(0)}
                  {pen < 1 ? ` · ceza ×${pen.toFixed(2)}` : ''}
                </div>
              </td>
              <td>
                <Tag kind={r.direction} title={DIR_TITLE[r.direction] || ''}>
                  {r.direction}
                </Tag>
              </td>
              <td className="col-expert">
                <HarmTag
                  row={{
                    harm_signal: r.harm_signal,
                    n_harm_rel: extraNum(r, 'n_harm_rel'),
                    n_treat_rel: extraNum(r, 'n_treat_rel'),
                  }}
                />
              </td>
              <td className="mech col-expert">{mech}</td>
              <td className="num col-expert">
                {r.n_bridges}
                <div className="sub">
                  {(r.top_bridges || '')
                    .split(' | ')
                    .map((b) => b.split('(')[0])
                    .slice(0, 3)
                    .join(', ')}
                </div>
              </td>
              <td className="num col-expert">{r.n_direct_a}</td>
              <td>
                {st[0] && (
                  <Tag kind={st[1]} title={STATUS_TITLE[r.status] || ''}>
                    {st[0]}
                  </Tag>
                )}
                {durum && <div className="sub">{durum[0]}</div>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
