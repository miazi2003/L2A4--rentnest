import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AdminPropertyController } from './admin.property.controller';
import { validateParams, validateQuery } from '../../middlewares/validate.middleware';
import { adminPropertyIdParamSchema, adminPropertyQuerySchema } from './admin.property.validation';
import { auth } from '../../middlewares/auth.middleware';

const adminPropertyRouter = Router();

// Apply ADMIN auth guard globally
adminPropertyRouter.use(auth(UserRole.ADMIN));

/**
 * @route GET /api/admin/properties
 * @desc Get all properties
 * @access Admin
 */
adminPropertyRouter.get(
  '/',
  validateQuery(adminPropertyQuerySchema),
  AdminPropertyController.getAllProperties,
);

/**
 * @route GET /api/admin/properties/:id
 * @desc Get property details
 * @access Admin
 */
adminPropertyRouter.get(
  '/:id',
  validateParams(adminPropertyIdParamSchema),
  AdminPropertyController.getPropertyById,
);

export const AdminPropertyRoutes = adminPropertyRouter;
