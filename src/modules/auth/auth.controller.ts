import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Controller handling user registration request.
 */
const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AuthService.register(req.body);
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
    ApiResponse.success(res, 200, 'Login successful', result);
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
  getMe,
};
