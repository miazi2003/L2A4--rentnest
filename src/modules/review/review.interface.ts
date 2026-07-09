import { z } from 'zod';
import { createReviewSchema } from './review.validation';

export type ICreateReviewInput = z.infer<typeof createReviewSchema>;
