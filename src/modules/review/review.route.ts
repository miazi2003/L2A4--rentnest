import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ReviewController } from './review.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import { createReviewSchema, propertyIdParamSchema, reviewQuerySchema } from './review.validation';
import { auth } from '../../middlewares/auth.middleware';

const reviewRouter = Router();

/**
 * @route POST /api/reviews
 * @desc Create property review
 * @access Tenant
 */
reviewRouter.post(
  '/',
  auth(UserRole.TENANT),
  validateBody(createReviewSchema),
  ReviewController.createReview,
);

/**
 * @route GET /api/reviews/property/:propertyId
 * @desc Retrieve reviews for a property
 * @access Public
 */
reviewRouter.get(
  '/property/:propertyId',
  validateParams(propertyIdParamSchema),
  validateQuery(reviewQuerySchema),
  ReviewController.getPropertyReviews,
);

export const ReviewRoutes = reviewRouter;
