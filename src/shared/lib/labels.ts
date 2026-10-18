/** Arayüzde kullanılan sabit etiketler; teknoloji/tedarikçi adları geçmez. */
import type { AnalysisStep } from '@/entities';

export const STEPS: { key: AnalysisStep; name: string; sub: string }[] = [
  { key: 'fetch', name: 'Makaleleri indir', sub: 'hastalık ve gen makaleleri' },
  { key: 'drugs', name: 'İlaç sözlüğü', sub: 'klinik aşamadaki ilaçların sözlüğü (bir kez)' },
  { key: 'labels', name: 'Doğrulama verileri', sub: 'Tedavi odaklı makaleler ve klinik çalışma kayıtları' },
  {
    key: 'evidence',
    name: 'Bağımsız kanıt',
    sub: 'Hedeflerin genetik ilişkisi ve protein ağında hastalık genlerine yakınlığı (literatürden bağımsız)',
  },
  { key: 'rank', name: 'Sıralama', sub: 'Kanıt kanalları ölçümle doğrulanmış yöntemle birleştirilir' },
  { key: 'backtest', name: 'Güvenilirlik testi', sub: 'Yöntem geçmişi tahmin edebiliyor mu' },
  { key: 'novelty', name: 'Yenilik kontrolü', sub: 'Aday zaten denenmiş mi (literatür ve klinik çalışma kayıtları)' },
  { key: 'report', name: 'Rapor', sub: 'Keşif özeti ve tek dosyalık rapor' },
];
export const STEP_NAME: Record<string, string> = Object.fromEntries(STEPS.map((s) => [s.key, s.name]));
export const ALL_STEPS: AnalysisStep[] = STEPS.map((s) => s.key);
export const stepIndex = (k: string) => STEPS.findIndex((s) => s.key === k);

export const PARAM_META: Record<string, [string, string]> = {
  top_k: ['Doğrudan köprü gen sayısı', 'hastalık makalelerinde en sık geçen N gen'],
  expand_bridges: ['Yolak komşularını ekle', 'ilişkili genleri de köprü yap (JAK/STAT gibi)'],
  max_expand: ['En fazla komşu gen', ''],
  min_relations: ['Komşu için en az ilişki', 'birincil genlerle gen-gen ilişki sayısı'],
  min_articles: ['Gen için en az makale', ''],
  min_links: ['Aday için en az köprü', 'kaç gen üzerinden bağlanmalı'],
  min_bc: ['Gen-ilaç bağı için en az makale', ''],
  min_lift: ['En az lift', 'birlikte geçiş beklenenin kaç katı olmalı'],
  w_mech: ['Mekanizma ağırlığı', '0 = hedef puanı kapalı'],
  propagate_direction: ['Yön türetme', 'yönü bilinmeyen genlerin yönünü komşulardan türet'],
  ctx_floor: ['Bağlam ağırlığı tabanı', "1 = kapalı; 0.25 = hastalık bağlamı dışındaki köprüler %25'e iner"],
  min_spec: ['Köprü gen özgüllüğü', 'genin hastalık literatüründeki payı / tüm literatürdeki payı; 0 = kapalı'],
  harm_penalty: ['Güvenlik cezası', 'hastalığı tetiklediği raporlanan ilaçların puan çarpanı; 1 = kapalı'],
};

export const STATUS: Record<string, [string, string]> = {
  yeni: ['Yeni', 'aday'],
  'literatürde anılmış': ['Anılmış', 'plain'],
  'tedavi olarak çalışılmış': ['Çalışılmış', 'known'],
};
export const STATUS_TITLE: Record<string, string> = {
  yeni: 'Hastalıkla hiç anılmamış; yalnızca genler üzerinden bulundu',
  'literatürde anılmış': 'Hastalıkla aynı makalede geçmiş',
  'tedavi olarak çalışılmış':
    'Makalelerde tedavi ilişkisi ya da klinik çalışma kaydı var (onaylı olduğu anlamına gelmez)',
};
export const KIND: Record<string, string> = {
  ilaç: '',
  'besin/takviye': 'besin/takviye',
  endojen: 'endojen',
  'tanı/yardımcı': 'tanı ajanı',
  'tanı yardımcısı': 'tanı ajanı',
};
export const DIR_TITLE: Record<string, string> = {
  tutarlı: 'gen hastalıkta artmış ve ilaç bu geni baskılıyor (ya da tersi)',
  ters: 'ilaç geni hastalık yönünde etkiliyor; alevlendirme riski olabilir',
  karışık: 'köprülerde çelişen yönler',
  bilinmiyor: 'yön çıkarmak için yeterli ilişki verisi yok',
};
export const DURUM: Record<string, [string, string]> = {
  'doğrudan kayıt yok (aday)': ['Yeni aday', 'aday'],
  'literatürde doğrudan geçiyor': ['Literatürde var', 'plain'],
  'klinik çalışma kaydı var': ['Klinik çalışması var', 'plain'],
};
export const TR: Record<string, string> = {
  consistent: 'tutarlı',
  opposite: 'ters',
  unknown: 'bilinmiyor',
  up: 'artmış',
  down: 'azalmış',
  mutated: 'yalnızca ilişki raporu var, yön verisi yok',
  inhibit: 'baskılıyor',
  activate: 'artırıyor',
};
export const SCHEME: Record<string, [string, string]> = {
  mentions: ['Literatürde ilk anılma', 'gürültülü ölçüt; yalnızca karşılaştırma için'],
  therapy: ['Tedavi makalesine girme', 'kesitten sonra tedavi odaklı makalelerde ilk kez görülen ilaçlar'],
  trials: ['Klinik çalışmaya girme', 'kesitten sonra bu hastalık için ilk klinik çalışmaya giren ilaçlar'],
  trials_novel: [
    'Hiç anılmadan klinik çalışmaya girme',
    'en katı ölçüt: kesit öncesi literatürde hiç yoktu; örnek sayısı azdır',
  ],
};
export const HARM: Record<string, [string, string]> = {
  'tetikleme sinyali': ['ters', 'İlacın hastalığı tetiklediği/alevlendirdiği raporlar baskın'],
  karışık: ['karışık', 'Hem tedavi hem tetikleme raporları var'],
  'tek tetikleme raporu': ['karışık', 'Tek bir tetikleme raporu'],
  'tedavi yönü': ['tutarlı', 'Raporlar tedavi yönünde'],
  yok: ['bilinmiyor', 'Hastalıkla doğrudan ilişki raporu yok'],
};
export const METRIC_NAME: Record<string, string> = {
  method: 'Literatür köprüsü (temel yöntem)',
  fused: 'Kullanılan sıralama',
  rrf: 'Kanal birleştirme',
  lit_only: 'Yalnız literatür',
  mech_only: 'Yalnız mekanizma',
  direct: 'Doğrudan anılma',
  recent: 'Son 5 yıl ilgisi',
  genetic: 'Genetik ilişki',
  biology: 'Biyolojik kanıt',
  network: 'Protein ağı yakınlığı',
  frequency: 'Sıklık (karşılaştırma)',
};
/** Benchmark'taki yöntem adları. */
export const METHOD_NAME: Record<string, string> = {
  base: 'Temel yöntem',
  rrf_core: 'Kanal birleştirme (literatür)',
  rrf_all: 'Kanal birleştirme (tüm kanallar)',
  logistic: 'Öğrenen birleştirme',
  frequency: 'Sıklık sıralaması',
  random: 'Rastgele',
};
export const FUSION_NAME: Record<string, string> = {
  base: 'temel yöntem puanı',
  rrf: 'kanal birleştirme (sıra tabanlı)',
  logistic: 'öğrenen birleştirme',
};
export const CONFIDENCE: Record<string, [string, string]> = {
  yüksek: ['tutarlı', 'Geriye dönük testte yöntem rastgeleden ve basit sıklık sıralamasından açıkça iyi'],
  orta: ['karışık', 'Yöntem rastgeleden iyi ama farkı sınırlı ya da örnek az'],
  düşük: ['ters', 'Bu hastalıkta yöntem basit sıralamalardan belirgin biçimde iyi değil; liste temkinle okunmalı'],
  ölçülemedi: ['bilinmiyor', 'Geriye dönük test yapılamadı ya da doğrulanan ilaç çok az'],
};
export const PNAME: Record<string, string> = {
  w_mech: 'mekanizma ağırlığı',
  min_lift: 'en az lift',
  propagate_direction: 'yön türetme',
  ctx_floor: 'bağlam tabanı',
  min_spec: 'özgüllük eşiği',
  harm_penalty: 'güvenlik cezası',
};
