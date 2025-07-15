import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { ParsedTool, PricingType } from '../types/index.js';
import { futuretoolsConfig } from '../configs/futuretools.config.js';
import { logger } from '../utils/logger.js';

export class FutureToolsCrawler {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * Инициализация браузера и страницы
   */
  async initialize(): Promise<void> {
    logger.info('Запуск браузера для парсинга FutureTools...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    // Создаем контекст браузера с настройками
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await this.context.newPage();
    
    logger.info('Браузер успешно запущен');
  }

  /**
   * Основной метод парсинга инструментов
   */
  async crawlTools(): Promise<ParsedTool[]> {
    if (!this.page) {
      throw new Error('Браузер не инициализирован. Вызовите initialize() сначала.');
    }

    logger.info(`Переход на страницу: ${futuretoolsConfig.toolsPageUrl}`);
    
    try {
      await this.page.goto(futuretoolsConfig.toolsPageUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      logger.info('Страница загружена успешно');
    } catch (error) {
      logger.error('Ошибка при загрузке страницы:', error);
      throw error;
    }

    // Ждем загрузки контента
    await this.page.waitForTimeout(3000);

    // Прокручиваем страницу и загружаем больше инструментов
    try {
      await this.loadMoreTools();
      logger.info('Дополнительный контент загружен');
    } catch (error) {
      logger.warn('Ошибка при загрузке дополнительного контента:', error);
    }

    // Парсим инструменты
    const tools = await this.parseToolsFromPage();
    
    logger.info(`Успешно спарсено ${tools.length} инструментов`);
    
    return tools;
  }

  /**
   * Прокручивание страницы и загрузка дополнительных инструментов
   */
  private async loadMoreTools(): Promise<void> {
    if (!this.page) return;

    const { maxLoadMoreAttempts, scrollDelay, maxScrollTime, stableCountTimeout, maxToolsCount } = futuretoolsConfig.parsing;
    let attempts = 0;
    let lastCount = 0;
    let stableStartTime = 0;
    const startTime = Date.now();

    logger.info('Загрузка дополнительных инструментов через скроллинг...');

    while (attempts < maxLoadMoreAttempts) {
      // Проверяем максимальное время
      if (Date.now() - startTime > maxScrollTime) {
        logger.info(`Достигнуто максимальное время скроллинга: ${maxScrollTime}мс`);
        break;
      }

      // Прокручиваем вниз более агрессивно
      await this.page.evaluate(() => {
        // Прокручиваем до самого низа
        window.scrollTo(0, document.body.scrollHeight);
        
        // Дополнительно имитируем скроллинг пользователя
        window.dispatchEvent(new Event('scroll'));
        
        // Прокручиваем немного назад и снова вниз для активации lazy loading
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight - 1000);
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
          }, 100);
        }, 200);
      });

      // Ждем загрузки
      await this.page.waitForTimeout(scrollDelay);
      
      // Дополнительная проверка - ждем появления новых элементов
      try {
        await this.page.waitForFunction(
          (selector) => document.querySelectorAll(selector).length > 0,
          futuretoolsConfig.selectors.toolCard,
          { timeout: 2000 }
        );
      } catch {
        // Игнорируем таймаут - элементы уже могут быть загружены
      }

      // Проверяем количество загруженных инструментов
      const currentCount = await this.getToolsCount();
      
      // Если количество изменилось, сбрасываем таймер ожидания
      if (currentCount > lastCount) {
        const progress = Math.round((currentCount / 3553) * 100);
        logger.info(`Загружено ещё ${currentCount - lastCount} инструментов. Всего: ${currentCount}/3553 (${progress}%)`);
        lastCount = currentCount;
        stableStartTime = Date.now();
        
        // Проверяем максимальное количество
        if (currentCount >= maxToolsCount) {
          logger.info(`Достигнуто максимальное количество инструментов: ${currentCount}`);
          break;
        }
      } else {
        // Количество не изменилось
        if (stableStartTime === 0) {
          stableStartTime = Date.now();
          logger.debug(`Количество стабильно: ${currentCount}, начинаем отсчет...`);
        }
        
        const waitTime = Date.now() - stableStartTime;
        // Если количество не менялось слишком долго - останавливаемся
        if (waitTime > stableCountTimeout) {
          logger.info(`Остановка скроллинга: количество инструментов стабильно (${currentCount}) уже ${Math.round(waitTime/1000)}сек`);
          break;
        } else {
          logger.debug(`Ожидание новых инструментов... (${Math.round(waitTime/1000)}/${Math.round(stableCountTimeout/1000)}сек)`);
        }
      }

      // Ищем и нажимаем кнопку "Load More" если она есть
      try {
        const loadMoreButton = await this.page.$(futuretoolsConfig.selectors.loadMoreButton);
        if (loadMoreButton) {
          await loadMoreButton.click();
          logger.debug('Нажата кнопка "Load More"');
          await this.page.waitForTimeout(1000);
        }
      } catch (error) {
        logger.debug('Кнопка "Load More" не найдена или не кликабельна');
      }

      attempts++;
    }

    const finalCount = await this.getToolsCount();
    const totalTime = Date.now() - startTime;
    logger.info(`Скроллинг завершен. Итого инструментов: ${finalCount}, время: ${totalTime}мс, попыток: ${attempts}`);
  }

  /**
   * Получение текущего количества инструментов на странице
   */
  private async getToolsCount(): Promise<number> {
    if (!this.page) return 0;

    try {
      const tools = await this.page.$$(futuretoolsConfig.selectors.toolCard);
      return tools.length;
    } catch (error) {
      logger.warn('Не удалось подсчитать количество инструментов', { error });
      return 0;
    }
  }

  /**
   * Парсинг инструментов со страницы
   */
  private async parseToolsFromPage(): Promise<ParsedTool[]> {
    if (!this.page) return [];

    logger.info('Начинаем парсинг инструментов...');

    try {
      const tools = await this.page.evaluate((config: any) => {
        const toolElements = document.querySelectorAll(config.selectors.toolCard);
        const parsedTools: any[] = [];
        
        console.log(`Найдено ${toolElements.length} карточек инструментов`);

        toolElements.forEach((toolElement, index) => {
          try {
            // Извлекаем данные инструмента
            const nameElement = toolElement.querySelector(config.selectors.toolName);
            const descriptionElement = toolElement.querySelector(config.selectors.toolDescription);
            const urlElement = toolElement.querySelector(config.selectors.toolUrl);
            const categoryElement = toolElement.querySelector(config.selectors.toolCategory);

            const name = nameElement?.textContent?.trim() || '';
            const description = descriptionElement?.textContent?.trim() || '';
            const urlHref = urlElement?.getAttribute('href') || '';
            const category = categoryElement?.textContent?.trim() || 'Other';

            // Формируем полную ссылку
            let url = urlHref;
            if (url && !url.startsWith('http')) {
              url = url.startsWith('/') ? `${config.baseUrl}${url}` : `${config.baseUrl}/${url}`;
            }

            // Извлекаем теги
            const tagElements = toolElement.querySelectorAll(config.selectors.toolTags);
            const tags: string[] = [];
            tagElements.forEach((tagEl: any) => {
              const tagText = tagEl.textContent?.trim();
              if (tagText && !tags.includes(tagText)) {
                tags.push(tagText);
              }
            });

            // Определяем ценовую модель
            const pricingElement = toolElement.querySelector(config.selectors.toolPricing);
            const pricingText = pricingElement?.textContent?.trim().toLowerCase() || '';
            
            let pricing: string = 'Contact';
            for (const [keyword, mappedPricing] of Object.entries(config.pricingMapping)) {
              if (pricingText.includes(keyword.toLowerCase())) {
                pricing = mappedPricing as string;
                break;
              }
            }

            // Добавляем инструмент если есть основные данные
            if (name && description && url) {
              parsedTools.push({
                name,
                description,
                url,
                tags,
                category,
                pricing,
                source: 'futuretools.io',
              });
            }
          } catch (error) {
            console.warn(`Ошибка парсинга инструмента ${index}:`, error);
          }
        });

        return parsedTools;
      }, futuretoolsConfig);

      logger.info(`Парсинг завершен. Найдено ${tools.length} инструментов`);
      
      return tools as ParsedTool[];
    } catch (error) {
      logger.error('Ошибка при парсинге инструментов:', error);
      return [];
    }
  }

  /**
   * Закрытие браузера
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      logger.info('Браузер закрыт');
    }
  }
} 