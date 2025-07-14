/**
 * Тип ценовой модели AI-инструмента
 */
export type PricingType = 'Free' | 'Paid' | 'Freemium' | 'Contact';

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
  /** Категория инструмента */
  category: string;
  /** Ценовая модель */
  pricing: PricingType;
  /** Дата создания записи */
  createdAt: string;
  /** Дата последнего обновления */
  updatedAt: string;
}

/**
 * Данные для создания/обновления инструмента (без дат)
 */
export interface ToolCreateInput {
  name: string;
  description: string;
  url: string;
  tags: string[];
  category: string;
  pricing: PricingType;
}

/**
 * Результат парсинга одного инструмента
 */
export interface ParsedTool extends ToolCreateInput {
  /** Источник откуда был спарсен инструмент */
  source: string;
}

/**
 * Результат операции парсинга
 */
export interface CrawlResult {
  /** Количество успешно спарсенных инструментов */
  parsed: number;
  /** Количество сохраненных в БД инструментов */
  saved: number;
  /** Количество обновленных инструментов */
  updated: number;
  /** Ошибки во время парсинга */
  errors: string[];
  /** Время выполнения операции в миллисекундах */
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