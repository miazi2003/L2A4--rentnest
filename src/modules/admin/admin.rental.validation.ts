import { z } from 'zod';

export const adminRentalIdParamSchema = z.object({
  id: z.string().uuid('Invalid rental request ID format. Must be a valid UUID'),
});

export const adminRentalQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'] as const).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED'] as const).optional(),
});

export type AdminRentalIdParam = z.infer<typeof adminRentalIdParamSchema>;
export type IAdminRentalQuery = z.infer<typeof adminRentalQuerySchema>;
