import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './utils/logger.js';
import { prisma } from './db/client.js';
import toolsRoutes from './routes/tools.js';
import categoriesRoutes from './routes/categories.js';

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

  // Регистрируем маршруты
  await fastify.register(toolsRoutes, { prefix: '/api' });
  await fastify.register(categoriesRoutes, { prefix: '/api' });

  return fastify;
} 