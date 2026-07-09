import { Request, Response, NextFunction } from 'express';
import { AdminPropertyService } from './admin.property.service';
import { ApiResponse } from '../../utils/apiResponse';
import { IAdminPropertyQuery } from './admin.property.validation';

/**
 * Controller retrieving properties list with search and filter parameters.
 */
const getAllProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await AdminPropertyService.getAllProperties(
      req.query as unknown as IAdminPropertyQuery,
    );
    ApiResponse.success(res, 200, 'Properties retrieved successfully', result.data, result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving details of a single property.
 */
const getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await AdminPropertyService.getPropertyById(id);
    ApiResponse.success(res, 200, 'Property details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const AdminPropertyController = {
  getAllProperties,
  getPropertyById,
};
