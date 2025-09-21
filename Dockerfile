# ============== Builder ==============
FROM node:22-slim AS builder
WORKDIR /app

# Habilita pnpm via Corepack (vem no Node 22)
RUN corepack enable

# Copia manifests primeiro p/ cache
COPY package.json pnpm-lock.yaml ./

# Baixa o store do pnpm (sem instalar ainda)
RUN pnpm fetch

# Copia código
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Instala deps (offline, usa o store baixado)
RUN pnpm install --offline

# Gera Prisma Client e builda Nest
RUN pnpm dlx prisma generate
RUN pnpm build

# ============== Runner ==============
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable

# Copia apenas o necessário
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Reaproveita o store e instala apenas prod deps (rápido e determinístico)
RUN pnpm fetch --prod && pnpm install --offline --prod

# Entrypoint: prisma generate/migrate/seed + start
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
