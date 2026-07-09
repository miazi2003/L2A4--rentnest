import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Controller retrieving authenticated user's profile details.
 */
const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await ProfileService.getProfile(userId);
    ApiResponse.success(res, 200, 'User profile retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating authenticated user's profile.
 */
const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await ProfileService.updateProfile(userId, req.body);
    ApiResponse.success(res, 200, 'User profile updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling password change.
 */
const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    await ProfileService.changePassword(userId, req.body);
    ApiResponse.success(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const ProfileController = {
  getProfile,
  updateProfile,
  changePassword,
};
