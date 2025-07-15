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
    /** Максимальное время скроллинга (мс) */
    maxScrollTime: number;
    /** Время ожидания без изменений количества инструментов (мс) */
    stableCountTimeout: number;
  };
  /** Маппинг ценовых моделей */
  pricingMapping: Record<string, PricingType>;
}

export const futuretoolsConfig: FutureToolsConfig = {
  baseUrl: 'https://www.futuretools.io',
  toolsPageUrl: 'https://www.futuretools.io',
  
  selectors: {
    toolsContainer: '.collection-list-15.w-dyn-items, .w-dyn-items',
    toolCard: '.tool.tool-home.w-dyn-item, div[role="listitem"]',
    toolName: '.tool-item-link---new',
    toolDescription: '.tool-item-description-box---new',
    toolUrl: 'a.tool-item-new-window---new',
    toolCategory: '.text-block-53',
    toolTags: '.text-block-53',
    toolPricing: '.pricing, .price, .badge',
    loadMoreButton: 'button[data-testid="load-more"], .load-more, button:contains("Load More")',
  },
  
  parsing: {
    minToolsCount: 50,
    maxToolsCount: 4000, // Увеличиваем для всех инструментов
    scrollDelay: 1500, // Уменьшаем задержку для ускорения
    maxLoadMoreAttempts: 100, // Больше попыток
    maxScrollTime: 600000, // 10 минут максимум
    stableCountTimeout: 20000, // 20 секунд ожидания без изменений
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