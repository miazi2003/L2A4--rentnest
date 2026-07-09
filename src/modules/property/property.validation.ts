import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  images: z.array(z.string().url('Image must be a valid URL')).default([]),
  categoryId: z.string().uuid('Invalid category ID format'),
});

export const updatePropertySchema = createPropertySchema.partial();

export const propertyIdParamSchema = z.object({
  id: z.string().uuid('Invalid property ID format. Must be a valid UUID'),
});

export const propertyQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  minPrice: z.coerce.number().nonnegative('minPrice must be non-negative').optional(),
  maxPrice: z.coerce.number().nonnegative('maxPrice must be non-negative').optional(),
  availability: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE'] as const).default('AVAILABLE'),
  landlordId: z.string().uuid('Invalid landlord ID format').optional(),
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
  sortBy: z.enum(['price', 'createdAt', 'title'] as const).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'] as const).default('desc'),
});

export type PropertyIdParam = z.infer<typeof propertyIdParamSchema>;
export type IPropertyQuery = z.infer<typeof propertyQuerySchema>;
