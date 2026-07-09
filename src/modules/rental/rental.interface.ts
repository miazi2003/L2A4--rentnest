import { z } from 'zod';
import { createRentalSchema } from './rental.validation';

export type ICreateRentalInput = z.infer<typeof createRentalSchema>;
