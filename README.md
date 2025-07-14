# 🧠 AI Tools Aggregator

Монорепозиторий для агрегатора AI-инструментов с CLI-парсером и базой данных.

## 🏗️ Архитектура

```
ai-tools-aggregator/
├─ apps/
│  └─ api/                 # Backend API (будущая разработка)
├─ packages/
│  ├─ shared/              # Общие типы и утилиты
│  └─ parser/              # CLI-парсер с Playwright
├─ docker/
│  └─ db/                  # Инициализация PostgreSQL
├─ docker-compose.yml      # Конфигурация баз данных
└─ README.md
```

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

### 3. Запуск парсера

```bash
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
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_tools
POSTGRES_DB=ai_tools
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
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

### Структура парсера

```
packages/parser/
├─ src/
│  ├─ configs/           # Конфигурации для каждого источника
│  ├─ crawlers/          # Классы парсеров
│  ├─ commands/          # CLI команды
│  ├─ services/          # Сервисы для работы с БД
│  ├─ db/               # Prisma клиент
│  ├─ types/            # TypeScript типы
│  └─ utils/            # Утилиты (логгер и др.)
├─ prisma/
│  └─ schema.prisma     # Схема базы данных
└─ package.json
```

### Добавление нового источника

1. Создайте конфигурацию в `src/configs/newsource.config.ts`
2. Реализуйте парсер в `src/crawlers/newsource.ts`
3. Добавьте обработку в `src/commands/crawl.ts`

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

### Запуск только базы данных

```bash
docker-compose up -d db
```

### Просмотр логов

```bash
docker-compose logs -f db
```

### Остановка

```bash
docker-compose down
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

# Или через любой SQL клиент
# Host: localhost
# Port: 5432
# Database: ai_tools
# Username: user
# Password: pass
```

## 📝 Примеры использования

### Базовый парсинг

```bash
# Парсинг минимум 50 инструментов с FutureTools
pnpm parser crawl futuretools
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

## 📈 Расширение

### Планируемые функции

- [ ] Веб-интерфейс (Nuxt 3)
- [ ] REST API (Fastify)
- [ ] Дополнительные источники парсинга
- [ ] Система уведомлений о новых инструментах
- [ ] Автоматический парсинг по расписанию

### Архитектура для масштабирования

Проект готов к расширению в полноценный веб-сервис с API и фронтендом благодаря модульной структуре monorepo.

## 📄 Лицензия

MIT 