import { useState } from 'react';
import { Seg } from '@/shared/ui';
import { DEFAULT_FILTER, type UiFilter } from './filter';

const STATUS_OPTS = [
  { value: '', label: 'Tümü' },
  { value: 'yeni', label: 'Yeni' },
  { value: 'yeni,literatürde anılmış', label: 'Çalışılmamış' },
  { value: 'tedavi olarak çalışılmış', label: 'Çalışılmış' },
];

export function FilterBar({
  value,
  onChange,
  count,
}: {
  value: UiFilter;
  onChange: (f: UiFilter) => void;
  count: number;
}) {
  const [more, setMore] = useState(false);
  const set = (k: keyof UiFilter) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <>
      <div className="filterbar">
        <label className="field grow">
          <span>Ara</span>
          <input type="search" value={value.q} onChange={set('q')} placeholder="İlaç adı, gen veya hedef" />
        </label>
        <div className="field">
          <span>Yenilik</span>
          <Seg
            value={value.status}
            options={STATUS_OPTS}
            onChange={(status) => onChange({ ...value, status })}
            label="Yenilik"
          />
        </div>
        <label className="field">
          <span>Mekanizma uyumu</span>
          <select value={value.direction} onChange={set('direction')}>
            <option value="">Tümü</option>
            <option value="tutarlı">Tutarlı</option>
            <option value="ters">Ters</option>
            <option value="karışık">Karışık</option>
            <option value="bilinmiyor">Bilinmiyor</option>
          </select>
        </label>
        <button type="button" className="btn icon" onClick={() => setMore(!more)}>
          {more ? 'Süzgeçleri gizle' : 'Daha fazla süzgeç'}
        </button>
        <span className="count">{count ? `${count} aday` : ''}</span>
      </div>
      {more && (
        <div className="filterbar more">
          <label className="field">
            <span>Zarar raporu</span>
            <select value={value.harm} onChange={set('harm')}>
              <option value="">Tümü</option>
              <option value="tedavi yönü,yok">Tetikleme raporu yok</option>
              <option value="tetikleme sinyali,karışık,tek tetikleme raporu">Tetikleme raporu var</option>
            </select>
          </label>
          <label className="field">
            <span>Sınıf</span>
            <select value={value.kind} onChange={set('kind')}>
              <option value="">İlaç + besin/takviye</option>
              <option value="ilaç">Yalnızca ilaç</option>
              <option value="besin/takviye">Yalnızca besin/takviye</option>
              <option value="endojen">Endojen moleküller</option>
              <option value="ilaç,besin/takviye,endojen">Hepsi</option>
            </select>
          </label>
          <label className="field">
            <span>Yenilik kontrolü</span>
            <select value={value.durum} onChange={set('durum')}>
              <option value="">Tümü</option>
              <option value="doğrudan kayıt yok (aday)">Kayıt yok</option>
              <option value="literatürde doğrudan geçiyor">Literatürde var</option>
              <option value="klinik çalışma kaydı var">Klinik çalışması var</option>
            </select>
          </label>
          <label className="field">
            <span>Klinik faz</span>
            <select value={value.phase} onChange={set('phase')}>
              <option value="">Tümü</option>
              <option value="4">Onaylı ilaçlar</option>
              <option value="3">Faz 3 ve üstü</option>
              <option value="2">Faz 2 ve üstü</option>
              <option value="1">Faz 1 ve üstü</option>
            </select>
          </label>
          <label className="field">
            <span>Sıralama</span>
            <select value={value.sort} onChange={set('sort')}>
              <option value="score">Bağlantı gücü</option>
              <option value="lit_score">Yalnız literatür</option>
              <option value="mech_score">Yalnız hedef</option>
              <option value="max_phase">Klinik faz</option>
              <option value="n_direct_a">Hastalıkla anılma</option>
              <option value="chemical">Ada göre</option>
            </select>
          </label>
          <button type="button" className="btn icon" onClick={() => onChange(DEFAULT_FILTER)}>
            Süzgeçleri temizle
          </button>
        </div>
      )}
    </>
  );
}
