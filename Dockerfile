#  Stage 1: Builder 
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Source + schema
COPY . .

# Generate Prisma client then compile TypeScript
RUN pnpm exec prisma generate
RUN pnpm run build

# Prune to production deps only
RUN pnpm prune --prod

# Re-generate Prisma client into the pruned node_modules
RUN pnpm exec prisma generate

#  Stage 2: Runner 
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache libc6-compat openssl dumb-init

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist         ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma       ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
