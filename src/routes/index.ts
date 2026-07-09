import { Router } from 'express';
import v1Router from './v1';
import { AuthRoutes } from '../modules/auth/auth.route';

const rootRouter = Router();

// Mount Auth Module under /api/auth
rootRouter.use('/auth', AuthRoutes);

// Mount API versions
rootRouter.use('/v1', v1Router);

export default rootRouter;
