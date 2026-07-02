# Shipin Social Content Calendar

Shipin topluluğunun sosyal medya içerik planlama ve onay akışı için monorepo başlangıç projesi.

## Stack

- Monorepo: pnpm workspace
- Frontend: React + Vite + TypeScript
- Backend: Express.js + TypeScript
- Database: PostgreSQL + Prisma

## Klasörler

- `apps/web`: React arayüzü
- `apps/api`: Express API
- `packages/db`: Prisma şeması ve veritabanı istemcisi
- `docs/phase-plan.md`: faz bazlı geliştirme planı
- `docs/checklist.md`: uygulanacak işlerin checklist'i

## İlk Kurulum

```bash
pnpm install
pnpm db:generate
pnpm dev
```

PostgreSQL için:

```bash
docker compose up -d postgres
```

`.env.example` dosyasını `.env` olarak kopyalayıp bağlantı değerlerini doldurun.

## Lokal Giriş

Seed kullanıcılarının geliştirme şifresi:

```text
shipin123
```

- `deniz@shipin.local`: admin
- `ece@shipin.local`: user
- `mert@shipin.local`: user

## Production Hazırlığı

Build kontrolü:

```bash
pnpm typecheck
pnpm test
pnpm build
```

API için gerekli environment değerleri:

```text
DATABASE_URL
AUTH_SECRET
API_PORT
WEB_ORIGIN
```

Frontend build sırasında gereken değer:

```text
VITE_API_URL
```
