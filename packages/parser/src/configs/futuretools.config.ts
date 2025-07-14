import type { PricingType } from '../types/index.js';

export interface FutureToolsConfig {
  /** Базовый URL сайта */
  baseUrl: string;
  /** URL страницы со списком инструментов */
  toolsPageUrl: string;
  /** CSS селекторы для элементов на странице */
  selectors: {
    /** Контейнер с карточками инструментов */
    toolsContainer: string;
    /** Отдельная карточка инструмента */
    toolCard: string;
    /** Название инструмента */
    toolName: string;
    /** Описание инструмента */
    toolDescription: string;
    /** Ссылка на инструмент */
    toolUrl: string;
    /** Категория инструмента */
    toolCategory: string;
    /** Теги инструмента */
    toolTags: string;
    /** Информация о цене */
    toolPricing: string;
    /** Кнопка загрузки большего количества инструментов */
    loadMoreButton: string;
  };
  /** Настройки парсинга */
  parsing: {
    /** Минимальное количество инструментов для парсинга */
    minToolsCount: number;
    /** Максимальное количество инструментов для парсинга */
    maxToolsCount: number;
    /** Задержка между прокручиваниями страницы (мс) */
    scrollDelay: number;
    /** Максимальное количество попыток загрузки больше инструментов */
    maxLoadMoreAttempts: number;
  };
  /** Маппинг ценовых моделей */
  pricingMapping: Record<string, PricingType>;
}

export const futuretoolsConfig: FutureToolsConfig = {
  baseUrl: 'https://www.futuretools.io',
  toolsPageUrl: 'https://www.futuretools.io',
  
  selectors: {
    toolsContainer: '[data-testid="tools-grid"], .tools-grid, .grid-container',
    toolCard: '[data-testid="tool-card"], .tool-card, .grid-item',
    toolName: 'h3, .tool-name, [data-testid="tool-name"]',
    toolDescription: '.tool-description, .description, p',
    toolUrl: 'a[href]',
    toolCategory: '.category, .tag-category, [data-category]',
    toolTags: '.tags, .tag, .chip',
    toolPricing: '.pricing, .price, .badge',
    loadMoreButton: 'button[data-testid="load-more"], .load-more, button:contains("Load More")',
  },
  
  parsing: {
    minToolsCount: 50,
    maxToolsCount: 200,
    scrollDelay: 2000,
    maxLoadMoreAttempts: 10,
  },
  
  pricingMapping: {
    'free': 'Free',
    'paid': 'Paid',
    'freemium': 'Freemium',
    'contact': 'Contact',
    'premium': 'Paid',
    'subscription': 'Paid',
    'trial': 'Freemium',
    '$': 'Paid',
    '$$': 'Paid',
    '$$$': 'Paid',
  },
}; 