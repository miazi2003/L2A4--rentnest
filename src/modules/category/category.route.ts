import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { CategoryController } from './category.controller';
import { validateBody, validateParams } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './category.validation';
import { auth } from '../../middlewares/auth.middleware';

// Public Categories Router
const publicRouter = Router();
publicRouter.get('/', CategoryController.getAllCategories);

// Admin Categories Router
const adminRouter = Router();
adminRouter.post(
  '/',
  auth(UserRole.ADMIN),
  validateBody(createCategorySchema),
  CategoryController.createCategory,
);

adminRouter.put(
  '/:id',
  auth(UserRole.ADMIN),
  validateParams(categoryIdParamSchema),
  validateBody(updateCategorySchema),
  CategoryController.updateCategory,
);

adminRouter.delete(
  '/:id',
  auth(UserRole.ADMIN),
  validateParams(categoryIdParamSchema),
  CategoryController.deleteCategory,
);

export const CategoryPublicRoutes = publicRouter;
export const CategoryAdminRoutes = adminRouter;
