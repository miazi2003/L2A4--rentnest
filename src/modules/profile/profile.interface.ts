import { z } from 'zod';
import { updateProfileSchema, changePasswordSchema } from './profile.validation';

export type IUpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type IChangePasswordInput = z.infer<typeof changePasswordSchema>;
