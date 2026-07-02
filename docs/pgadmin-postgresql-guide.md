# PostgreSQL ve pgAdmin Rehberi

Bu projede PostgreSQL lokal olarak Docker Compose ile açılır. pgAdmin ise veritabanını görmek, tablo yapısını incelemek ve SQL çalıştırmak için kullanılır.

## 1. Servisleri aç

Terminalde proje kökünde çalıştır:

```bash
docker compose up -d postgres pgadmin
```

Bu iki servis açılır:

- PostgreSQL: `localhost:5433`
- pgAdmin: `http://localhost:5050`

pgAdmin girişi:

- Email: `admin@shipinapp.com`
- Password: `shipin`

## 2. pgAdmin içinde server ekle

pgAdmin ilk açıldığında solda `Servers` alanına sağ tıkla:

1. `Register > Server...`
2. `General` sekmesi:
   - Name: `Shipin Local`
3. `Connection` sekmesi:
   - Host name/address: `postgres`
   - Port: `5432`
   - Maintenance database: `shipin_social`
   - Username: `shipin`
   - Password: `shipin`
   - Save password: açık
4. `Save`

Not: Projedeki Docker pgAdmin servisini kullanırken host `postgres`, port `5432` olmalı. Bilgisayarına kurulu pgAdmin Desktop kullanıyorsan host `localhost`, port `5433` olmalı.

## 3. Tabloları oluştur

Prisma şemasından PostgreSQL tabloları oluşturmak için:

```bash
pnpm db:migrate
```

Migration adı sorarsa şunu yazabilirsin:

```text
init_identity_calendar_content
```

Bu komut `packages/db/prisma/schema.prisma` dosyasındaki modellerden tablolar üretir.

## 4. Örnek kullanıcıları ekle

pgAdmin'de:

1. Soldan `Shipin Local > Databases > shipin_social` üzerine gel
2. `Query Tool` aç
3. `packages/db/prisma/seed.sql` dosyasındaki SQL'i çalıştır

Bu kullanıcılar eklenir:

- `Deniz Kara`: admin
- `Ece Yılmaz`: user
- `Mert Şahin`: user

## 5. Veriyi kontrol et

pgAdmin Query Tool içinde:

```sql
select id, name, email, role from "User";
```

Beklenen sonuç: 3 kullanıcı listelenmeli.

## 6. Auth akışı

Projede giriş ekranı e-posta ve şifre ile çalışır. Seed kullanıcılarının lokal geliştirme şifresi:

```text
shipin123
```

Örnek kullanıcılar:

- `deniz@shipin.local`: admin
- `ece@shipin.local`: user
- `mert@shipin.local`: user

Giriş başarılı olduğunda frontend token alır ve korumalı API isteklerini `Authorization: Bearer <token>` header'ı ile yapar.

- Admin tüm kullanıcıları görebilir
- Normal kullanıcı sadece kendini görebilir
- Admin sidebar'da `İçerikler` sayfasını görebilir
- Normal kullanıcı sidebar'da `Revizeler` sayfasını görebilir
