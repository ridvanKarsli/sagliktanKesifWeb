import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from './api';
import { diseasesApi } from '@/features/diseases/api';
import { diseaseKeys, useDiseases } from '@/features/diseases/hooks';
import { runsApi } from '@/features/runs/api';
import { runKeys } from '@/features/runs/hooks';
import { ALL_STEPS } from '@/shared/lib/labels';
import { useDebounced } from '@/shared/lib/hooks';
import { errorMessage } from '@/shared/api/errors';
import { Button, Spinner } from '@/shared/ui';
import type { CatalogItem } from '@/entities';
import { fmtInt } from '@/shared/lib/format';

interface DlgState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAddDisease = create<DlgState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

/** Hastalık sözlüğü (katalog) durumu; kurulum sürerken 2 sn'de bir yenilenir. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogStatus(enabled = true) {
  return useQuery({
    queryKey: ['catalog', 'status'],
    queryFn: catalogApi.status,
    enabled,
    refetchInterval: (q) =>
      q.state.data && !q.state.data.ready && q.state.data.build?.status === 'running' ? 2000 : false,
  });
}

export function AddDiseaseDialog() {
  const { isOpen, close } = useAddDisease();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);
  return (
    <dialog ref={ref} onClose={close} onCancel={close}>
      {isOpen && <DialogBody onClose={close} />}
    </dialog>
  );
}

function DialogBody({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const status = useCatalogStatus();
  const build = useMutation({
    mutationFn: catalogApi.build,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'status'] }),
  });
  const autoStarted = useRef(false);
  useEffect(() => {
    const s = status.data;
    if (!s || s.ready || autoStarted.current) return;
    const b = s.build?.status;
    if (b !== 'running' && b !== 'failed') {
      autoStarted.current = true;
      build.mutate();
    }
  }, [status.data, build]);

  return (
    <div className="dlg">
      <div className="dlg-head">
        <h2>Hastalık ekle</h2>
        <button type="button" className="btn icon" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
      </div>
      {status.isLoading && <div className="hint">Durum alınıyor…</div>}
      {status.data && !status.data.ready && (
        <div className="setup">
          <div className={`setup-icon ${status.data.build?.status === 'failed' ? 'err' : ''}`}>
            {status.data.build?.status === 'failed' ? '!' : <Spinner />}
          </div>
          <div>
            <div className="setup-title">
              {status.data.build?.status === 'failed' ? 'Katalog indirilemedi' : 'Hastalık kataloğu hazırlanıyor'}
            </div>
            <p className="setup-text">
              Hastalıklar, uluslararası hastalık sözlüğünden (yaklaşık 5.000 hastalık) seçilir. Katalog{' '}
              <b>ilk kullanımda bir kez</b> indirilir; bu 1-3 dakika sürer ve sonra bir daha gerekmez.
            </p>
            <div className={`setup-stage ${status.data.build?.status === 'failed' ? 'err' : ''}`}>
              {status.data.build?.status === 'failed'
                ? `${status.data.build.error || 'Bilinmeyen hata'}. İnternet bağlantınızı kontrol edip tekrar deneyin.`
                : status.data.build?.stage || 'Başlıyor…'}
            </div>
            {status.data.build?.status === 'failed' && (
              <Button variant="primary" onClick={() => build.mutate()}>
                Tekrar dene
              </Button>
            )}
          </div>
        </div>
      )}
      {status.data?.ready && <Picker onClose={onClose} />}
    </div>
  );
}

function Picker({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sel, setSel] = useState<CatalogItem | null>(null);
  const [label, setLabel] = useState('');
  const [err, setErr] = useState('');
  const dq = useDebounced(q, 200);
  const list = useQuery({
    queryKey: ['catalog', 'list', dq, category],
    queryFn: () => catalogApi.list(dq, category, 300),
  });
  const count = useQuery({
    queryKey: ['catalog', 'count', sel?.mesh_id],
    queryFn: () => catalogApi.count(sel!.term, sel!.entries),
    enabled: !!sel,
    staleTime: Infinity,
  });
  const diseases = useDiseases();
  const nav = useNavigate();
  const qc = useQueryClient();
  const added = sel?.added_key ? diseases.data?.find((d) => d.key === sel.added_key) : null;

  const save = useMutation({
    mutationFn: async (run: boolean) => {
      const x = sel!;
      const d = await diseasesApi.create({
        key: x.term,
        label: label.trim() || x.term,
        name_en: x.term,
        mesh_id: x.mesh_id,
        mesh_term: x.term,
        pubmed_query: x.pubmed_query,
      });
      if (run) await runsApi.start(d.key, { steps: ALL_STEPS });
      return d;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: diseaseKeys.all });
      qc.invalidateQueries({ queryKey: runKeys.all });
      onClose();
      nav(`/d/${d.key}`);
    },
    onError: (e) => setErr(errorMessage(e)),
  });

  const pick = (x: CatalogItem) => {
    setSel(x);
    setLabel(x.term);
    setErr('');
  };

  return (
    <>
      <label className="field">
        <span>Listede ara (Türkçe karakter fark etmez: behçet, behcet, Behçet hastalığı)</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="İngilizce tıbbi ad, örn. retinitis pigmentosa"
          autoComplete="off"
          autoFocus
        />
      </label>
      <div className="picker">
        <div className="picker-cats">
          <button type="button" className={`cat ${category ? '' : 'on'}`} onClick={() => setCategory('')}>
            Tüm kategoriler
          </button>
          {list.data?.categories.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`cat ${category === c.code ? 'on' : ''}`}
              onClick={() => setCategory(c.code)}
            >
              {c.name}
              <span>{c.n}</span>
            </button>
          ))}
        </div>
        <div className="picker-list">
          <div className="picker-count">
            {list.data?.total
              ? `${list.data.total} hastalık${list.data.total > list.data.items.length ? `, ilk ${list.data.items.length} gösteriliyor; daraltmak için arayın` : ''}`
              : ''}
          </div>
          <div className="matches">
            {list.error && <div className="hint err">{errorMessage(list.error)}</div>}
            {list.data && list.data.items.length === 0 && (
              <div className="hint">
                Eşleşme yok. İngilizce tıbbi adı deneyin (ör. "retinitis pigmentosa", "lupus", "psoriasis").
              </div>
            )}
            {list.data?.items.map((x) => (
              <button
                key={x.mesh_id}
                type="button"
                className={`match ${x.added_key ? 'added' : ''} ${sel?.mesh_id === x.mesh_id ? 'on' : ''}`}
                onClick={() => pick(x)}
              >
                <span>
                  <b>{x.term}</b>
                  {x.entries.length > 0 && <div className="m-sub">{x.entries.slice(0, 3).join(', ')}</div>}
                </span>
                {x.added_key ? (
                  <span className="m-added">zaten ekli</span>
                ) : (
                  <span className="m-sub">{x.categories.join(', ')}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {sel && (
        <div className="selected">
          <div className="selected-head">
            <b>{sel.term}</b>
            <span>{sel.mesh_id}</span>
            <span className="pubmed-count">
              {count.isLoading
                ? 'Makale sayılıyor…'
                : count.data
                  ? `Literatürde ${fmtInt(count.data.count)} makale`
                  : count.isError
                    ? 'Makale sayısı alınamadı'
                    : ''}
            </span>
          </div>
          {sel.entries.length > 0 && <div className="hint">Eş adlar: {sel.entries.join(', ')}</div>}
          {!added && (
            <label className="field">
              <span>Görünen ad (listede böyle görünür)</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} />
            </label>
          )}
          <div className="row">
            {added ? (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  nav(`/d/${added.key}`);
                }}
              >
                Aç
              </Button>
            ) : (
              <>
                <Button variant="primary" disabled={save.isPending} onClick={() => save.mutate(false)}>
                  Ekle
                </Button>
                <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate(true)}>
                  Ekle ve analizi başlat
                </Button>
              </>
            )}
          </div>
          {err && <div className="hint err">{err}</div>}
        </div>
      )}
    </>
  );
}
