import { z } from 'zod';
import { registerValidationSchema, loginValidationSchema } from './auth.validation';

export type IRegisterInput = z.infer<typeof registerValidationSchema>;
export type ILoginInput = z.infer<typeof loginValidationSchema>;
