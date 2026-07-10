import { Request, Response, NextFunction } from 'express';
import { AdminUserService } from './admin.service';
import { ApiResponse } from '../../utils/apiResponse';
import { adminUserQuerySchema,  IUpdateUserStatusInput } from './admin.validation';

/**
 * Controller retrieving all users with query filters.
 */
const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = adminUserQuerySchema.parse(req.query);

    const result = await AdminUserService.getAllUsers(parsed);

    ApiResponse.success(
      res,
      200,
      'Users list retrieved successfully',
      result.data,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving details of a single user by ID.
 */
const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await AdminUserService.getUserById(id);
    ApiResponse.success(res, 200, 'User details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating user status.
 */
const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const result = await AdminUserService.updateUserStatus(
      id,
      adminId,
      req.body as IUpdateUserStatusInput,
    );
    ApiResponse.success(res, 200, 'User status updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const AdminUserController = {
  getAllUsers,
  getUserById,
  updateUserStatus,
};
