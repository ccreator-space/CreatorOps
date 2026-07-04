# CreatorOps

Self-hostable content operations software for creators, communities, and small teams.

CreatorOps helps you plan social posts, collect community submissions, review content, assign workflows, and manage the people behind the process from one lightweight admin panel.

## Repository Description

Self-hostable content operations platform for planning social posts, reviewing content, managing community submissions, and coordinating creator workflows.

## Why This Exists

Many creator-led communities run their content workflow across chat apps, spreadsheets, forms, and ad-hoc review messages. CreatorOps brings those pieces into one open-source tool:

- a calendar for planned posts
- a review queue for approvals and revisions
- public submission forms for community series
- dynamic form builder for reusable submission flows
- media uploads for images and PDFs
- admin-managed users, roles, series, and branding

It is built to be forked, self-hosted, and customized.

## Features

- **Content calendar**: plan LinkedIn and Instagram posts by date and assignee.
- **Content review workflow**: approve, reject, request revisions, and resubmit content.
- **Media support**: upload and preview single images, multiple images, and PDFs.
- **Public submission forms**: collect builder stories, project highlights, book recommendations, or your own custom series.
- **Form builder**: create and edit form questions with text, textarea, range, media, URL, email, number, select, and checkbox fields.
- **Series management**: create custom content series and assign users to manage submissions.
- **User management**: create users, assign roles, deactivate/reactivate accounts, and generate login credentials.
- **Settings**: update profile details, upload avatars, and let admins replace the app logo.
- **Authentication**: password-based login with admin/user role guards.
- **Self-hostable stack**: PostgreSQL, Prisma, Express, React, Vite, and pnpm workspaces.

## Stack

- **Monorepo**: pnpm workspace
- **Frontend**: React, Vite, TypeScript
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL, Prisma
- **Uploads**: local filesystem storage

## Project Structure

```txt
apps/
  api/      Express API
  web/      React admin and public submission UI
packages/
  db/       Prisma schema, migrations, and database client
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

Copy `.env.example` to `.env` and update the values for your local setup.

Required values:

```txt
DATABASE_URL
AUTH_SECRET
API_PORT
WEB_ORIGIN
VITE_API_URL
```

### 3. Start PostgreSQL

If you are using the included Docker setup:

```bash
docker compose up -d postgres
```

### 4. Run migrations and generate Prisma Client

```bash
pnpm db:migrate
pnpm db:generate
```

### 5. Start development servers

```bash
pnpm dev
```

The web app runs on the Vite dev server, and the API runs on the configured `API_PORT`.

## Useful Scripts

```bash
pnpm dev          # Start API and web apps
pnpm typecheck    # Run TypeScript checks
pnpm build        # Build all packages/apps
pnpm test         # Run tests where available
pnpm db:migrate   # Run Prisma migrations
pnpm db:deploy    # Apply Prisma migrations in production
pnpm db:generate  # Generate Prisma Client
pnpm db:seed      # Seed local database
pnpm db:studio    # Open Prisma Studio
```

## Local Development Accounts

The seed file creates local demo accounts for development. You can update or replace them in:

```txt
packages/db/prisma/seed.sql
```

For production or public hosting, create your own admin user and rotate `AUTH_SECRET`.

## Branding and Settings

CreatorOps includes a settings area for self-hosted customization.

- Users can update their profile name and avatar.
- Admins can upload a custom site logo.
- If no custom logo is configured, the app falls back to the bundled default logo.

## Public Submission Forms

Public forms live under:

```txt
/submit/:slug
```

Admins can create and manage series, then edit the related public form questions from the form builder.

## Deployment Notes

CreatorOps ships with Docker files for production deployments:

```txt
Dockerfile.api
Dockerfile.web
docker-compose.prod.yml
deploy/nginx/default.conf
.env.production.example
```

The production compose setup runs:

- `postgres`: PostgreSQL database with a persistent Docker volume
- `api`: Express API, Prisma migrations, and local upload storage
- `web`: nginx serving the Vite build with React Router fallback

The web container proxies `/api/*` and `/uploads/*` to the API container, so a single public domain can serve the app.

### Required Production Environment

Copy `.env.production.example` and set strong values:

```txt
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
AUTH_SECRET
WEB_ORIGIN
VITE_API_URL
WEB_PORT
```

Recommended defaults:

```txt
VITE_API_URL=/api
WEB_PORT=3000
```

Set `WEB_ORIGIN` to the exact public URL of the web app, for example:

```txt
WEB_ORIGIN=https://creatorops.example.com
```

### Dokploy

Use the Docker Compose deployment flow and select:

```txt
docker-compose.prod.yml
```

Add the variables from `.env.production.example` in Dokploy before deploying.

Point your domain to the `web` service. The API should not need its own public domain when `VITE_API_URL=/api`.

### Production Checklist

- Use a long random `AUTH_SECRET`.
- Use a strong `POSTGRES_PASSWORD`.
- Keep `WEB_ORIGIN` equal to your real HTTPS web domain.
- Keep `VITE_API_URL=/api` unless you intentionally expose the API on a separate domain.
- Back up both `creatorops_postgres_data` and `creatorops_uploads`.
- Run `pnpm db:seed` only for local/demo data, not as a default production step.
- Create a real admin user after deployment and rotate any temporary credentials.

### First Admin User

The included seed file is intended for local demo data. For production, create your first admin user intentionally instead of running the demo seed by default. After the first admin exists, additional users can be created from the admin panel.

Uploads are currently stored on the local filesystem. If you deploy to a platform with ephemeral storage, replace the upload service with object storage such as S3, R2, or MinIO.

## Suggested Repository Name

```txt
creatorops
```

Alternative names:

- `creatorops-studio`
- `contentops`
- `open-content-studio`
- `social-workflow`

## License

Add a license before publishing the repository as open source. MIT is a good default for this kind of tool.
