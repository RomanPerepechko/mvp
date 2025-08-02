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