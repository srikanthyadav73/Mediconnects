# syntax=docker/dockerfile:1

# Stage 1: Base Alpine image with Node.js 22 LTS
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Build the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Default build-time fallback envs (can be overridden with build args or runtime envs)
ENV NEXT_PUBLIC_SUPABASE_URL="https://mock-project.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="mock-anon-key-placeholder"

RUN npm run build

# Stage 4: Production Runner (minimal standalone image)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static files and standalone build output
# we can use this for docker compose as well
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

