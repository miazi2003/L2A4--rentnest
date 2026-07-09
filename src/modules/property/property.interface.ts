import { z } from 'zod';
import { createPropertySchema, updatePropertySchema } from './property.validation';

export type ICreatePropertyInput = z.infer<typeof createPropertySchema>;
export type IUpdatePropertyInput = z.infer<typeof updatePropertySchema>;
