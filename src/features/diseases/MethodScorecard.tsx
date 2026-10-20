import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { diseasesApi } from './api';
import { FUSION_NAME, METHOD_NAME } from '@/shared/lib/labels';
import { fmtDateTime } from '@/shared/lib/format';
import type { CiValue, DiseaseDetail, Gate } from '@/entities';

const pct = (v: number | null | undefined) => (v == null ? '–' : v.toFixed(3));
const ci = (c?: CiValue) => (c && c.mean != null ? `${pct(c.mean)}  [${pct(c.lo)} – ${pct(c.hi)}]` : '–');

/** Yöntem karnesi: hangi sıralama yönteminin kullanıldığı ve bunun hangi ölçüme dayandığı. */
export function MethodScorecard({ diseases }: { diseases?: DiseaseDetail[] }) {
  const q = useQuery({ queryKey: ['benchmark'], queryFn: diseasesApi.benchmark, staleTime: 60_000 });
  const data = q.data;
  if (!data) return null;
  const decision = data.decision;
  const bm = data.benchmark;
  const labelOf = (k: string) => diseases?.find((d) => d.key === k)?.label || k;
  return (
    <section className="compare">
      <h2>Yöntem karnesi</h2>
      <p className="hint">
        Sıralama yöntemi tahminle değil ölçümle seçilir: her hastalık birden fazla geçmiş yılda test edilir, yöntemler
        aynı testlerde karşılaştırılır. Yeni bir yöntem, mevcut yöntemi güven aralığıyla geçmedikçe kullanılmaz.
      </p>
      {decision && (
        <div className="decision">
          <b>Şu an kullanılan:</b> {FUSION_NAME[decision.method] || decision.method}
          {decision.channels?.length ? ` (${decision.channels.length} kanal)` : ''}
          {decision.origin ? <span className="sub"> · {decision.origin}</span> : null}
          {decision.reason && <p>{decision.reason}</p>}
        </div>
      )}
      {!bm && (
        <p className="hint">
          Bu kurulumda henüz çok hastalıklı ölçüm yapılmadı; paketle gelen ölçüm kullanılıyor. Ölçüm için en az iki
          hastalıkta analiz tamamlanmalı, ardından sunucuda <code>kesif benchmark</code> çalıştırılmalı.
        </p>
      )}
      {bm && (
        <>
          <div className="tablecard">
            <table className="gtable">
              <thead>
                <tr>
                  <th>Yöntem</th>
                  <th title="Ortalama kesinlik; %90 güven aralığı">Ortalama AP [%90 GA]</th>
                  <th title="İlk 25 sıradaki doğrulanan ilaç sayısı (ortalama)">İlk 25</th>
                  <th title="Temel yönteme göre fark; %90 güven aralığı">Temel yönteme göre</th>
                  <th title="Testlerde önde / geride olduğu sayısı">Önde / geride</th>
                </tr>
              </thead>
              <tbody>
                {[...bm.methods, 'frequency', 'ltc', 'network', 'random'].map((m) => {
                  const r = bm.scorecard[m];
                  if (!r) return null;
                  return (
                    <tr key={m} className={m === bm.decision.measured_as ? 'method' : ''}>
                      <td>{METHOD_NAME[m] || m}</td>
                      <td>{ci(r.ap)}</td>
                      <td>{r.hits_at_25?.mean != null ? r.hits_at_25.mean.toFixed(1) : '–'}</td>
                      <td>{r.vs_base ? ci(r.vs_base) : '–'}</td>
                      <td>{r.wins != null ? `${r.wins} / ${r.losses}` : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bm.gate_1 && <GateBox gate={bm.gate_1} />}
          <p className="hint">
            {bm.n_groups} test ({bm.fit_diseases.length} hastalık × {bm.cutoffs.join(', ')} kesitleri) ·{' '}
            {fmtDateTime(bm.at)}
            {bm.hold_out.length > 0 && (
              <>
                {' '}
                · karara katılmayan kontrol hastalıkları: {bm.hold_out.map(labelOf).join(', ')}
                {bm.decision.hold_out &&
                  (bm.decision.hold_out.confirmed
                    ? ' (seçilen yöntem bunlarda da önde)'
                    : ' (seçilen yöntem bunlarda doğrulanamadı)')}
              </>
            )}
          </p>
          <div className="tablecard">
            <table className="gtable">
              <thead>
                <tr>
                  <th>Hastalık</th>
                  <th>Temel yöntem AP</th>
                  <th>Kullanılan AP</th>
                  <th>Sıklık AP</th>
                  <th>Rastgele AP</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(bm.diseases).map(([k, r]) => (
                  <tr key={k}>
                    <td>
                      <Link to={`/d/${k}`}>{labelOf(k)}</Link>
                      {r.hold_out ? <span className="sub"> · kontrol</span> : null}
                    </td>
                    <td>{pct(r.mean_base_ap)}</td>
                    <td>{pct(r.mean_chosen_ap)}</td>
                    <td>{pct(r.mean_frequency_ap)}</td>
                    <td>{pct(r.mean_random_ap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/** Faz 1 kapısı: üç koşulun durumu. */
function GateBox({ gate }: { gate: Gate }) {
  const c = gate.checks;
  const le = c.label_error;
  const rows: [boolean, string][] = [
    [c.diseases.ok, `Ölçülen hastalık: ${c.diseases.value} / ${c.diseases.target}`],
    [
      le.ok,
      le.value != null
        ? `Etiket hatası: %${(le.value * 100).toFixed(1)} (${le.n_checked} satır, ${le.audited_diseases} hastalık denetlendi; hedef < %${((le.target || 0) * 100).toFixed(0)})`
        : 'Etiket hatası: henüz denetlenmedi (kesif label-audit)',
    ],
    ...Object.entries(c.beats_baselines.baselines || {}).map(
      ([b, v]) =>
        [v.ok, `${METHOD_NAME[b] || b} taban çizgisine göre fark ${pct(v.mean)} [${pct(v.lo)} – ${pct(v.hi)}]`] as [
          boolean,
          string,
        ],
    ),
  ];
  return (
    <div className={`confbox ${gate.passed ? '' : 'low'}`}>
      <div className="confbox-head">
        <b>Kapı 1 {gate.passed ? 'geçildi' : 'henüz geçilmedi'}</b>
      </div>
      <ul>
        {rows.map(([ok, text]) => (
          <li key={text}>
            {ok ? '✓' : '✗'} {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
