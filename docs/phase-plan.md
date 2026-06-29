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

