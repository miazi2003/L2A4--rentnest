import { z } from 'zod';

export const adminPropertyIdParamSchema = z.object({
  id: z.string().uuid('Invalid property ID format. Must be a valid UUID'),
});

export const adminPropertyQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  landlordId: z.string().uuid('Invalid landlord ID format').optional(),
  availability: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE'] as const).optional(),
  sortBy: z.enum(['createdAt', 'price', 'title'] as const).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'] as const).default('desc'),
});

export type AdminPropertyIdParam = z.infer<typeof adminPropertyIdParamSchema>;
export type IAdminPropertyQuery = z.infer<typeof adminPropertyQuerySchema>;
