#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import { crawlCommand } from './commands/crawl.js';
import { demoCommand } from './commands/demo.js';
import { ToolService } from './services/tool.service.js';
import { logger } from './utils/logger.js';
import type { CrawlOptions } from './types/index.js';

// Загружаем переменные окружения
config();

const program = new Command();

program
  .name('parser')
  .description('CLI парсер AI-инструментов')
  .version('1.0.0');

// Команда парсинга
program
  .command('crawl')
  .description('Парсинг инструментов с указанного источника')
  .argument('<source>', 'Источник для парсинга (futuretools)')
  .option('-l, --limit <number>', 'Максимальное количество инструментов', parseInt)
  .option('-d, --dry-run', 'Не сохранять данные в БД, только показать результат')
  .option('--log-level <level>', 'Уровень логирования (debug, info, warn, error)', 'info')
  .action(async (source: string, options: Omit<CrawlOptions, 'source'>) => {
    try {
      // Устанавливаем уровень логирования
      if (options.logLevel) {
        logger.level = options.logLevel;
      }

      const crawlOptions: CrawlOptions = {
        source,
        ...options,
      };

      await crawlCommand(crawlOptions);
    } catch (error) {
      logger.error('Команда завершилась с ошибкой:', error);
      process.exit(1);
    }
  });

// Демо-команда с тестовыми данными
program
  .command('demo')
  .description('Демонстрация с тестовыми AI-инструментами')
  .option('-d, --dry-run', 'Не сохранять данные в БД, только показать результат')
  .action(async (options: { dryRun?: boolean }) => {
    try {
      await demoCommand(options);
    } catch (error) {
      logger.error('Демо завершилось с ошибкой:', error);
      process.exit(1);
    }
  });

// Команда для просмотра статистики
program
  .command('stats')
  .description('Показать статистику по инструментам в базе данных')
  .action(async () => {
    try {
      const toolService = new ToolService();
      const stats = await toolService.getStats();
      
      logger.info('📊 Статистика базы данных:');
      logger.info(`Всего инструментов: ${stats.total}`);
      
      if (Object.keys(stats.byCategory).length > 0) {
        logger.info('По категориям:');
        Object.entries(stats.byCategory).forEach(([category, count]) => {
          logger.info(`  ${category}: ${count}`);
        });
      }
      
      if (Object.keys(stats.byPricing).length > 0) {
        logger.info('По ценовым моделям:');
        Object.entries(stats.byPricing).forEach(([pricing, count]) => {
          logger.info(`  ${pricing}: ${count}`);
        });
      }
    } catch (error) {
      logger.error('Ошибка при получении статистики:', error);
      process.exit(1);
    }
  });

// Команда для очистки базы данных
program
  .command('clear')
  .description('Удалить все инструменты из базы данных')
  .option('-y, --yes', 'Не запрашивать подтверждение')
  .action(async (options: { yes?: boolean }) => {
    try {
      if (!options.yes) {
        logger.warn('⚠️  Эта команда удалит ВСЕ инструменты из базы данных!');
        logger.warn('Для подтверждения добавьте флаг --yes');
        return;
      }

      const toolService = new ToolService();
      const deleted = await toolService.clearAll();
      
      logger.info(`✅ Удалено ${deleted} инструментов из базы данных`);
    } catch (error) {
      logger.error('Ошибка при очистке базы данных:', error);
      process.exit(1);
    }
  });

// Обработка ошибок
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Запуск программы
program.parse(); 