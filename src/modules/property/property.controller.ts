import { Request, Response, NextFunction } from 'express';
import { PropertyService } from './property.service';
import { ApiResponse } from '../../utils/apiResponse';

/**
 * Controller retrieving all available properties.
 */
const getAvailableProperties = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await PropertyService.getAvailableProperties();
    ApiResponse.success(res, 200, 'Available properties retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving details of a single property by ID.
 */
const getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await PropertyService.getPropertyById(id);
    ApiResponse.success(res, 200, 'Property details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller creating a property for the authenticated landlord.
 */
const createProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const result = await PropertyService.createProperty(landlordId, req.body);
    ApiResponse.success(res, 201, 'Property created successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating a property details.
 */
const updateProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const landlordId = req.user!.id;
    const result = await PropertyService.updateProperty(id, landlordId, req.body);
    ApiResponse.success(res, 200, 'Property updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller deleting a property.
 */
const deleteProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const landlordId = req.user!.id;
    await PropertyService.deleteProperty(id, landlordId);
    ApiResponse.success(res, 200, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller listing properties belonging to the logged-in landlord.
 */
const getMyProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const landlordId = req.user!.id;
    const result = await PropertyService.getMyProperties(landlordId);
    ApiResponse.success(res, 200, 'Landlord properties retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const PropertyController = {
  getAvailableProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
};
