#!/usr/bin/env bash
set -e

echo "🔧 Prisma generate..."
pnpm prisma generate

echo "🗃️  Prisma migrate deploy..."
pnpm prisma migrate deploy

# if pnpm -s run | grep -q "db:seed"; then
#   echo "🌱 Prisma db seed (npm script db:seed)..."
#   pnpm run db:seed
# elif [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
#   echo "🌱 Prisma db seed..."
#   pnpm prisma db seed
# else
#   echo "⚠️  Seed não configurado - pulando."
# fi

echo "🚀 Start API..."
exec node dist/src/main.js
