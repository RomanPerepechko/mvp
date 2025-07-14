import { PrismaClient } from '../generated/client/index.js';
import { logger } from '../utils/logger.js';

// Создаем единственный экземпляр Prisma клиента
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Логирование SQL запросов в development режиме
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug({
      query: e.query,
      params: e.params,
      duration: e.duration,
    }, 'Prisma query executed');
  });
}

prisma.$on('error', (e) => {
  logger.error({ target: e.target, message: e.message }, 'Prisma error');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Получен сигнал SIGINT, закрываем Prisma клиент...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Получен сигнал SIGTERM, закрываем Prisma клиент...');
  await prisma.$disconnect();
  process.exit(0);
}); 