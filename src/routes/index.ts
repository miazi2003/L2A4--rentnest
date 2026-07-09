import { Router } from 'express';
import v1Router from './v1';

const rootRouter = Router();

// Mount API versions
rootRouter.use('/v1', v1Router);

export default rootRouter;
