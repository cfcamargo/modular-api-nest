set -e

echo "🔧 Prisma generate..."
pnpm prisma generate

echo "🗃️  Prisma migrate deploy..."
pnpm prisma migrate deploy

# Seed, se configurado
if pnpm -s run | grep -q "db:seed"; then
  echo "🌱 Prisma db seed (npm script db:seed)..."
  pnpm run db:seed
else
  if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Prisma db seed (prisma db seed)..."
    pnpm prisma db seed
  else
    echo "⚠️  Seed não configurado - pulando."
  fi
fi

echo "🚀 Start API..."
exec node dist/main.js
