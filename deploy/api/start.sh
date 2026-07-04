#!/bin/sh
set -eu

echo "Starting CreatorOps API container"
echo "Node: $(node --version)"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "AUTH_SECRET is required"
  exit 1
fi

if [ -z "${WEB_ORIGIN:-}" ]; then
  echo "WEB_ORIGIN is required"
  exit 1
fi

echo "Running Prisma migrations"
cd /app/packages/db
./node_modules/.bin/prisma migrate deploy

echo "Starting Express server"
cd /app
exec node apps/api/dist/index.js
