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
      response: {
        200: ToolsListSchema,
      },
    },
  }, async (request, reply) => {
    const demoTools = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'ChatGPT',
        description: 'Advanced conversational AI by OpenAI',
        url: 'https://chat.openai.com',
        tags: ['AI', 'Chat', 'Writing'],
        category: 'Writing',
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
        category: 'Image',
        pricing: 'Paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      items: demoTools,
      total: demoTools.length,
      limit: 20,
      offset: 0,
    };
  });

  // GET /api/tools - Получить список инструментов
  fastify.get('/tools', {
    schema: {
      description: 'Получить список AI-инструментов',
      tags: ['tools'],
      querystring: ToolsQuerySchema,
      response: {
        200: ToolsListSchema,
        400: ErrorSchema,
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
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
      
      if (query.category) {
        where.category = query.category;
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

      // Параллельные запросы для данных и подсчета
      const [tools, total] = await Promise.all([
        prisma.tool.findMany({
          where,
          skip: query.offset,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.tool.count({ where }),
      ]);

      // Форматирование ответа
      const response = {
        items: tools.map(tool => ({
          ...tool,
          createdAt: tool.createdAt.toISOString(),
          updatedAt: tool.updatedAt.toISOString(),
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
  fastify.get('/tools/:id', {
    schema: {
      description: 'Получить AI-инструмент по ID',
      tags: ['tools'],
      params: ToolParamsSchema,
      response: {
        200: ToolSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const params = ToolParamsSchema.parse(request.params);
      
      const tool = await prisma.tool.findUnique({
        where: { id: params.id },
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
};

export default toolsRoutes; 