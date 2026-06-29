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
- [x] Faz 1 mock login selector eklendi
- [x] Faz 1 role göre sidebar görünürlüğü eklendi
- [x] Faz 1 role göre avatar listesi filtrelendi
- [ ] Gerçek drag and drop davranışı
- [ ] API bağlantıları
- [ ] Admin içerikler sayfasını route'a bağlama
- [ ] Kullanıcı revizeler sayfasını route'a bağlama

## Backend

- [x] Express app başlangıcı eklendi
- [x] Health endpoint eklendi
- [x] Users endpoint başlangıcı eklendi
- [x] Posts endpoint başlangıcı eklendi
- [x] Faz 1 geçici kullanıcı context middleware eklendi
- [x] Faz 1 role göre users/posts filtreleme eklendi
- [ ] Prisma bağlantısını gerçek servislerde kullanma
- [ ] Auth middleware
- [ ] Role-based access control
- [ ] Review action endpointleri

## Database

- [x] User modeli eklendi
- [x] CalendarAssignment modeli eklendi
- [x] SocialPost modeli eklendi
- [x] ReviewEvent modeli eklendi
- [x] pgAdmin lokal kullanım rehberi eklendi
- [x] Örnek kullanıcı seed SQL'i eklendi
- [ ] İlk migration oluşturma
- [ ] Seed script

## Planlanan akışlar

- [ ] Admin tüm avatarları takvime sürükleyebilecek
- [ ] Kullanıcı sadece kendi avatarını takvime sürükleyebilecek
- [ ] Seçili güne içerik oluşturulabilecek
- [ ] Admin içeriği approve edebilecek
- [ ] Admin içeriği reject edebilecek
- [ ] Admin revize isteyebilecek
- [ ] Kullanıcı revize edilen içeriği düzenleyebilecek
- [ ] Kullanıcı içeriği tekrar onaya gönderebilecek
