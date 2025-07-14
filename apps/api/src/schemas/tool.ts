import { z } from 'zod';

// Базовые типы
export const PricingTypeSchema = z.enum(['Free', 'Paid', 'Freemium', 'Contact']);

// Схема для инструмента (выходные данные)
export const ToolSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  url: z.string().url(),
  tags: z.array(z.string()),
  category: z.string(),
  pricing: PricingTypeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Схема для списка инструментов
export const ToolsListSchema = z.object({
  items: z.array(ToolSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// Схема для параметров запроса списка инструментов
export const ToolsQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.string().optional(),
  pricing: PricingTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Схема для параметров получения инструмента по ID
export const ToolParamsSchema = z.object({
  id: z.string().uuid(),
});

// Схема для ответа с категориями
export const CategoriesSchema = z.array(z.string());

// Схема для ошибок
export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

// Типы на основе схем
export type Tool = z.infer<typeof ToolSchema>;
export type ToolsList = z.infer<typeof ToolsListSchema>;
export type ToolsQuery = z.infer<typeof ToolsQuerySchema>;
export type ToolParams = z.infer<typeof ToolParamsSchema>;
export type Categories = z.infer<typeof CategoriesSchema>;
export type ErrorResponse = z.infer<typeof ErrorSchema>; 