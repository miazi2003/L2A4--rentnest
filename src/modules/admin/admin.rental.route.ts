import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AdminRentalController } from './admin.rental.controller';
import { validateParams, validateQuery } from '../../middlewares/validate.middleware';
import { adminRentalIdParamSchema, adminRentalQuerySchema } from './admin.rental.validation';
import { auth } from '../../middlewares/auth.middleware';

const adminRentalRouter = Router();

// Apply ADMIN auth guard globally
adminRentalRouter.use(auth(UserRole.ADMIN));

/**
 * @route GET /api/admin/rentals
 * @desc Get all rental requests
 * @access Admin
 */
adminRentalRouter.get(
  '/',
  validateQuery(adminRentalQuerySchema),
  AdminRentalController.getAllRentals,
);

/**
 * @route GET /api/admin/rentals/:id
 * @desc Get rental request details
 * @access Admin
 */
adminRentalRouter.get(
  '/:id',
  validateParams(adminRentalIdParamSchema),
  AdminRentalController.getRentalById,
);

export const AdminRentalRoutes = adminRentalRouter;
