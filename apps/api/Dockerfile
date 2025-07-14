# AI Tools Aggregator API - Production Dockerfile
FROM node:18-alpine AS base

# Установка pnpm
RUN npm install -g pnpm

WORKDIR /app

# ===== DEPENDENCIES =====
FROM base AS deps

# Копирование файлов конфигурации монорепы
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Установка зависимостей
RUN pnpm install --frozen-lockfile --prod

# ===== BUILDER =====
FROM base AS builder

# Копирование всех файлов
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Установка всех зависимостей для сборки
RUN pnpm install --frozen-lockfile

# Сборка shared пакета
RUN pnpm --filter shared run build

# Сборка API
RUN pnpm --filter api run build

# ===== RUNNER =====
FROM base AS runner

# Создание пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

WORKDIR /app

# Копирование production файлов
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=apiuser:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=apiuser:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=deps --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=apiuser:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Переключение на непривилегированного пользователя
USER apiuser

# Переменные окружения
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV API_HOST=0.0.0.0
ENV API_PORT=3001

# Открываем порт
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Команда запуска
CMD ["node", "apps/api/dist/index.js"] 