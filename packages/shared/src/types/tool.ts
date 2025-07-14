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