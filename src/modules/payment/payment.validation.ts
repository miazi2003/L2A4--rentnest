import { z } from 'zod';

export const createPaymentSchema = z.object({
  rentalRequestId: z.string().uuid('Invalid rental request ID format'),
});

export const confirmPaymentSchema = z.object({
  rentalRequestId: z.string().uuid('Invalid rental request ID format'),
  paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid('Invalid payment ID format. Must be a valid UUID'),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive('page must be a positive integer').default(1),
  limit: z.coerce.number().int().positive('limit must be a positive integer').default(10),
});

export type ICreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type IConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;
export type IPaymentQuery = z.infer<typeof paymentQuerySchema>;
