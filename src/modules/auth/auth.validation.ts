import { z } from 'zod';

export const registerValidationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Email must be a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().min(1, 'Phone number is required'),
  role: z.enum(['TENANT', 'LANDLORD'] as const, {
    message: 'Role must be either TENANT or LANDLORD',
  }),
});

export const loginValidationSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Email must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
