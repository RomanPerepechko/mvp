import { prisma } from '../db/client.js';
import type { ParsedTool, CrawlResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ToolService {
  /**
   * Получить или создать категорию по названию
   */
  async getOrCreateCategory(name: string): Promise<string> {
    try {
      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      return category.id;
    } catch (error) {
      logger.error(`Ошибка при создании категории "${name}":`, error);
      throw error;
    }
  }

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
        // Получаем ID категории
        const categoryId = await this.getOrCreateCategory(tool.category);

        // Используем upsert для создания или обновления записи по URL
        const upsertedTool = await prisma.tool.upsert({
          where: {
            url: tool.url,
          },
          update: {
            name: tool.name,
            description: tool.description,
            tags: tool.tags,
            categoryId: categoryId,
            pricing: tool.pricing,
            favoriteCount: tool.favoriteCount,
          },
          create: {
            name: tool.name,
            description: tool.description,
            url: tool.url,
            tags: tool.tags,
            categoryId: categoryId,
            pricing: tool.pricing,
            favoriteCount: tool.favoriteCount,
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
        const errorMessage = `Ошибка при обработке инструмента "${tool.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        logger.error(errorMessage, error);
      }
    }

    result.duration = Date.now() - startTime;
    logger.info(`Завершено сохранение. Создано: ${result.saved}, обновлено: ${result.updated}, ошибок: ${result.errors.length}`);
    
    return result;
  }

  /**
   * Получение всех инструментов из базы данных
   */
  async getAllTools() {
    try {
      const tools = await prisma.tool.findMany({
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info(`Получено ${tools.length} инструментов из базы данных`);
      return tools;
    } catch (error) {
      logger.error('Ошибка при получении инструментов из БД:', error);
      throw error;
    }
  }

  /**
   * Получение всех категорий из базы данных
   */
  async getAllCategories() {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      logger.info(`Получено ${categories.length} категорий из базы данных`);
      return categories;
    } catch (error) {
      logger.error('Ошибка при получении категорий из БД:', error);
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
          by: ['categoryId'],
          _count: {
            categoryId: true,
          },
        }),
        prisma.tool.groupBy({
          by: ['pricing'],
          _count: {
            pricing: true,
          },
        }),
      ]);

      // Получаем названия категорий для статистики
      const categories = await prisma.category.findMany();
      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>);

      return {
        total,
        byCategory: byCategory.reduce((acc, item) => {
          const categoryName = categoryMap[item.categoryId] || 'Unknown';
          acc[categoryName] = item._count.categoryId;
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
      // Удаляем все инструменты (категории удалятся автоматически если не останется связанных инструментов)
      const deletedTools = await prisma.tool.deleteMany();
      
      // Удаляем оставшиеся категории без инструментов
      const deletedCategories = await prisma.category.deleteMany();
      
      logger.info(`Удалено ${deletedTools.count} инструментов и ${deletedCategories.count} категорий из базы данных`);
      return deletedTools.count;
    } catch (error) {
      logger.error('Ошибка при очистке базы данных:', error);
      throw error;
    }
  }
} 