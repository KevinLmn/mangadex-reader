# ----------- Base Stage ----------- #
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ----------- Prune Stage ----------- #
FROM base AS prune

# Fix for global pnpm installs
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Turbo globally
RUN pnpm add -g turbo

# Copy monorepo
COPY . .

# Prune for frontend (Next.js app)
RUN turbo prune --scope=frontend --docker

# ----------- Install Stage ----------- #
FROM base AS install

# Copy pruned workspace with only needed files
COPY --from=prune /app/out/json/ ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile

# ----------- Build Stage ----------- #
FROM base AS build

COPY --from=install /app /app
COPY --from=prune /app/out/full/ ./
COPY tsconfig.json ./

# Build only the frontend app
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm turbo run build --filter=frontend...

# ----------- Final Runner Stage ----------- #
FROM node:20-alpine AS runner

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
USER nextjs

# Copy final standalone output from build
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/standalone/ ./
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

EXPOSE 3011
ENV PORT=3011

CMD ["node", "frontend/server.js"]
