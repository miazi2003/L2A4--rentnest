import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from './profile.validation';
import { auth } from '../../middlewares/auth.middleware';

const profileRouter = Router();

// Apply auth guard globally for all profile management endpoints
profileRouter.use(auth());

/**
 * @route GET /api/profile
 * @desc Get authenticated user profile
 * @access Private
 */
profileRouter.get('/', ProfileController.getProfile);

/**
 * @route PATCH /api/profile
 * @desc Update user profile details
 * @access Private
 */
profileRouter.patch('/', validateBody(updateProfileSchema), ProfileController.updateProfile);

/**
 * @route PATCH /api/profile/password
 * @desc Change user password
 * @access Private
 */
profileRouter.patch(
  '/password',
  validateBody(changePasswordSchema),
  ProfileController.changePassword,
);

export const ProfileRoutes = profileRouter;
