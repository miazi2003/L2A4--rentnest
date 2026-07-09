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

export type PropertyIdParam = z.infer<typeof propertyIdParamSchema>;
