# AI Tools Aggregator - Production Dockerfile
FROM node:18-alpine AS base

# Установка системных зависимостей
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Установка pnpm
RUN npm install -g pnpm

# Переменные окружения для Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# ===== DEPENDENCIES =====
FROM base AS deps

# Копирование файлов конфигурации
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/parser/package.json ./packages/parser/

# Установка зависимостей
RUN pnpm install --frozen-lockfile --prod

# ===== BUILDER =====
FROM base AS builder

# Копирование всех файлов
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/parser/node_modules ./packages/parser/node_modules

# Установка dev зависимостей для сборки
RUN pnpm install --frozen-lockfile

# Сборка проекта
RUN pnpm --filter shared run build
RUN pnpm --filter parser run build

# Генерация Prisma клиента
RUN pnpm --filter parser run db:generate

# ===== RUNNER =====
FROM base AS runner

# Создание пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Копирование production файлов
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=nextjs:nodejs /app/packages/parser/dist ./packages/parser/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/parser/package.json ./packages/parser/
COPY --from=builder --chown=nextjs:nodejs /app/packages/parser/prisma ./packages/parser/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/parser/src/generated ./packages/parser/src/generated
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/packages/parser/node_modules ./packages/parser/node_modules

# Переключение на непривилегированного пользователя
USER nextjs

# Переменные окружения
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node packages/parser/dist/index.js stats || exit 1

# Команда по умолчанию
CMD ["node", "packages/parser/dist/index.js", "crawl", "futuretools"] 