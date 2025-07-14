import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './utils/logger.js';
import { prisma } from './db/client.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: logger,
  });

  // Регистрируем CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Базовый health check
  fastify.get('/', async (request, reply) => {
    return {
      status: 'ok',
      message: 'AI Tools Aggregator API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Демо эндпоинт
  fastify.get('/api/tools/demo', async (request, reply) => {
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
      }
    ];

    return {
      items: demoTools,
      total: demoTools.length,
      limit: 20,
      offset: 0,
    };
  });

  // Реальные данные из БД
  fastify.get('/api/tools', async (request, reply) => {
    try {
      const tools = await prisma.tool.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.tool.count();

      return {
        items: tools.map((tool: any) => ({
          ...tool,
          createdAt: tool.createdAt.toISOString(),
          updatedAt: tool.updatedAt.toISOString(),
        })),
        total,
        limit: 20,
        offset: 0,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Database Error',
        message: 'Ошибка подключения к базе данных',
        statusCode: 500,
      });
    }
  });

  // Получить категории
  fastify.get('/api/categories', async (request, reply) => {
    try {
      const categories = await prisma.tool.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      return categories.map((item: any) => item.category);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        error: 'Database Error',
        message: 'Ошибка получения категорий',
        statusCode: 500,
      });
    }
  });

  return fastify;
} 