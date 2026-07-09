import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AdminUserController } from './admin.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import {
  updateUserStatusSchema,
  userIdParamSchema,
  adminUserQuerySchema,
} from './admin.validation';
import { auth } from '../../middlewares/auth.middleware';

const adminUserRouter = Router();

// Apply ADMIN auth guard globally for all admin user management endpoints
adminUserRouter.use(auth(UserRole.ADMIN));

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin
 */
adminUserRouter.get('/', validateQuery(adminUserQuerySchema), AdminUserController.getAllUsers);

/**
 * @route GET /api/admin/users/:id
 * @desc Get user details by ID
 * @access Admin
 */
adminUserRouter.get('/:id', validateParams(userIdParamSchema), AdminUserController.getUserById);

/**
 * @route PATCH /api/admin/users/:id
 * @desc Update user status
 * @access Admin
 */
adminUserRouter.patch(
  '/:id',
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  AdminUserController.updateUserStatus,
);

export const AdminUserRoutes = adminUserRouter;
