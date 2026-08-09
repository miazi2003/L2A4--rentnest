import { z } from 'zod';

export const createContactSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Email must be a valid email address'),
  subject: z.string().trim().max(200, 'Subject cannot exceed 200 characters').optional(),
  message: z
    .string({ message: 'Message is required' })
    .trim()
    .min(5, 'Message must be at least 5 characters long')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

export type ICreateContactValidationInput = z.infer<typeof createContactSchema>;
