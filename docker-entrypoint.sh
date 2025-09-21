set -e

echo "🔧 Prisma generate..."
npx prisma generate

echo "🗃️  Prisma migrate deploy..."
npx prisma migrate deploy

# Rode o seed se existir script configurado
if npm run | grep -q "db:seed"; then
  echo "🌱 Prisma db seed..."
  npm run db:seed
else
  # fallback padrão do Prisma (se tiver "prisma": { "seed": "node prisma/seed.js" })
  if [ -f "prisma/seed.js" ] || [ -f "prisma/seed.ts" ]; then
    echo "🌱 Prisma db seed (npx prisma db seed)..."
    npx prisma db seed
  else
    echo "⚠️  Seed não configurado (pulando)."
  fi
fi

echo "🚀 Start API..."
exec node dist/main.js
