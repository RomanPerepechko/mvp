import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { 
  ToolsQuerySchema, 
  ToolParamsSchema, 
  ToolsListSchema, 
  ToolSchema,
  ErrorSchema 
} from '../schemas/tool.js';

const toolsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/tools/demo - Демо данные для тестирования
  fastify.get('/tools/demo', {
    schema: {
      description: 'Демо список AI-инструментов (тестовые данные)',
      tags: ['tools'],
    },
  }, async (request, reply) => {
    try {
      // Создаем демо категории если их нет
      const writingCategory = await prisma.category.upsert({
        where: { name: 'Writing' },
        update: {},
        create: { name: 'Writing' },
      });

      const imageCategory = await prisma.category.upsert({
        where: { name: 'Image' },
        update: {},
        create: { name: 'Image' },
      });

      const demoTools = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'ChatGPT',
          description: 'Advanced conversational AI by OpenAI',
          url: 'https://chat.openai.com',
          tags: ['AI', 'Chat', 'Writing'],
          categoryId: writingCategory.id,
          category: {
            id: writingCategory.id,
            name: writingCategory.name,
            createdAt: writingCategory.createdAt.toISOString(),
            updatedAt: writingCategory.updatedAt.toISOString(),
          },
          pricing: 'Freemium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Midjourney',
          description: 'AI image generation tool',
          url: 'https://midjourney.com',
          tags: ['AI', 'Image', 'Art'],
          categoryId: imageCategory.id,
          category: {
            id: imageCategory.id,
            name: imageCategory.name,
            createdAt: imageCategory.createdAt.toISOString(),
            updatedAt: imageCategory.updatedAt.toISOString(),
          },
          pricing: 'Paid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      return {
        items: demoTools,
        total: demoTools.length,
        limit: 20,
        offset: 0,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Database Error',
        message: 'Ошибка создания демо данных',
        statusCode: 500,
      });
    }
  });

  // GET /api/tools - Получить список инструментов
  fastify.get('/tools', async (request, reply) => {
    try {
      const query = ToolsQuerySchema.parse(request.query);
      
      // Построение WHERE условий
      const where: any = {};
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ];
      }
      
      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }
      
      if (query.pricing) {
        where.pricing = query.pricing;
      }
      
      if (query.tags) {
        const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
        where.tags = {
          hasSome: tags,
        };
      }

      // Построение ORDER BY условий
      const orderBy: any = {};
      if (query.sortBy) {
        orderBy[query.sortBy] = query.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc'; // По умолчанию сортировка по дате создания
      }

      // Параллельные запросы для данных и подсчета
      const [tools, total] = await Promise.all([
        prisma.tool.findMany({
          where,
          include: {
            category: true,
          },
          skip: query.offset,
          take: query.limit,
          orderBy,
        }),
        prisma.tool.count({ where }),
      ]);

      // Форматирование ответа
      const response = {
        items: tools.map((tool: any) => ({
          ...tool,
          createdAt: tool.createdAt.toISOString(),
          updatedAt: tool.updatedAt.toISOString(),
          category: {
            ...tool.category,
            createdAt: tool.category.createdAt.toISOString(),
            updatedAt: tool.category.updatedAt.toISOString(),
          },
        })),
        total,
        limit: query.limit,
        offset: query.offset,
      };

      return response;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Ошибка при получении списка инструментов',
        statusCode: 500,
      });
    }
  });

  // GET /api/tools/:id - Получить инструмент по ID
  fastify.get('/tools/:id', async (request, reply) => {
    try {
      const params = ToolParamsSchema.parse(request.params);
      
      const tool = await prisma.tool.findUnique({
        where: { id: params.id },
        include: {
          category: true,
        },
      });

      if (!tool) {
        reply.code(404).send({
          error: 'Not Found',
          message: 'Инструмент не найден',
          statusCode: 404,
        });
        return;
      }

      return {
        ...tool,
        createdAt: tool.createdAt.toISOString(),
        updatedAt: tool.updatedAt.toISOString(),
        category: {
          ...tool.category,
          createdAt: tool.category.createdAt.toISOString(),
          updatedAt: tool.category.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Ошибка при получении инструмента',
        statusCode: 500,
      });
    }
  });

  // POST /api/tools/resolve-url - Разрешение финального URL
  fastify.post('/tools/resolve-url', async (request, reply) => {
    try {
      const { url } = request.body as { url: string };
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      return { finalUrl: response.url };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to resolve URL' });
    }
  });
};

export default toolsRoutes; 