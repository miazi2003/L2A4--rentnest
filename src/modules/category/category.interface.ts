import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from './category.validation';

export type ICreateCategoryInput = z.infer<typeof createCategorySchema>;
export type IUpdateCategoryInput = z.infer<typeof updateCategorySchema>;
