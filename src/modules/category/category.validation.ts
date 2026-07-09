import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid category ID format. Must be a valid UUID'),
});

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
