import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { CategoriesSchema, ErrorSchema } from '../schemas/tool.js';

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/categories - Получить список уникальных категорий
  fastify.get('/categories', {
    schema: {
      description: 'Получить список всех категорий AI-инструментов',
      tags: ['categories'],
      response: {
        200: CategoriesSchema,
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      // Получаем уникальные категории из базы данных
      const categories = await prisma.tool.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc',
        },
      });

      // Извлекаем только названия категорий
      const categoryNames = categories.map(item => item.category);

      return categoryNames;
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
  fastify.get('/categories/stats', {
    schema: {
      description: 'Получить статистику инструментов по категориям',
      tags: ['categories'],
      response: {
        200: {
          type: 'object',
          additionalProperties: {
            type: 'number',
          },
        },
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      // Группировка и подсчет по категориям
      const stats = await prisma.tool.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
        orderBy: {
          category: 'asc',
        },
      });

      // Преобразуем в объект {категория: количество}
      const categoryStats = stats.reduce((acc: any, item: any) => {
        acc[item.category] = item._count.category;
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