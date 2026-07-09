import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PropertyController } from './property.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyIdParamSchema,
  propertyQuerySchema,
} from './property.validation';
import { auth } from '../../middlewares/auth.middleware';

// Public Router
const publicRouter = Router();
publicRouter.get(
  '/',
  validateQuery(propertyQuerySchema),
  PropertyController.getAvailableProperties,
);
publicRouter.get('/:id', validateParams(propertyIdParamSchema), PropertyController.getPropertyById);

// Landlord Router
const landlordRouter = Router();
landlordRouter.get('/', auth(UserRole.LANDLORD), PropertyController.getMyProperties);
landlordRouter.post(
  '/',
  auth(UserRole.LANDLORD),
  validateBody(createPropertySchema),
  PropertyController.createProperty,
);
landlordRouter.put(
  '/:id',
  auth(UserRole.LANDLORD),
  validateParams(propertyIdParamSchema),
  validateBody(updatePropertySchema),
  PropertyController.updateProperty,
);
landlordRouter.delete(
  '/:id',
  auth(UserRole.LANDLORD),
  validateParams(propertyIdParamSchema),
  PropertyController.deleteProperty,
);

export const PropertyPublicRoutes = publicRouter;
export const PropertyLandlordRoutes = landlordRouter;
