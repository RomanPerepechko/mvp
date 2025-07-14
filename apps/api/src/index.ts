import { config } from 'dotenv';
import { buildServer } from './server.js';
import { logger } from './utils/logger.js';

// Загружаем переменные окружения
config();

const HOST = process.env.API_HOST || '0.0.0.0';
const PORT = parseInt(process.env.API_PORT || '3001', 10);

async function start() {
  try {
    logger.info('🚀 Запуск API сервера...');
    
    // Создаем сервер
    const server = await buildServer();
    
    logger.info('✅ Сервер создан, запускаем на порту...');

    // Запускаем сервер
    const address = await server.listen({
      host: HOST,
      port: PORT,
    });

    logger.info(`🚀 API сервер запущен на ${address}`);
    logger.info(`📚 Документация доступна на ${address}/docs`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Получен сигнал ${signal}, завершаем работу сервера...`);
      
      try {
        await server.close();
        logger.info('✅ Сервер успешно остановлен');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Ошибка при остановке сервера:', error);
        process.exit(1);
      }
    };

    // Обработчики сигналов
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Обработчик необработанных исключений
    process.on('uncaughtException', (error) => {
      logger.error('Необработанное исключение:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Необработанное отклонение промиса:', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Ошибка запуска сервера:', error);
    if (error instanceof Error) {
      logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

start(); 