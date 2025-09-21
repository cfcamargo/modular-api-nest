# ============== Builder ==============
FROM node:22-slim AS builder
WORKDIR /app

# OpenSSL para evitar warnings/erros do Prisma em runtime de geração
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Habilita pnpm via Corepack
RUN corepack enable

# Copia manifests primeiro
COPY package.json pnpm-lock.yaml ./

# 🔒 Permite scripts de build necessários (não-interativo)
#   Alternativa: definir no package.json (veja abaixo)
ENV PNPM_ALLOW_SCRIPTS="@prisma/client prisma @prisma/engines @swc/core esbuild bcrypt core-js @nestjs/core"

# Baixa o store
RUN pnpm fetch

# Copia código
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Instala deps (offline)
RUN pnpm install --offline

# ⚠️ Use o Prisma CLI local (mesma versão do @prisma/client) — NÃO use dlx aqui
RUN pnpm prisma generate

# Build Nest
RUN pnpm build

# ============== Runner ==============
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# OpenSSL também no runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable

# Copia artefatos necessários
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Permite scripts no install de produção também
ENV PNPM_ALLOW_SCRIPTS="@prisma/client prisma @prisma/engines @swc/core esbuild bcrypt core-js @nestjs/core"

# Instala apenas prod deps (determinístico)
RUN pnpm fetch --prod && pnpm install --offline --prod

# Entrypoint de runtime (migrate/seed + start)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
