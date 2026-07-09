import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { RentalController } from './rental.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import {
  createRentalSchema,
  rentalIdParamSchema,
  rentalQuerySchema,
  landlordRentalQuerySchema,
  updateRentalStatusSchema,
} from './rental.validation';
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

// Landlord requests router
const landlordRouter = Router();
landlordRouter.use(auth(UserRole.LANDLORD));

/**
 * @route GET /api/landlord/requests
 * @desc Get all rental requests for properties owned by the landlord
 * @access Landlord
 */
landlordRouter.get(
  '/',
  validateQuery(landlordRentalQuerySchema),
  RentalController.getLandlordRentalRequests,
);

/**
 * @route PATCH /api/landlord/requests/:id
 * @desc Approve or reject a pending rental request
 * @access Landlord
 */
landlordRouter.patch(
  '/:id',
  validateParams(rentalIdParamSchema),
  validateBody(updateRentalStatusSchema),
  RentalController.updateRentalRequestStatus,
);

export const LandlordRentalRoutes = landlordRouter;
