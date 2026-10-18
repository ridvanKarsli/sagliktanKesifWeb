import { useCandidates } from '@/features/candidates/hooks';
import { useDiscovery } from '@/features/discovery/api';
import type { DiseaseDetail } from '@/entities';

/** Sade özet: adayların sayısı, ilk 10'daki bilinen tedaviler, yeni adaylar ve bağımsız doğrulama. */
export function PlainSummary({ d }: { d: DiseaseDetail }) {
  const top = useCandidates(d.key, { sort: 'score', limit: 10, offset: 0 });
  const yeni = useCandidates(d.key, { sort: 'score', limit: 1, offset: 0, status: 'yeni', kind: 'ilaç' });
  const disc = useDiscovery(d.key);
  if (!top.data) return null;
  const known10 = top.data.items.filter((r) => r.status === 'tedavi olarak çalışılmış').length;
  const total = d.n_candidates || top.data.page.total;
  const s = disc.data;
  const bt = s?.backtest?.trials;
  return (
    <div className="plain-summary">
      <b>{d.label}</b> için <b>{total}</b> ilaç adayı bulundu. İlk 10'un <b>{known10}</b>'u zaten tedavi olarak
      çalışılmış ilaçlar (yöntemin doğrulaması: bilineni buluyor). <b>{yeni.data?.page.total ?? '…'}</b> aday bu
      hastalıkla hiç anılmamış;{' '}
      {s?.n_new_checked ? (
        <>
          bunların kontrol edilen {s.n_new_checked}'inden <b>{s.n_new_with_trials}</b>'i bağımsız klinik çalışmaya
          girmiş.{' '}
        </>
      ) : null}
      {bt ? (
        <>
          Geriye dönük testte yöntem ilk 10'da {bt.method_at_10}, basit sıklık sıralaması {bt.frequency_at_10} isabet
          aldı.{' '}
        </>
      ) : null}
      Keşif adayları için "Yenilik" süzgecinden <b>Yeni</b>'yi seçin; gerekçeler "Keşif özeti" sekmesinde.
    </div>
  );
}
