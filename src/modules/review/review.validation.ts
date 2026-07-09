import { z } from 'zod';

export const createReviewSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID format'),
  rating: z.coerce
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(1, 'Comment is required'),
});

export const propertyIdParamSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID format. Must be a valid UUID'),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
});

export type ICreateReviewInput = z.infer<typeof createReviewSchema>;
export type PropertyIdParam = z.infer<typeof propertyIdParamSchema>;
export type IReviewQuery = z.infer<typeof reviewQuerySchema>;
