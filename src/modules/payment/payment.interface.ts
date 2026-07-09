import { z } from 'zod';
import { createPaymentSchema, confirmPaymentSchema } from './payment.validation';

export type ICreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type IConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
