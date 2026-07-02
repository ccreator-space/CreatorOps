# Shipin Social Content Calendar - Faz Bazlı Plan

## Faz 0 - Proje iskeleti

Amaç: React, Express.js ve PostgreSQL tabanlı monorepo başlangıcını netleştirmek.

- pnpm workspace kurulumu
- `apps/web`, `apps/api`, `packages/db` ayrımı
- PostgreSQL için Prisma şeması
- Docker Compose ile lokal veritabanı
- Temel README ve ortam değişkenleri

## Faz 1 - Kimlik ve rol modeli

Amaç: Admin ve normal kullanıcı deneyimini ayıracak temel yetki modelini kurmak.

- Kullanıcı modeli: admin, user
- Geçici/mock login veya basit auth ekranı
- API tarafında role göre veri filtreleme
- Frontend route ve sidebar görünürlüğü
- pgAdmin ile lokal veritabanı inceleme akışı

## Faz 2 - Takvim ve avatar planlama

Amaç: Takvim üzerinden kullanıcı atama akışını çalışır hale getirmek.

- Aylık takvim görünümü
- Sağ üstte kullanıcı avatarları
- Admin için tüm avatarlar
- Kullanıcı için sadece kendi avatarı
- Avatar sürükle-bırak ile güne atama
- Atamaların PostgreSQL'e kaydı

## Faz 3 - Yeni içerik sheet formu

Amaç: Seçili güne içerik oluşturma akışını kurmak.

- Gün seçimi
- Yeni ekle butonu
- Sağdan açılan sheet
- Platform select: LinkedIn, Instagram
- Başlık ve content alanları
- İçeriğin `pending_review` durumuyla kaydedilmesi

## Faz 4 - Admin içerik onay ekranı

Amaç: Onay sorumlusunun içerikleri yönetebilmesini sağlamak.

- Admin sidebar'da `İçerikler`
- Liste görünümü
- Approve, reject ve revize aksiyonları
- Revize notu
- Review event kaydı
- Duruma göre filtreleme

## Faz 5 - Kullanıcı revizyon ekranı

Amaç: Normal kullanıcının revize istenen içerikleri düzeltmesini sağlamak.

- Basit giriş ekranı
- E-posta ve şifre ile giriş yapma
- Token tabanlı korumalı API istekleri
- Sidebar'da oturum bilgisi ve çıkış aksiyonu
- Kullanıcı sidebar'da `Revizeler`
- Revize istenen içerik listesi
- Düzenle icon butonu
- İçeriği doğrudan düzenleme
- Tekrar onaya gönderme

## Faz 6 - Ürünleştirme ve kalite

Amaç: İlk kullanılabilir sürümü güvenilir hale getirmek.

- Form validasyonları
- API hata formatı
- Loading ve empty state'ler
- Temel testler
- Seed data
- Deployment hazırlığı

## Faz 7 - Medya upload simülasyonu

Amaç: İçeriklere görsel ve PDF ekleme akışını lokal storage ile simüle etmek.

- Tekli ve çoklu görsel seçimi
- Browser tarafında görsel boyut düşürme
- PDF seçimi
- Attachment metadata kaydı
- Lokal upload klasörü ve static serving
- Admin içerik tablosunda medya görüntüleme
- Revizyon tablosunda medya görüntüleme

## Faz 8 - Kullanıcı içerik yönetimi

Amaç: İçerik sahibinin kendi gönderilerini takvim dışında da yönetebilmesini sağlamak.

- Kullanıcı için `İçerikler` sayfası
- İçerikler sayfasından yeni içerik ekleme
- İçerik sahibinin kendi postunu güncellemesi
- İçerik sahibinin kendi postunu silmesi
- Admin için mevcut review aksiyonlarını koruma
- Ortak create/edit sheet formu
- Mevcut medya koruma, silme ve yeni medya ekleme
- Takvimde gerçek postları gösterme
- Aynı gün aynı kullanıcıdan çoklu post görünümü

## Faz 9 - Topluluk başvuru formları

Amaç: Admin panele erişemeyen topluluk üyelerinin seri başvurularını public form üzerinden göndermesini sağlamak.

- Login gerektirmeyen public submission sayfası
- React Router ile gerçek route yapısı
- Ayrı public form pathleri: `/submit/builder-spotlight`, `/submit/project-highlight`, `/submit/readme-book`
- Builder Spotlight formu
- Project Highlight formu
- README kitap önerisi formu
- Fotoğraf/PDF upload ve preview
- Submission ve SubmissionAttachment modelleri
- Seri bazlı kullanıcı atamaları
- Admin için tüm başvuruları görme
- Normal kullanıcı için atanmış seri başvurularını görme
- Başvuru detay modalı
- Başvuru status yönetimi
- Admin için seri atama ekranı
