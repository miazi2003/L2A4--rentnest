import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import {
  registerValidationSchema,
  loginValidationSchema,
  googleLoginValidationSchema,
  facebookLoginValidationSchema,
} from './auth.validation';
import { auth } from '../../middlewares/auth.middleware';

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @desc Register tenant or landlord user
 * @access Public
 */
authRouter.post('/register', validateBody(registerValidationSchema), AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user using credentials
 * @access Public
 */
authRouter.post('/login', validateBody(loginValidationSchema), AuthController.login);

/**
 * @route POST /api/auth/google
 * @desc Login user using Google OAuth ID token credential
 * @access Public
 */
authRouter.post('/google', validateBody(googleLoginValidationSchema), AuthController.googleLogin);

/**
 * @route POST /api/auth/facebook
 * @desc Login user using Facebook OAuth access token
 * @access Public
 */
authRouter.post(
  '/facebook',
  validateBody(facebookLoginValidationSchema),
  AuthController.facebookLogin,
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and clear access token cookie
 * @access Public
 */
authRouter.post('/logout', AuthController.logout);

/**
 * @route GET /api/auth/me
 * @desc Retrieve profile details of logged-in user
 * @access Protected
 */
authRouter.get('/me', auth(), AuthController.getMe);

export const AuthRoutes = authRouter;
