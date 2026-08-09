import { z } from 'zod';
import {
  registerValidationSchema,
  loginValidationSchema,
  googleLoginValidationSchema,
  facebookLoginValidationSchema,
} from './auth.validation';

export type IRegisterInput = z.infer<typeof registerValidationSchema>;
export type ILoginInput = z.infer<typeof loginValidationSchema>;
export type IGoogleLoginInput = z.infer<typeof googleLoginValidationSchema>;
export type IFacebookLoginInput = z.infer<typeof facebookLoginValidationSchema>;
