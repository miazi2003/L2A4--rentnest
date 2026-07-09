import { z } from 'zod';

export const createRentalSchema = z
  .object({
    propertyId: z.string().uuid('Invalid property ID format'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const rentalIdParamSchema = z.object({
  id: z.string().uuid('Invalid rental request ID format. Must be a valid UUID'),
});

export const rentalQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'] as const).optional(),
});

export type RentalIdParam = z.infer<typeof rentalIdParamSchema>;
export type IRentalQuery = z.infer<typeof rentalQuerySchema>;

export const updateRentalStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'] as const, {
    message: 'Status must be either APPROVED or REJECTED',
  }),
});

export const landlordRentalQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'] as const).optional(),
});

export type IUpdateRentalStatusInput = z.infer<typeof updateRentalStatusSchema>;
export type ILandlordRentalQuery = z.infer<typeof landlordRentalQuerySchema>;
