# AI Tools Parser

CLI парсер для автоматического сбора информации об AI-инструментах с различных источников.

## 📋 Описание

Парсер представляет собой консольное приложение на TypeScript, которое автоматически собирает информацию об AI-инструментах с веб-сайтов и сохраняет их в базу данных PostgreSQL. В настоящий момент поддерживается парсинг с сайта [FutureTools.io](https://www.futuretools.io).

## 🚀 Возможности

- **Веб-скрейпинг**: Автоматический парсинг AI-инструментов с помощью Playwright
- **Множественные источники**: Архитектура поддерживает добавление новых источников
- **База данных**: Сохранение данных в PostgreSQL с помощью Prisma
- **CLI интерфейс**: Удобные команды для управления парсингом
- **Dry-run режим**: Тестирование без сохранения в БД
- **Логирование**: Подробное логирование процесса парсинга
- **Статистика**: Просмотр статистики по собранным инструментам

## 📦 Установка

```bash
# Переход в директорию парсера
cd packages/parser

# Установка зависимостей
pnpm install

# Генерация Prisma клиента
pnpm db:generate

# Компиляция TypeScript
pnpm build
```

## ⚙️ Настройка

### Переменные окружения

Создайте файл `.env` в корне `packages/parser`:

```env
# PostgreSQL подключение
DATABASE_URL="postgresql://username:password@localhost:5432/ai_tools"

# Уровень логирования (debug, info, warn, error)
LOG_LEVEL="info"

# Режим разработки
NODE_ENV="development"
```

### База данных

Парсер использует PostgreSQL. Убедитесь, что база данных создана и доступна:

```bash
# Применение миграций
pnpm db:push

# Открытие Prisma Studio для просмотра данных
pnpm db:studio
```

## 🖥️ Использование

### Основные команды

```bash
# Показать справку
pnpm cli --help

# Парсинг с FutureTools (dry-run)
pnpm cli crawl futuretools --limit 10 --dry-run

# Реальный парсинг с сохранением в БД
pnpm cli crawl futuretools --limit 50

# Демонстрация с тестовыми данными
pnpm cli demo

# Просмотр статистики
pnpm cli stats

# Очистка базы данных
pnpm cli clear --yes
```

### Команда `crawl`

Основная команда для парсинга AI-инструментов:

```bash
pnpm cli crawl <источник> [опции]
```

**Параметры:**
- `<источник>` - Источник для парсинга (`futuretools`)

**Опции:**
- `-l, --limit <число>` - Максимальное количество инструментов
- `-d, --dry-run` - Не сохранять в БД, только показать результат
- `--log-level <уровень>` - Уровень логирования

**Примеры:**
```bash
# Парсинг 20 инструментов с FutureTools
pnpm cli crawl futuretools --limit 20

# Тестовый запуск без сохранения
pnpm cli crawl futuretools --limit 5 --dry-run

# С детальным логированием
pnpm cli crawl futuretools --limit 10 --log-level debug
```

### Команда `demo`

Заполнение БД демонстрационными данными:

```bash
pnpm cli demo [опции]
```

**Опции:**
- `-d, --dry-run` - Не сохранять в БД

### Команда `stats`

Просмотр статистики по инструментам в БД:

```bash
pnpm cli stats
```

Показывает:
- Общее количество инструментов
- Распределение по категориям
- Распределение по ценовым моделям

### Команда `clear`

Удаление всех инструментов из БД:

```bash
pnpm cli clear [опции]
```

**Опции:**
- `-y, --yes` - Не запрашивать подтверждение

## 🏗️ Архитектура

### Структура проекта

```
packages/parser/
├── src/
│   ├── commands/          # CLI команды
│   │   ├── crawl.ts      # Команда парсинга
│   │   └── demo.ts       # Демо-команда
│   ├── crawlers/         # Парсеры для разных источников
│   │   └── futuretools.ts # Парсер FutureTools.io
│   ├── services/         # Бизнес-логика
│   │   └── tool.service.ts # Сервис для работы с инструментами
│   ├── configs/          # Конфигурации
│   │   └── futuretools.config.ts # Настройки FutureTools парсера
│   ├── types/            # TypeScript типы
│   │   └── index.ts      # Основные интерфейсы
│   ├── utils/            # Утилиты
│   │   └── logger.ts     # Настройки логирования
│   ├── db/               # База данных
│   │   └── client.ts     # Prisma клиент
│   └── index.ts          # Точка входа CLI
├── prisma/
│   ├── schema.prisma     # Схема базы данных
│   └── dev.db           # SQLite БД для разработки
├── dist/                 # Скомпилированный код
├── package.json
└── tsconfig.json
```

### Основные компоненты

#### 1. CLI интерфейс (`src/index.ts`)
- Построен на библиотеке `commander`
- Обрабатывает команды и передает их соответствующим обработчикам
- Управляет глобальными настройками логирования

#### 2. Парсеры (`src/crawlers/`)
- Используют Playwright для веб-скрейпинга
- Каждый источник имеет свой парсер
- Возвращают стандартизированные данные `ParsedTool[]`

#### 3. Сервисы (`src/services/`)
- `ToolService` - работа с базой данных через Prisma
- Методы для создания, обновления и получения статистики

#### 4. Типы данных

```typescript
interface ParsedTool {
  name: string;           // Название инструмента
  description: string;    // Описание
  url: string;           // URL инструмента
  tags: string[];        // Теги
  category: string;      // Категория
  pricing: PricingType;  // Ценовая модель
  source: string;        // Источник парсинга
}

type PricingType = 'Free' | 'Paid' | 'Freemium' | 'Contact';
```

## 🔧 Разработка

### Добавление нового источника

1. Создайте новый парсер в `src/crawlers/`:

```typescript
export class NewSourceCrawler {
  async initialize(): Promise<void> {
    // Инициализация браузера
  }
  
  async crawlTools(): Promise<ParsedTool[]> {
    // Логика парсинга
  }
  
  async close(): Promise<void> {
    // Закрытие ресурсов
  }
}
```

2. Добавьте конфигурацию в `src/configs/`
3. Обновите команду `crawl` в `src/commands/crawl.ts`

### Скрипты разработки

```bash
# Разработка с автокомпиляцией
pnpm dev

# Запуск без компиляции
pnpm cli <команда>

# Сборка проекта
pnpm build

# Генерация Prisma клиента
pnpm db:generate

# Применение изменений схемы БД
pnpm db:push

# Открытие Prisma Studio
pnpm db:studio
```

## ⚠️ Известные проблемы

### 1. Конфликт конфигурации БД
**Проблема**: Prisma схема настроена на PostgreSQL, но в `.env` указан SQLite

**Решение**: Обновите `.env` для использования PostgreSQL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_tools"
```

### 2. Селекторы FutureTools
**Проблема**: Селекторы могут устареть при изменении структуры сайта

**Решение**: Обновите селекторы в `src/configs/futuretools.config.ts`

## 📊 Пример работы

```bash
$ pnpm cli crawl futuretools --limit 5 --dry-run

[INFO] Начинаем парсинг источника: futuretools
[INFO] Запуск браузера для парсинга FutureTools...
[INFO] Браузер успешно запущен
[INFO] Переход на страницу: https://www.futuretools.io
[INFO] Загрузка дополнительных инструментов...
[INFO] Успешно спарсено 5 инструментов
[INFO] 🔍 Dry run завершен. Найдено 5 инструментов (данные не сохранены)
[INFO] Примеры найденных инструментов:
[INFO]   1. ChatGPT (AI Chat) - Freemium
[INFO]      AI assistant for conversations and text generation
[INFO]      https://chat.openai.com
```

## 🤝 Статус

- ✅ **Рабочий**: CLI интерфейс функционирует
- ✅ **Парсинг**: FutureTools парсер работает
- ✅ **Демо-данные**: Команда demo работает
- ⚠️ **БД**: Требует настройки PostgreSQL
- ⚠️ **Продакшн**: Не тестировался в продакшн среде

## 📝 TODO

- [ ] Исправить конфигурацию БД (PostgreSQL vs SQLite)
- [ ] Добавить больше источников для парсинга
- [ ] Улучшить обработку ошибок
- [ ] Добавить тесты
- [ ] Оптимизировать производительность парсинга
- [ ] Добавить поддержку прокси для обхода ограничений 