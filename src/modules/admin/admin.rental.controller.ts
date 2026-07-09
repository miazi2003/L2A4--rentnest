import { Request, Response, NextFunction } from 'express';
import { AdminRentalService } from './admin.rental.service';
import { ApiResponse } from '../../utils/apiResponse';
import { IAdminRentalQuery } from './admin.rental.validation';

/**
 * Controller listing rental requests.
 */
const getAllRentals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AdminRentalService.getAllRentals(
      req.query as unknown as IAdminRentalQuery,
    );
    ApiResponse.success(
      res,
      200,
      'Rental requests retrieved successfully',
      result.data,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving details of a single rental request.
 */
const getRentalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await AdminRentalService.getRentalById(id);
    ApiResponse.success(res, 200, 'Rental request details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const AdminRentalController = {
  getAllRentals,
  getRentalById,
};
