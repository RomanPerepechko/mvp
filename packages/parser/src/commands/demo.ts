import { ToolService } from '../services/tool.service.js';
import { logger } from '../utils/logger.js';
import type { ParsedTool } from '../types/index.js';

/**
 * Демонстрационные данные для тестирования системы
 */
const demoTools: ParsedTool[] = [
  {
    name: 'ChatGPT',
    description: 'Мощный AI-ассистент для разговоров, написания текстов и решения задач',
    url: 'https://chat.openai.com',
    tags: ['chatbot', 'text-generation', 'ai-assistant'],
    category: 'Writing',
    pricing: 'Freemium',
    source: 'demo',
  },
  {
    name: 'Midjourney',
    description: 'AI-генератор изображений высокого качества из текстовых описаний',
    url: 'https://midjourney.com',
    tags: ['image-generation', 'art', 'creative'],
    category: 'Image',
    pricing: 'Paid',
    source: 'demo',
  },
  {
    name: 'Notion AI',
    description: 'AI-помощник для заметок, планирования и организации работы',
    url: 'https://notion.so',
    tags: ['productivity', 'notes', 'planning'],
    category: 'Productivity',
    pricing: 'Freemium',
    source: 'demo',
  },
  {
    name: 'Copy.ai',
    description: 'AI-копирайтер для создания маркетингового контента и текстов',
    url: 'https://copy.ai',
    tags: ['copywriting', 'marketing', 'content'],
    category: 'Writing',
    pricing: 'Freemium',
    source: 'demo',
  },
  {
    name: 'Synthesia',
    description: 'Создание AI-видео с виртуальными ведущими из текста',
    url: 'https://synthesia.io',
    tags: ['video-generation', 'avatar', 'presentation'],
    category: 'Video',
    pricing: 'Paid',
    source: 'demo',
  },
];

export async function demoCommand(options: { dryRun?: boolean }): Promise<void> {
  const startTime = Date.now();
  
  logger.info('🎬 Запуск демонстрации с тестовыми AI-инструментами');
  
  try {
    logger.info(`Подготовлено ${demoTools.length} демо-инструментов для показа системы`);
    
    if (!options.dryRun) {
      // Сохраняем в базу данных
      const toolService = new ToolService();
      const result = await toolService.upsertTools(demoTools);
      
      const totalTime = Date.now() - startTime;
      
      logger.info('🎉 Демонстрация завершена успешно!', {
        source: 'demo',
        parsed: result.parsed,
        saved: result.saved,
        updated: result.updated,
        errors: result.errors.length,
        totalTime: `${totalTime}мс`,
      });
      
      if (result.errors.length > 0) {
        logger.warn(`Возникло ${result.errors.length} ошибок при сохранении:`);
        result.errors.forEach(error => logger.warn(`  - ${error}`));
      }
      
      // Показываем статистику
      try {
        const stats = await toolService.getStats();
        logger.info('📊 Текущая статистика базы данных:', stats);
      } catch (error) {
        logger.warn('Не удалось получить статистику:', error);
      }
      
    } else {
      logger.info(`🔍 Dry run завершен. Найдено ${demoTools.length} демо-инструментов (данные не сохранены)`);
      
      // Показываем примеры найденных инструментов
      logger.info('Примеры демо-инструментов:');
      demoTools.forEach((tool, index) => {
        logger.info(`  ${index + 1}. ${tool.name} (${tool.category}) - ${tool.pricing}`);
        logger.info(`     ${tool.description}`);
        logger.info(`     ${tool.url}`);
        logger.info(`     Теги: ${tool.tags.join(', ')}`);
      });
    }
    
  } catch (error) {
    logger.error('Ошибка во время демонстрации:', error);
    throw error;
  }
} 