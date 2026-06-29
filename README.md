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

