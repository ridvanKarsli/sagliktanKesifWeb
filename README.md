# Sağlıktan Keşif — Frontend

Literatür tabanlı ilaç yeniden konumlandırma platformunun arayüzü. React 18 + TypeScript (strict) + Vite. Backend
(Sağlıktan Keşif — Backend reposu) ayrı bir projedir; bu arayüz onunla yalnızca REST API (`/api/v1`) üzerinden konuşur.

## Çalıştırma

Önce backend çalışıyor olmalı (backend reposunda `kesif api`, http://127.0.0.1:8000). Sonra ayrı bir terminalde:

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:5173 açılır. Giriş bilgileri backend'in `.env` dosyasındaki ilk yönetici hesabıdır.
`ECONNREFUSED 127.0.0.1:8000` hatası backend'in kapalı olduğu anlamına gelir.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm install` | bağımlılıklar |
| `npm run dev` | geliştirme sunucusu, http://localhost:5173 (`/api` istekleri 127.0.0.1:8000'e yönlenir) |
| `npm run build` | tip denetimi + üretim derlemesi (`dist/`) |
| `npm run preview` | derlenmiş sürümü yerelde sunar (yine `/api` proxy'li) |
| `npm run lint` / `npm run typecheck` / `npm run format` | ESLint / tsc / Prettier |

Ortam: `.env.example` → `.env` (`VITE_API_BASE`, varsayılan `/api/v1`).

## Yapı

```
src/
  app/            uygulama kabuğu: router, sağlayıcılar (React Query, bildirimler), düzen (üst çubuk)
  entities/       API şemalarının TypeScript karşılıkları (Disease, Run, Candidate, User, …)
  shared/
    api/          fetch sarmalayıcı (Bearer, 401'de bir kez yenileme, hata zarfı → ApiError), dosya indirme
    ui/           küçük, bağımsız bileşenler: Button, Seg, Meter, Q (?), Tag, Toast, Drawer, Tabs, Banner
    lib/          biçimlendirme, etiket sözlükleri (adım adları, sütun açıklamaları), küçük hook'lar
  features/
    auth/         oturum deposu (zustand), giriş sayfası, yetki koruması (RequireAuth), rol hook'ları
    diseases/     ana sayfa (kartlar, karşılaştırma tablosu, kaynak kontrolü), hastalık sayfası, sade özet
    candidates/   aday tablosu, süzgeç çubuğu, kanıt paneli, bilinen tedaviler, köprü genler, güvenilirlik
    runs/         analiz işleri: canlı izleme (useLiveRuns), analiz kutusu, ayarlar sekmesi (parametre/adım/ayar)
    discovery/    keşif özeti sekmesi
    catalog/      hastalık ekleme diyaloğu (sözlük arama, kategori, makale sayısı)
    users/        yönetici: kullanıcı listesi, açma, rol, pasife alma
  styles/         tek küresel stil dosyası (Sağlıktan tasarım dili; koyu/açık tema sistem tercihine göre)
```

Kurallar: `features/*` birbirine yalnızca hook/API üzerinden bağlanır; `shared/` ve `entities/` hiçbir feature'ı içe aktarmaz; sunucu adresi ve
teknoloji adları arayüzde geçmez (genel adlar: "Makale veritabanı", "İlaç veritabanı", "Klinik çalışma kayıtları").

## Canlı güncelleme

Sayfa yenilemeye gerek yoktur. `useLiveRuns` tüm işleri izler: aktif iş varken 4 sn, yoksa 15 sn'de bir sorgular; bir işin durumu
değişince ilgili hastalığın sorgularını yeniler ve bildirim gösterir. Hastalık listesi/detayı da aynı kurala göre yenilenir.

## Kimlik

`GET /health` yanıtındaki `auth_mode`:
- `local`: e-posta + parola ile giriş; erişim belirteci bellekte, yenileme belirteci `localStorage`'da (`sk_refresh`); 401'de bir kez yenilenir.
- `oidc`: giriş kurumsal kimlik sağlayıcıdan; bu arayüz yalnızca belirteci kullanır.
- `disabled`: giriş ekranı atlanır (yerel geliştirme).

Rol: `viewer` yalnızca okur; `analyst` hastalık ekler, analiz başlatır/iptal eder, ayar değiştirir; `admin` kullanıcı yönetir ve veriyi kalıcı siler.
Düğmeler role göre gizlenir; asıl denetim sunucudadır.

## Docker

`Dockerfile` iki aşamalıdır: Node ile derler, Nginx ile sunar. Nginx `/api/` isteklerini `api:8000` servisine yönlendirir ve SPA yolları için
`index.html` döner (`nginx.conf`). Tüm sistemi ayağa kaldıran Docker Compose dosyası backend reposundadır; bu imajı
`../frontend` yolundan (ya da `FRONTEND_CONTEXT`) derler.

## Kalite

`npm run lint` ve `npm run build` (TypeScript strict) temiz olmalıdır; CI (`.github/workflows/ci.yml`) her push'ta ikisini
ve Docker imaj derlemesini çalıştırır.
