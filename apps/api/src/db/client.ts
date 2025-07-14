import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Создаем единственный экземпляр Prisma клиента
export const prisma = new PrismaClient({
  log: ['warn', 'error'],
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