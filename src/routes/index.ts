import { Router } from 'express';
import v1Router from './v1';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CategoryPublicRoutes, CategoryAdminRoutes } from '../modules/category/category.route';

const rootRouter = Router();

// Mount Auth Module under /api/auth
rootRouter.use('/auth', AuthRoutes);

// Mount Category Public routes under /api/categories
rootRouter.use('/categories', CategoryPublicRoutes);

// Mount Category Admin routes under /api/admin/categories
rootRouter.use('/admin/categories', CategoryAdminRoutes);

// Mount API versions
rootRouter.use('/v1', v1Router);

export default rootRouter;
