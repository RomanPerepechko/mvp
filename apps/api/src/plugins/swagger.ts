import { FastifyPluginAsync } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Регистрируем Swagger
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'AI Tools Aggregator API',
        description: 'REST API для агрегатора AI-инструментов',
        version: '1.0.0',
        contact: {
          name: 'AI Tools Team',
          email: 'support@ai-tools.com',
        },
      },
      host: process.env.API_HOST || 'localhost:3001',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {
          name: 'tools',
          description: 'Операции с AI-инструментами',
        },
        {
          name: 'categories',
          description: 'Категории инструментов',
        },
      ],
    },
  });

  // Регистрируем Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });
};

export default swaggerPlugin; 