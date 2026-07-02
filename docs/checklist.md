# Shipin Social Content Calendar - Checklist

## Proje iskeleti

- [x] Monorepo kök dosyaları oluşturuldu
- [x] React app klasörü oluşturuldu
- [x] Express API klasörü oluşturuldu
- [x] PostgreSQL/Prisma paket klasörü oluşturuldu
- [x] Docker Compose PostgreSQL servisi eklendi
- [x] Docker Compose pgAdmin servisi eklendi
- [x] Örnek environment dosyası eklendi
- [x] Tailwind CSS 4 Vite entegrasyonu eklendi

## Frontend

- [x] Sidebar başlangıç yapısı eklendi
- [x] Takvim sayfası başlangıç görünümü eklendi
- [x] Avatar alanı eklendi
- [x] Yeni ekle sheet formu eklendi
- [x] Sheet formuna tarih ve kullanıcı seçimi eklendi
- [x] Drag/drop sonrası sheet tarih ve kullanıcı dolu açılıyor
- [x] Seçili gün sonrası yeni ekle sheet'i tarih dolu açılıyor
- [x] Faz 1 mock login selector eklendi
- [x] Faz 5 basit giriş ekranı eklendi
- [x] Faz 5 çıkış aksiyonu eklendi
- [x] Sidebar oturum bilgisine göre güncellendi
- [x] Faz 1 role göre sidebar görünürlüğü eklendi
- [x] Faz 1 role göre avatar listesi filtrelendi
- [x] Gerçek drag and drop davranışı
- [x] Takvim atamaları için API bağlantıları
- [x] Admin içerikler sayfasını route'a bağlama
- [x] Kullanıcı revizeler sayfasını route'a bağlama
- [x] Admin içerikler sayfasını API'ye bağlama
- [x] Admin içerikler sayfasına durum filtresi ekleme
- [x] Kullanıcı revizeler sayfasını API'ye bağlama

## Backend

- [x] Express app başlangıcı eklendi
- [x] Health endpoint eklendi
- [x] Users endpoint başlangıcı eklendi
- [x] Posts endpoint başlangıcı eklendi
- [x] Faz 1 geçici kullanıcı context middleware eklendi
- [x] Faz 1 role göre users/posts filtreleme eklendi
- [x] Takvim atamaları endpointleri eklendi
- [x] Takvim atamaları için Prisma bağlantısı kullanıldı
- [x] Posts servisinde Prisma bağlantısı kullanıldı
- [ ] Users servisinde Prisma bağlantısını kullanma
- [ ] Auth middleware
- [ ] Role-based access control
- [x] Review action endpointleri
- [x] Review event kaydı
- [x] Kullanıcı revizyon tekrar gönderme endpointi

## Database

- [x] User modeli eklendi
- [x] CalendarAssignment modeli eklendi
- [x] SocialPost modeli eklendi
- [x] ReviewEvent modeli eklendi
- [x] pgAdmin lokal kullanım rehberi eklendi
- [x] Örnek kullanıcı seed SQL'i eklendi
- [x] İlk migration oluşturma
- [ ] Seed script

## Planlanan akışlar

- [x] Admin tüm avatarları takvime sürükleyebilecek
- [x] Kullanıcı sadece kendi avatarını takvime sürükleyebilecek
- [x] Takvim atamaları PostgreSQL'e kaydedilebilecek
- [x] Seçili güne içerik oluşturulabilecek
- [x] İçerik pending_review durumuyla PostgreSQL'e kaydedilebilecek
- [x] Admin içeriği approve edebilecek
- [x] Admin içeriği reject edebilecek
- [x] Admin revize isteyebilecek
- [x] Admin review event kaydı oluşturabilecek
- [x] Kullanıcı revize edilen içeriği düzenleyebilecek
- [x] Kullanıcı içeriği tekrar onaya gönderebilecek
