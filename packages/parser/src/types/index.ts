/**
 * Тип ценовой модели AI-инструмента
 */
export type PricingType = 'Free' | 'Paid' | 'Freemium' | 'Contact';

/**
 * Интерфейс категории AI-инструмента
 */
export interface Category {
  /** Уникальный идентификатор категории */
  id: string;
  /** Название категории */
  name: string;
  /** Дата создания записи */
  createdAt: string;
  /** Дата последнего обновления */
  updatedAt: string;
}

/**
 * Основной интерфейс AI-инструмента
 */
export interface Tool {
  /** Уникальный идентификатор */
  id: string;
  /** Название инструмента */
  name: string;
  /** Описание инструмента */
  description: string;
  /** URL инструмента */
  url: string;
  /** Теги (массив строк) */
  tags: string[];
  /** ID категории инструмента */
  categoryId: string;
  /** Категория инструмента (при включении связи) */
  category?: Category;
  /** Ценовая модель */
  pricing: PricingType;
  /** Количество добавлений в избранное */
  favoriteCount: number;
  /** Дата создания записи */
  createdAt: string;
  /** Дата последнего обновления */
  updatedAt: string;
}

/**
 * Интерфейс для данных парсера (до сохранения в БД)
 */
export interface ParsedTool {
  name: string;
  description: string;
  url: string;
  tags: string[];
  category: string; // В парсере все еще используется строка
  pricing: PricingType;
  favoriteCount: number;
  source: string;
}

/**
 * Результат парсинга инструментов
 */
export interface CrawlResult {
  /** Количество обработанных инструментов */
  parsed: number;
  /** Количество новых инструментов */
  saved: number;
  /** Количество обновленных инструментов */
  updated: number;
  /** Список ошибок */
  errors: string[];
  /** Время выполнения в миллисекундах */
  duration: number;
}

/**
 * Опции для CLI команд
 */
export interface CrawlOptions {
  /** Источник для парсинга */
  source: string;
  /** Максимальное количество инструментов */
  limit?: number;
  /** Dry run - не сохранять в БД */
  dryRun?: boolean;
  /** Уровень логирования */
  logLevel?: string;
}

/**
 * Конфигурация парсера
 */
export interface CrawlerConfig {
  /** Базовый URL сайта */
  baseUrl: string;
  /** Селекторы для парсинга */
  selectors: {
    [key: string]: string;
  };
  /** Настройки браузера */
  browser?: {
    headless?: boolean;
    timeout?: number;
  };
}

/**
 * Статистика по инструментам
 */
export interface ToolStats {
  total: number;
  byCategory: Record<string, number>;
  byPricing: Record<string, number>;
} 