import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Controller handling user registration request.
 */
const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.register(req.body);
    res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
    ApiResponse.success(res, 201, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling user login request.
 */
const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);
    res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
    ApiResponse.success(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling Google OAuth login request.
 */
const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.googleLogin(req.body);
    res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
    ApiResponse.success(res, 200, 'Google login successful', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling Facebook OAuth login request.
 */
const facebookLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.facebookLogin(req.body);
    res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
    ApiResponse.success(res, 200, 'Facebook login successful', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling user logout request.
 */
const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    ApiResponse.success(res, 200, 'Logout successful', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving profile of the currently logged-in user.
 */
const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // req.user is attached by auth middleware
    const userId = req.user!.id;
    const result = await AuthService.getMe(userId);
    ApiResponse.success(res, 200, 'User profile retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  register,
  login,
  googleLogin,
  facebookLogin,
  logout,
  getMe,
};
