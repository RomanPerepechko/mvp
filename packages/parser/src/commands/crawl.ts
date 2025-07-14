import { FutureToolsCrawler } from '../crawlers/futuretools.js';
import { ToolService } from '../services/tool.service.js';
import { logger } from '../utils/logger.js';
import type { CrawlOptions } from '../types/index.js';

export async function crawlCommand(options: CrawlOptions): Promise<void> {
  const startTime = Date.now();
  
  logger.info(`Начинаем парсинг источника: ${options.source}`);

  try {
    // Выбираем парсер в зависимости от источника
    let crawler: FutureToolsCrawler;
    
    switch (options.source.toLowerCase()) {
      case 'futuretools':
        crawler = new FutureToolsCrawler();
        break;
      default:
        throw new Error(`Неподдерживаемый источник: ${options.source}. Доступные: futuretools`);
    }

    // Инициализируем браузер
    await crawler.initialize();

    try {
      // Парсим инструменты
      const parsedTools = await crawler.crawlTools();

      if (parsedTools.length === 0) {
        logger.warn('Не удалось спарсить ни одного инструмента');
        return;
      }

      // Применяем лимит если указан
      const toolsToSave = options.limit 
        ? parsedTools.slice(0, options.limit)
        : parsedTools;

      logger.info(`Спарсено ${parsedTools.length} инструментов${options.limit ? `, будет сохранено ${toolsToSave.length}` : ''}`);

      // Сохраняем в базу данных (если не dry run)
      if (!options.dryRun) {
        const toolService = new ToolService();
        const result = await toolService.upsertTools(toolsToSave);

        // Выводим результаты
        const totalTime = Date.now() - startTime;
        
        logger.info('🎉 Парсинг завершен успешно!', {
          source: options.source,
          parsed: result.parsed,
          saved: result.saved,
          updated: result.updated,
          errors: result.errors.length,
          totalTime: `${totalTime}мс`,
        });

        if (result.errors.length > 0) {
          logger.warn(`Возникло ${result.errors.length} ошибок при сохранении:`);
          result.errors.forEach(error => logger.warn(`  - ${error}`));
        }

        // Показываем статистику
        try {
          const stats = await toolService.getStats();
          logger.info('📊 Текущая статистика базы данных:', stats);
        } catch (error) {
          logger.warn('Не удалось получить статистику:', error);
        }
      } else {
        logger.info(`🔍 Dry run завершен. Найдено ${toolsToSave.length} инструментов (данные не сохранены)`);
        
        // Показываем примеры найденных инструментов
        const examples = toolsToSave.slice(0, 3);
        logger.info('Примеры найденных инструментов:');
        examples.forEach((tool, index) => {
          logger.info(`  ${index + 1}. ${tool.name} (${tool.category}) - ${tool.pricing}`);
          logger.info(`     ${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}`);
          logger.info(`     ${tool.url}`);
        });
      }

    } finally {
      // Закрываем браузер
      await crawler.close();
    }

  } catch (error) {
    logger.error('Ошибка во время парсинга:', error);
    throw error;
  }
} 