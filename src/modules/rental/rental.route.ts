import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { RentalController } from './rental.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import { createRentalSchema, rentalIdParamSchema, rentalQuerySchema } from './rental.validation';
import { auth } from '../../middlewares/auth.middleware';

const rentalRouter = Router();

// Apply TENANT auth guard globally for all rental endpoints
rentalRouter.use(auth(UserRole.TENANT));

/**
 * @route POST /api/rentals
 * @desc Create rental request
 * @access Tenant
 */
rentalRouter.post('/', validateBody(createRentalSchema), RentalController.createRentalRequest);

/**
 * @route GET /api/rentals
 * @desc Get my rental requests
 * @access Tenant
 */
rentalRouter.get('/', validateQuery(rentalQuerySchema), RentalController.getMyRentalRequests);

/**
 * @route GET /api/rentals/:id
 * @desc Get rental request details
 * @access Tenant
 */
rentalRouter.get(
  '/:id',
  validateParams(rentalIdParamSchema),
  RentalController.getRentalRequestDetails,
);

export const RentalRoutes = rentalRouter;
