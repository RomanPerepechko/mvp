import type { CrawlerConfig } from '../types/index.js';

export interface FutureToolsConfig extends CrawlerConfig {
  toolsPageUrl: string;
  selectors: {
    toolsContainer: string;
    toolCard: string;
    toolName: string;
    toolDescription: string;
    toolUrl: string;
    toolCategory: string;
    toolTags: string;
    toolPricing: string;
    toolFavoriteCount: string;
    loadMoreButton: string;
  };
  parsing: {
    minToolsCount: number;
    maxToolsCount: number;
    scrollDelay: number;
    maxLoadMoreAttempts: number;
    maxScrollTime: number;
    stableCountTimeout: number;
  };
  pricingMapping: Record<string, string>;
  browser: {
    headless: boolean;
    timeout: number;
  };
}

// Конфигурация для парсера FutureTools
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
    toolFavoriteCount: '.text-block-52.jetboost-item-total-favorites-vd2l',
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
  
  browser: {
    headless: true,
    timeout: 30000,
  },
}; 