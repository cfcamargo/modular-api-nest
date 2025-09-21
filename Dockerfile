FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# permite scripts de build (Prisma, swc, esbuild, bcrypt, etc.)
ENV PNPM_ALLOW_SCRIPTS="@prisma/client prisma @prisma/engines @swc/core esbuild bcrypt core-js @nestjs/core"

RUN pnpm fetch
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma
RUN pnpm install --offline
RUN pnpm prisma generate
RUN pnpm build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# permitir scripts de build também no install de prod
ENV PNPM_ALLOW_SCRIPTS="@prisma/client prisma @prisma/engines @swc/core esbuild bcrypt core-js @nestjs/core"
RUN pnpm fetch --prod && pnpm install --offline --prod

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
