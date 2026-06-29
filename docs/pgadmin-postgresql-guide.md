# PostgreSQL ve pgAdmin Rehberi

Bu projede PostgreSQL lokal olarak Docker Compose ile açılır. pgAdmin ise veritabanını görmek, tablo yapısını incelemek ve SQL çalıştırmak için kullanılır.

## 1. Servisleri aç

Terminalde proje kökünde çalıştır:

```bash
docker compose up -d postgres pgadmin
```

Bu iki servis açılır:

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

pgAdmin girişi:

- Email: `admin@shipin.local`
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

Not: Projedeki Docker pgAdmin servisini kullanırken host `postgres` olmalı. Bilgisayarına kurulu pgAdmin Desktop kullanıyorsan host `localhost` olmalı.

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

## 6. Faz 1'de nasıl ilerliyoruz?

Faz 1 için amacımız önce rol davranışını doğru kurmak:

- Admin tüm kullanıcıları görebilir
- Normal kullanıcı sadece kendini görebilir
- Admin sidebar'da `İçerikler` sayfasını görebilir
- Normal kullanıcı sidebar'da `Revizeler` sayfasını görebilir
- API geçici olarak `x-user-id` header'ı ile kullanıcı seçer

Frontend'deki `Mock login` select'i bu davranışı test etmek içindir. Gerçek login gelince bu select kaldırılacak ve aynı rol mantığı auth sistemiyle çalışacak.
