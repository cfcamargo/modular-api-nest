# =========================
# Stage 1 — Builder
# =========================
FROM node:22-slim AS builder

WORKDIR /app

# Copie apenas os manifests primeiro para aproveitar cache
COPY package.json package-lock.json* ./

# Instala as dependências de produção + dev (para build)
RUN npm ci

# Copia os sources
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Gera o Prisma Client (necessário para build e runtime)
RUN npx prisma generate

# Build da aplicação NestJS
RUN npm run build

# =========================
# Stage 2 — Runner
# =========================
FROM node:22-slim AS runner

WORKDIR /app

# Variáveis padrão (ajuste conforme necessário)
ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas o necessário do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Entrypoint que roda generate, migrate, seed e sobe a API
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

# Use o entrypoint para garantir migrations/seed antes de subir
ENTRYPOINT ["/app/docker-entrypoint.sh"]
