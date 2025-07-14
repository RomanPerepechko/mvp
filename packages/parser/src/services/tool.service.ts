import { prisma } from '../db/client.js';
import type { ParsedTool, CrawlResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ToolService {
  /**
   * Сохранение или обновление списка инструментов в базе данных
   */
  async upsertTools(tools: ParsedTool[]): Promise<CrawlResult> {
    const startTime = Date.now();
    const result: CrawlResult = {
      parsed: tools.length,
      saved: 0,
      updated: 0,
      errors: [],
      duration: 0,
    };

    logger.info(`Начинаем сохранение ${tools.length} инструментов в базу данных...`);

    for (const tool of tools) {
      try {
        // Используем upsert для создания или обновления записи по URL
        const upsertedTool = await prisma.tool.upsert({
          where: {
            url: tool.url,
          },
          update: {
            name: tool.name,
            description: tool.description,
            tags: JSON.stringify(tool.tags), // Преобразуем массив в JSON строку
            category: tool.category,
            pricing: tool.pricing,
          },
          create: {
            name: tool.name,
            description: tool.description,
            url: tool.url,
            tags: JSON.stringify(tool.tags), // Преобразуем массив в JSON строку
            category: tool.category,
            pricing: tool.pricing,
          },
        });

        // Определяем был ли инструмент создан или обновлен
        const isNew = upsertedTool.createdAt.getTime() === upsertedTool.updatedAt.getTime();
        
        if (isNew) {
          result.saved++;
          logger.debug(`Создан новый инструмент: ${tool.name}`);
        } else {
          result.updated++;
          logger.debug(`Обновлен инструмент: ${tool.name}`);
        }

      } catch (error) {
        const errorMessage = `Ошибка при сохранении инструмента "${tool.name}": ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMessage);
        logger.error(errorMessage);
      }
    }

    result.duration = Date.now() - startTime;

    logger.info(`Сохранение завершено за ${result.duration}мс:`, {
      created: result.saved,
      updated: result.updated,
      errors: result.errors.length,
    });

    return result;
  }

  /**
   * Получение всех инструментов из базы данных
   */
  async getAllTools() {
    try {
      const tools = await prisma.tool.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Преобразуем JSON строки обратно в массивы
      const toolsWithParsedTags = tools.map(tool => ({
        ...tool,
        tags: JSON.parse(tool.tags) as string[],
      }));

      logger.info(`Получено ${tools.length} инструментов из базы данных`);
      return toolsWithParsedTags;
    } catch (error) {
      logger.error('Ошибка при получении инструментов из БД:', error);
      throw error;
    }
  }

  /**
   * Получение статистики по инструментам
   */
  async getStats() {
    try {
      const [total, byCategory, byPricing] = await Promise.all([
        prisma.tool.count(),
        prisma.tool.groupBy({
          by: ['category'],
          _count: {
            category: true,
          },
        }),
        prisma.tool.groupBy({
          by: ['pricing'],
          _count: {
            pricing: true,
          },
        }),
      ]);

      return {
        total,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        byPricing: byPricing.reduce((acc, item) => {
          acc[item.pricing] = item._count.pricing;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error('Ошибка при получении статистики:', error);
      throw error;
    }
  }

  /**
   * Удаление всех инструментов (для тестирования)
   */
  async clearAll() {
    try {
      const deleted = await prisma.tool.deleteMany();
      logger.info(`Удалено ${deleted.count} инструментов из базы данных`);
      return deleted.count;
    } catch (error) {
      logger.error('Ошибка при очистке базы данных:', error);
      throw error;
    }
  }
} 