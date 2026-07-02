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
- [x] E-posta ve şifre ile gerçek login ekranı eklendi
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
- [x] Bearer token auth middleware
- [x] Role-based access control
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
- [x] Password hash migration
- [x] Seed script

## Kalite ve ürünleştirme

- [x] Form validasyonları
- [x] API hata formatı başlangıcı
- [x] Loading ve empty state'ler
- [x] Typecheck doğrulaması
- [x] Seed data
- [x] Temel testler
- [x] Production build doğrulaması
- [x] Deployment hazırlığı

## Medya upload simülasyonu

- [x] PostAttachment modeli eklendi
- [x] Attachment migration uygulandı
- [x] Multipart upload endpoint desteği eklendi
- [x] Lokal upload klasörü ve static serving eklendi
- [x] Görsel sıkıştırma helper'ı eklendi
- [x] PDF upload simülasyonu eklendi
- [x] Sheet formuna tekli/çoklu medya seçimi eklendi
- [x] Admin içerikler tablosunda medya kolonu eklendi
- [x] Medya preview modalı eklendi
- [x] Revizeler tablosunda medya görüntüleme eklendi
- [x] PDF ve çoklu görseller için carousel preview eklendi
- [x] Sheet içinde seçilen medya kaydetmeden önce önizlenebilir hale getirildi

## Kullanıcı içerik yönetimi

- [x] Normal kullanıcı için İçerikler sayfası açıldı
- [x] İçerikler sayfasından yeni içerik ekleme eklendi
- [x] ContentSheet create/edit ortak formuna dönüştürüldü
- [x] Kullanıcı kendi içeriğini güncelleyebiliyor
- [x] Kullanıcı kendi içeriğini silebiliyor
- [x] Backend post update endpointi eklendi
- [x] Backend post delete endpointi eklendi
- [x] Update sırasında mevcut medya koruma/silme/yeni medya ekleme desteklendi
- [x] Takvim gerçek postları ay filtresiyle çekiyor
- [x] Aynı kullanıcı aynı gün birden fazla post attığında çoklu post görünümü gösteriliyor

## Topluluk başvuru formları

- [x] Submission modelleri eklendi
- [x] Submission migration uygulandı
- [x] Public submission endpointi eklendi
- [x] Builder Spotlight formu eklendi
- [x] Project Highlight formu eklendi
- [x] README kitap önerisi formu eklendi
- [x] Public formda görsel/PDF upload ve preview eklendi
- [x] Başvurular panel sayfası eklendi
- [x] Admin tüm başvuruları görebiliyor
- [x] Normal kullanıcı atanmış seri başvurularını görebiliyor
- [x] Başvuru detay modalı eklendi
- [x] Başvuru status güncelleme eklendi
- [x] Admin için tekil başvuru atama eklendi
- [x] Admin için seri atama ekranı eklendi

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
