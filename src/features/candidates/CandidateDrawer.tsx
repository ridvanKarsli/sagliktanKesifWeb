import { useEvidence, useIndications } from './hooks';
import { HarmTag } from './HarmTag';
import { Drawer, Tag } from '@/shared/ui';
import { DIR_TITLE, DURUM, FUSION_NAME, HARM, KIND, STATUS, TR } from '@/shared/lib/labels';
import { COMPOUND, PUBMED, num } from '@/shared/lib/format';
import { errorMessage } from '@/shared/api/errors';
import type { Candidate, DiseaseDetail, EvidenceLink } from '@/entities';

const Pm = ({ list }: { list?: string[] }) => (
  <span className="pm">
    {(list || []).map((p) => (
      <a key={p} href={PUBMED(p)} target="_blank" rel="noreferrer">
        {p}
      </a>
    ))}
  </span>
);

export function CandidateDrawer({ d, row, onClose }: { d: DiseaseDetail; row: Candidate | null; onClose: () => void }) {
  const ev = useEvidence(d.key, row?.chemical_id ?? null);
  const ind = useIndications(row?.chembl_id || null);
  if (!row) return null;
  const extraStr = (k: string) => (typeof row.extra[k] === 'string' ? (row.extra[k] as string) : '');
  const extraNum = (k: string) => (typeof row.extra[k] === 'number' ? (row.extra[k] as number) : null);
  const pen = num(row.penalty || 1);
  const fusion = extraStr('fusion') || 'base';
  const methodScore = extraNum('method_score') ?? num(row.score);
  const nChannels = extraNum('n_channels');
  const geneticTarget = extraStr('genetic_target');
  const networkTarget = extraStr('network_target');
  const biology = extraNum('biology_score');
  const accel = extraNum('accel_score');
  const links = ev.data || [];
  const warnings: string[] = [];
  if (num(row.lit_score) === 0 && num(row.mech_score) > 0)
    warnings.push(
      'Literatür köprüsü yok; puanın tamamı bilinen hedef kaydından geliyor. Tek kaynaklı kanıt, temkinli yorumlayın.',
    );
  if (pen < 1)
    warnings.push(
      'Hastalık makalelerinde bu ilacın hastalığı tetiklediği/alevlendirdiği raporlar var; puan düşürüldü.',
    );
  if (links.some((l) => l.gene_direction_source === 'propagated'))
    warnings.push('En az bir köprü genin yönü doğrudan ölçülmedi, komşu genlerden türetildi.');
  if (links.some((l) => l.species && l.species !== 'insan'))
    warnings.push('En az bir köprü gen model organizma (fare/sıçan) genidir; insan karşılığı ayrıca doğrulanmalı.');
  if (row.kind === 'endojen')
    warnings.push(
      'Endojen molekül: hastalık makalelerinde geçmesi çoğunlukla ölçüm (biyobelirteç) ilişkisidir, ilaç kullanımı değil.',
    );
  const stext = STATUS[row.status]?.[0] || '';
  const dtext = DURUM[row.durum]?.[0] || 'kontrol edilmedi';
  const directPmids = extraStr('direct_pmids');
  const sub = [
    row.chembl_id ? (
      <a key="c" href={COMPOUND(row.chembl_id)} target="_blank" rel="noreferrer">
        {row.chembl_id}
      </a>
    ) : (
      row.chemical_id
    ),
    row.max_phase ? `klinik faz ${Number(row.max_phase)}` : '',
    row.aliases ? row.aliases.replace(/;/g, ', ') : '',
  ].filter(Boolean);

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      title={row.chemical}
      sub={sub.map((x, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {x}
        </span>
      ))}
    >
      <div className="summary">
        <b>Bağlantı gücü</b>
        <span>
          {methodScore.toFixed(1)} = (literatür {num(row.lit_score).toFixed(1)} + mekanizma{' '}
          {num(row.mech_score).toFixed(1)}){pen < 1 ? ` × ${pen.toFixed(2)} güvenlik cezası` : ''}
        </span>
        {fusion !== 'base' && (
          <>
            <b>Sıralama puanı</b>
            <span>
              {num(row.score).toFixed(4)} · {FUSION_NAME[fusion] || fusion}
              {nChannels != null ? `, ${nChannels} kanalda kanıt` : ''}
            </span>
          </>
        )}
        {accel != null && accel > 0 && (
          <>
            <b>Kanıt ivmesi</b>
            <span title="(1 + son 5 yıldaki anılma) / √(1 + önceki anılma): ilginin son yıllarda ne kadar hızlı arttığı">
              {accel.toFixed(2)} · hastalık literatüründe son yıllarda yükselen ilgi
            </span>
          </>
        )}
        <b>Durum</b>
        <span>
          {stext}
          {KIND[row.kind] ? ` · ${KIND[row.kind]}` : ''}
        </span>
        <b>Mekanizma uyumu</b>
        <span>
          <Tag kind={row.direction}>{row.direction}</Tag> {DIR_TITLE[row.direction] || ''}
        </span>
        <b>Zarar raporu</b>
        <span>
          <HarmTag
            row={{
              harm_signal: row.harm_signal,
              n_harm_rel: extraNum('n_harm_rel'),
              n_treat_rel: extraNum('n_treat_rel'),
            }}
          />{' '}
          {(HARM[row.harm_signal] || HARM.yok!)[1]}
        </span>
        <b>Yenilik</b>
        <span>
          {dtext}
          {row.clinical_trials != null
            ? ` (klinik çalışma ${row.clinical_trials}, literatürde doğrudan ${row.pubmed_direct ?? 0})`
            : ''}
        </span>
        <b>Hastalıkla anılma</b>
        <span>
          {row.n_direct_a} makale · {directPmids ? <Pm list={directPmids.split(';')} /> : 'yok'}
        </span>
      </div>
      {warnings.length > 0 && (
        <div className="warnbox">
          <b>Dikkat</b>
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="indic">
        <b>Bağımsız kanıt (literatür dışı)</b>
        {!geneticTarget && !networkTarget && !biology ? (
          <span className="sub">
            {d.status.has_evidence
              ? 'İlacın hedefleri için genetik ilişki ya da protein ağında yakınlık bulunamadı.'
              : 'Bu hastalık için bağımsız kanıt adımı henüz çalışmadı.'}
          </span>
        ) : (
          <ul className="indep">
            {geneticTarget && (
              <li>
                Genetik ilişki: hedef <b className="inline">{geneticTarget.split(' ')[0]}</b> hastalıkla genetik olarak
                ilişkili (skor {geneticTarget.split(' ')[1]}).
              </li>
            )}
            {networkTarget && (
              <li>
                Protein ağı: hedef <b className="inline">{networkTarget.split(' ')[0]}</b> hastalık genlerine rastgele
                beklenenden yakın ({networkTarget.split(' ')[1]}).
              </li>
            )}
            {!!biology && <li>Hayvan modeli / gen ifadesi / yolak kanıtı: {biology.toFixed(2)}</li>}
          </ul>
        )}
      </div>
      {row.chembl_id && (
        <div className="indic">
          <b>Bugün ne için kullanılıyor / deneniyor</b>
          {ind.isLoading && <span className="sub">yükleniyor…</span>}
          {ind.data && !ind.data.indications && <span className="sub">alınamadı</span>}
          {ind.data?.indications && ind.data.indications.length === 0 && (
            <span className="sub">endikasyon kaydı yok</span>
          )}
          {ind.data?.indications?.map((i) => (
            <Tag key={i.term} kind={i.phase >= 4 ? 'known' : 'plain'} style={{ margin: '2px 4px 2px 0' }}>
              {i.term}
              {i.phase >= 4 ? ' · onaylı' : i.phase > 0 ? ` · faz ${i.phase}` : ''}
            </Tag>
          ))}
        </div>
      )}
      <h2>Kanıt zinciri</h2>
      <p className="hint" style={{ margin: '0 0 10px' }}>
        Hiçbir makale "bu ilaç bu hastalığa iyi gelir" demez. Bağlantı, hastalık ile gen arasındaki makaleler ve gen ile
        ilaç arasındaki makalelerin birleşmesinden çıkar.
      </p>
      {ev.isLoading && <div className="empty">Kanıt yükleniyor</div>}
      {ev.error && <div className="empty err-text">{errorMessage(ev.error)}</div>}
      {ev.data && links.length === 0 && <div className="empty">Kanıt kaydı bulunamadı</div>}
      {links.map((l, i) => (
        <EvidenceCard key={i} l={l} disease={d.label} drug={row.chemical} />
      ))}
    </Drawer>
  );
}

function EvidenceCard({ l, disease, drug }: { l: EvidenceLink; disease: string; drug: string }) {
  const gdir =
    (TR[l.gene_direction || ''] || 'bilinmiyor') +
    (l.gene_direction_source === 'propagated' ? ' (komşu genlerden türetildi)' : '');
  const cons = TR[l.consistency || ''] || 'bilinmiyor';
  const spec = l.specificity != null ? ` · özgüllük ${l.specificity}×` : '';
  const chain = (
    <div className="chain">
      <div className="node">{disease}</div>
      <div className="arrow">→</div>
      <div className="node gene">
        {l.gene}
        {l.species && l.species !== 'insan' && <small> ({l.species} geni)</small>}
      </div>
      <div className="arrow">←</div>
      <div className="node">{drug}</div>
    </div>
  );
  if (l.source === 'chembl') {
    return (
      <div className="ev">
        <h4>
          <span>Bilinen hedef kaydı</span>
          <Tag kind={cons}>{cons}</Tag>
        </h4>
        {chain}
        <div className="kv">
          <b>İlacın etkisi</b>
          <span>
            {(l.action_type || '').toLowerCase()} · {l.moa || ''}
          </span>
          <b>Gen hastalıkta</b>
          <span>
            {gdir}
            {spec}
          </span>
          <b>Puana katkı</b>
          <span>
            {num(l.contribution).toFixed(1)}
            {num(l.contribution) === 0 ? ' (mekanizma hastalık yönünde, puan verilmedi)' : ''}
          </span>
          <b>Hastalık-gen makaleleri</b>
          <Pm list={l.ab_pmids} />
        </div>
      </div>
    );
  }
  const rel = l.relations || {};
  return (
    <div className="ev">
      <h4>
        <span>Literatür köprüsü</span>
        <Tag kind={cons}>{cons}</Tag>
      </h4>
      {chain}
      <div className="kv">
        <b>Hastalık-gen</b>
        <span>
          {l.n_ab} makale · gen hastalıkta {gdir}
          {spec}
        </span>
        <b>Gen-ilaç</b>
        <span>
          {l.n_bc} makale · beklenenin {l.lift} katı · ilaç geni {TR[l.drug_effect || ''] || 'bilinmiyor'} (baskılama{' '}
          {rel.Negative_Correlation || 0}, artırma {rel.Positive_Correlation || 0} ilişki)
          {l.context_fraction != null ? ` · hastalık bağlamında ${Math.round(l.context_fraction * 100)}%` : ''}
        </span>
        <b>Puana katkı</b>
        <span>{num(l.contribution).toFixed(1)}</span>
        <b>Örnek hastalık-gen</b>
        <Pm list={l.ab_pmids} />
        <b>Örnek gen-ilaç</b>
        <Pm list={l.bc_pmids} />
      </div>
    </div>
  );
}
