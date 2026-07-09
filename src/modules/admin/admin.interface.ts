import { z } from 'zod';
import { updateUserStatusSchema } from './admin.validation';

export type IUpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
