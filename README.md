# 🧠 AI Tools Aggregator

Монорепозиторий для агрегатора AI-инструментов с CLI-парсером, REST API и базой данных PostgreSQL.

## 🏗️ Архитектура

```
ai-tools-aggregator/
├─ apps/
│  └─ api/                 # REST API (Fastify + TypeScript)
├─ packages/
│  ├─ shared/              # Общие типы и утилиты
│  └─ parser/              # CLI-парсер с Playwright
├─ docker/
│  └─ db/                  # Инициализация PostgreSQL
├─ docker-compose.prod.yml # Production конфигурация
├─ deploy.sh               # Автоматический деплой
└─ README.md
```

## 🌐 Production API

**🚀 API уже развернуто и работает!**

### Эндпоинты:

| Method | URL | Описание |
|--------|-----|----------|
| `GET` | `http://146.103.99.64:3001/health` | Health check |
| `GET` | `http://146.103.99.64:3001/api/tools` | Все AI-инструменты |
| `GET` | `http://146.103.99.64:3001/api/tools/demo` | Демо данные |
| `GET` | `http://146.103.99.64:3001/api/categories` | Категории |

### Данные в БД:
- **5 AI-инструментов**: ChatGPT, Midjourney, Notion AI, Copy.ai, Synthesia
- **4 категории**: Writing, Image, Productivity, Video
- **Типы цен**: Free, Paid, Freemium

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Установка pnpm (если не установлен)
npm install -g pnpm

# Установка зависимостей
pnpm install
```

### 2. Настройка базы данных

```bash
# Создание файла .env (скопируйте и измените при необходимости)
cp .env.example .env

# Запуск PostgreSQL в Docker
docker-compose up -d

# Генерация Prisma клиента
pnpm db:generate

# Создание таблиц в базе данных
pnpm db:push
```

### 3. Запуск API (локально)

```bash
# Запуск API в dev режиме
pnpm --filter api run dev

# API будет доступно на http://localhost:3001
```

### 4. Запуск парсера

```bash
# Демо данные (5 тестовых инструментов)
pnpm parser demo

# Парсинг FutureTools (сохранение в БД)
pnpm parser crawl futuretools

# Dry run (только просмотр, без сохранения)
pnpm parser crawl futuretools --dry-run

# Парсинг с лимитом
pnpm parser crawl futuretools --limit 100

# Дебаг режим
pnpm parser crawl futuretools --log-level debug
```

## 📋 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_tools
POSTGRES_DB=ai_tools
POSTGRES_USER=user
POSTGRES_PASSWORD=pass

# API
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Application
NODE_ENV=development
LOG_LEVEL=info
```

## 🌍 Production Deployment

### Автоматический деплой:

```bash
# Настройка переменных
export SERVER_HOST=146.103.99.64
export SERVER_USER=root

# Запуск деплоя
./deploy.sh
```

### Управление на сервере:

```bash
# Подключение к серверу
ssh root@146.103.99.64
cd /opt/ai-tools-aggregator

# Статус API
curl localhost:3001/health

# Логи API
docker-compose -f docker-compose.prod.yml logs api

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart
```

## 🧰 CLI Команды

### Парсинг инструментов

```bash
# Основная команда парсинга
pnpm parser crawl <source> [options]

# Доступные источники:
# - futuretools (futuretools.io)

# Опции:
# -l, --limit <number>     Максимальное количество инструментов
# -d, --dry-run           Не сохранять в БД, только показать результат
# --log-level <level>     Уровень логирования (debug, info, warn, error)
```

### Статистика

```bash
# Просмотр статистики базы данных
pnpm parser stats
```

### Управление базой данных

```bash
# Генерация Prisma клиента
pnpm db:generate

# Обновление схемы БД
pnpm db:push

# Открытие Prisma Studio
pnpm db:studio

# Очистка базы данных
pnpm parser clear --yes
```

## 🔧 Разработка

### Структура проекта

```
apps/api/                 # REST API
├─ src/
│  ├─ routes/            # API роуты
│  ├─ schemas/           # Zod схемы валидации
│  ├─ db/               # Prisma клиент
│  ├─ plugins/          # Fastify плагины
│  └─ utils/            # Утилиты
├─ prisma/              # Схема БД
└─ Dockerfile           # Docker конфигурация

packages/parser/          # CLI парсер
├─ src/
│  ├─ configs/          # Конфигурации источников
│  ├─ crawlers/         # Классы парсеров
│  ├─ commands/         # CLI команды
│  ├─ services/         # Сервисы БД
│  └─ utils/           # Утилиты
└─ prisma/             # Схема БД

packages/shared/          # Общие типы
└─ src/types/           # TypeScript типы
```

### Добавление нового источника

1. Создайте конфигурацию в `packages/parser/src/configs/newsource.config.ts`
2. Реализуйте парсер в `packages/parser/src/crawlers/newsource.ts`
3. Добавьте обработку в `packages/parser/src/commands/crawl.ts`

### API Development

```bash
# Запуск API в dev режиме
pnpm --filter api run dev

# Сборка API
pnpm --filter api run build

# Тестирование эндпоинтов
curl http://localhost:3001/api/tools
curl http://localhost:3001/api/categories
```

### Типы данных

```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
  category: string;
  pricing: 'Free' | 'Paid' | 'Freemium' | 'Contact';
  createdAt: string;
  updatedAt: string;
}
```

## 🐳 Docker

### Development

```bash
# Запуск только базы данных
docker-compose up -d db

# Просмотр логов
docker-compose logs -f db
```

### Production

```bash
# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Статус
docker-compose -f docker-compose.prod.yml ps

# Остановка
docker-compose -f docker-compose.prod.yml down
```

## 📊 Мониторинг

### Просмотр данных в Prisma Studio

```bash
pnpm db:studio
```

Откроется веб-интерфейс по адресу http://localhost:5555

### Подключение к PostgreSQL

```bash
# Через psql
psql postgresql://user:pass@localhost:5432/ai_tools

# Production БД
psql postgresql://ai_tools_user:AiTools2025SecurePwd123@146.103.99.64:5432/ai_tools_prod
```

## 📝 Примеры использования

### Базовый парсинг

```bash
# Парсинг минимум 50 инструментов с FutureTools
pnpm parser crawl futuretools
```

### Работа с API

```bash
# Получить все инструменты
curl http://146.103.99.64:3001/api/tools

# Получить категории
curl http://146.103.99.64:3001/api/categories

# Health check
curl http://146.103.99.64:3001/health
```

### Тестирование перед сохранением

```bash
# Dry run для проверки парсинга без сохранения
pnpm parser crawl futuretools --dry-run --log-level debug
```

### Парсинг с ограничениями

```bash
# Парсинг только 25 инструментов
pnpm parser crawl futuretools --limit 25
```

### Мониторинг результатов

```bash
# Статистика после парсинга
pnpm parser stats

# Просмотр данных в GUI
pnpm db:studio
```

## 🛠️ Troubleshooting

### База данных недоступна

```bash
# Проверьте статус Docker
docker-compose ps

# Перезапустите базу данных
docker-compose restart db

# Проверьте логи
docker-compose logs db
```

### API не отвечает

```bash
# Проверьте статус API
curl http://localhost:3001/health

# Логи API
docker-compose -f docker-compose.prod.yml logs api

# Перезапуск API
docker-compose -f docker-compose.prod.yml restart api
```

### Ошибки парсинга

```bash
# Включите дебаг логи
pnpm parser crawl futuretools --log-level debug

# Попробуйте dry run
pnpm parser crawl futuretools --dry-run
```

### Playwright ошибки

```bash
# Установите браузеры Playwright
npx playwright install chromium
```

## 📈 Roadmap

### ✅ Готово

- [x] CLI-парсер с Playwright
- [x] PostgreSQL база данных
- [x] REST API (Fastify + TypeScript)
- [x] Production deployment
- [x] Docker конфигурация
- [x] Автоматический деплой

### 🔄 В разработке

- [ ] Swagger документация API
- [ ] Веб-интерфейс (Nuxt 3)
- [ ] Дополнительные источники парсинга
- [ ] Система уведомлений о новых инструментах
- [ ] Автоматический парсинг по расписанию
- [ ] Авторизация и пользователи

### Архитектура для масштабирования

Проект готов к расширению в полноценный веб-сервис благодаря модульной структуре monorepo:

- **Backend**: REST API готов для фронтенда
- **База данных**: PostgreSQL с готовой схемой
- **Парсер**: Модульная система для добавления источников
- **Deployment**: Автоматизированный процесс

## 📄 Лицензия

MIT 