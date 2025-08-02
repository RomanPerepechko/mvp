import { z } from 'zod';

// Базовые типы
export const PricingTypeSchema = z.enum(['Free', 'Paid', 'Freemium', 'Contact']);

// Схема для категории
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Схема для категории с количеством инструментов
export const CategoryWithCountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  toolsCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Схема для инструмента (выходные данные)
export const ToolSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  url: z.string().url(),
  tags: z.array(z.string()),
  categoryId: z.string().uuid(),
  category: CategorySchema.optional(),
  pricing: PricingTypeSchema,
  favoriteCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Схема для создания инструмента
export const CreateToolSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().uuid(),
  pricing: PricingTypeSchema,
  favoriteCount: z.number().int().min(0).default(0),
});

// Схема для параметров запроса списка инструментов
export const ToolsQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  categoryId: z.string().uuid().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(), // Поддержка одной или нескольких категорий через запятую
  pricing: PricingTypeSchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'favoriteCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Схема для параметров URL
export const ToolParamsSchema = z.object({
  id: z.string().uuid(),
});

// Схема для списка инструментов
export const ToolsListSchema = z.object({
  items: z.array(ToolSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

// Схема для списка категорий
export const CategoriesListSchema = z.array(CategorySchema);

// Схема для списка категорий с количеством инструментов
export const CategoriesWithCountListSchema = z.array(CategoryWithCountSchema);

// Схема для ошибок
export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});

// Типы на основе схем
export type Category = z.infer<typeof CategorySchema>;
export type CategoryWithCount = z.infer<typeof CategoryWithCountSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type CreateTool = z.infer<typeof CreateToolSchema>;
export type ToolsQuery = z.infer<typeof ToolsQuerySchema>;
export type ToolParams = z.infer<typeof ToolParamsSchema>;
export type ToolsList = z.infer<typeof ToolsListSchema>;
export type CategoriesList = z.infer<typeof CategoriesListSchema>;
export type CategoriesWithCountList = z.infer<typeof CategoriesWithCountListSchema>;
export type ErrorResponse = z.infer<typeof ErrorSchema>; 