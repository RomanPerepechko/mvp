import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { CategoriesWithCountListSchema, ErrorSchema } from '../schemas/tool.js';

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/categories - Получить список категорий с количеством инструментов
  fastify.get('/categories', async (request, reply) => {
    try {
      // Получаем все категории из базы данных с подсчетом инструментов
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              tools: true
            }
          }
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Форматируем ответ с количеством инструментов
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        toolsCount: category._count.tools,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Ошибка при получении категорий',
        statusCode: 500,
      });
    }
  });

  // GET /api/categories/stats - Получить статистику по категориям
  fastify.get('/categories/stats', async (request, reply) => {
    try {
      // Группировка и подсчет по категориям
      const stats = await prisma.tool.groupBy({
        by: ['categoryId'],
        _count: {
          categoryId: true,
        },
      });

      // Получаем названия категорий
      const categories = await prisma.category.findMany();
      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>);

      // Преобразуем в объект {категория: количество}
      const categoryStats = stats.reduce((acc: any, item: any) => {
        const categoryName = categoryMap[item.categoryId] || 'Unknown';
        acc[categoryName] = item._count.categoryId;
        return acc;
      }, {});

      return categoryStats;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Ошибка при получении статистики категорий',
        statusCode: 500,
      });
    }
  });
};

export default categoriesRoutes; 